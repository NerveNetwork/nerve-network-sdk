import nerve from 'nerve-sdk-js';
import {
  getTradeExactIn,
  getAvailableStablePairList,
  getStableSwapPairInfo,
  getNerveFeeAddress as getNerveFeeAddressApi,
  getChainAssetInfo
} from '../service/api';
import {
  isBeta,
  timesDecimals,
  divisionDecimals,
  getChainInfo,
  Times,
  fixNumber,
  Minus
} from '../utils/utils';
import { sendTxWithUnSignedHex, checkProvider } from './NERVEApi';

function getSpecialStableKeys() {
  const USDTN_kEY = isBeta ? '5-102' : '9-220';
  const NESTN_KEY = isBeta ? '9-339' : '9-339';
  const USDCN_KEY = isBeta ? '9-388' : '9-388';
  const ETHN_KEY = isBeta ? '9-628' : '9-628';

  // StablecoinKeys that allows path like this
  // USDT -> USDTM -> NVT(Others), NEST -> NESTN -> NVT(Others)...
  const specialStableKeys = [USDTN_kEY, NESTN_KEY, USDCN_KEY, ETHN_KEY];
  return specialStableKeys;
}

const expireTime = 2 * 60 * 1000;

class NerveSwap {
  constructor() {
    this.isStableCoinForStableCoin = false; // USDT(bsc) -> USDT(eth)
    this.isStableCoinForOthers = false; // USDT -> NVT
    this.isOthersForStableCoin = false; // NVT-> USDT
    this.isStableCoinSwap = false; // USDT ->USDTN / USDTN -> USDT
    this.stableCoins = {}; // {5-72: 5-102, 5-73: 5-102, ...}
    this.stableSwapFeeAddress = '';
    this.stablePairList = [];
    this.storedExactInPairInfo = {};
    this.cacheTime = null;
    this.useStableRoute = false; // nvt => usdt ---- use nvt -> usdtn -> usdt, or use nvt -> usdt directly
    this.getStablePairList();
    this.getNerveFeeAddress();
  }

  async getStablePairList() {
    const res = await getAvailableStablePairList();
    if (res) {
      this.stablePairList = res;
      res.map(v => {
        Object.keys(v.groupCoin).map(coin => {
          if (!v.groupCoin[coin].removed) {
            this.stableCoins[coin] = v.lpToken;
          }
        });
      });
    }
  }
  async getNerveFeeAddress() {
    const res = await getNerveFeeAddressApi();
    if (res) {
      this.stableSwapFeeAddress = res.nerveFeeAddress;
    }
  }

  async storePairInfo(fromAssetKey, toAssetKey, amount, refresh) {
    if (!this.stablePairList.length) {
      await this.getStablePairList();
    }
    let result = await this.storeSwapPairInfo(
      fromAssetKey,
      toAssetKey,
      amount,
      refresh
    );
    return result;
    /* if (!this.isStableCoinSwap && !this.isStableCoinForStableCoin) {
      let result = await this.storeSwapPairInfo(
        fromAssetKey,
        toAssetKey,
        amount,
        refresh
      );
      if (this.isStableCoinForOthers || this.isOthersForStableCoin) {
        const { from, to, inAmount } = await this.checkSpecialSwapAsset(
          fromAssetKey,
          toAssetKey,
          amount
        );
        result = await this.storeSwapPairInfo(from, to, inAmount, refresh);
      }
      return result;
    }
    return null; */
  }

  /**
   *
   * @param {object} param
   * @param {string} param.fromAssetKey
   * @param {string} param.toAssetKey
   * @param {string} param.amount
   * @param {boolean} [param.refresh]
   * @param {string} [param.direction = from | to]
   * @returns {Promise<{amount: string, priceImpact: string, routes: string[], fee: string}>}
   */
  async getSwapInfo({
    fromAssetKey,
    toAssetKey,
    amount,
    direction = 'from',
    refresh = false
  }) {
    if (!this.stablePairList.length) {
      await this.getStablePairList();
    }
    this.checkIsSpecialSwap(fromAssetKey, toAssetKey);

    if (this.isStableCoinSwap) {
      // USDT ->USDTN / USDTN -> USDT
      return this.calStableCoinSwapAmount(
        fromAssetKey,
        toAssetKey,
        amount,
        direction
      );
    } else if (this.isStableCoinForStableCoin) {
      // USDT -> USDT
      return this.calStableCoinForStableCoinAmount(
        fromAssetKey,
        toAssetKey,
        amount,
        direction
      );
    } else {
      await this.storeSwapPairInfo(fromAssetKey, toAssetKey, amount, refresh);
      const originalKey = fromAssetKey + '_' + toAssetKey;
      const pairsInfo = this.storedExactInPairInfo[originalKey];

      let result = this.calSwapAmount(
        pairsInfo,
        fromAssetKey,
        toAssetKey,
        amount,
        direction
      );

      this.useStableRoute = false; // nvt => usdt ---- use nvt -> usdtn -> usdt, or use nvt -> usdt directly
      if (this.isStableCoinForOthers || this.isOthersForStableCoin) {
        const { from, to, inAmount } = await this.checkSpecialSwapAsset(
          fromAssetKey,
          toAssetKey,
          amount,
          direction
        );
        await this.storeSwapPairInfo(from, to, inAmount, refresh);
        const newPairsInfo = this.storedExactInPairInfo[from + '_' + to];
        const stableRouteResult = this.calSwapAmount(
          newPairsInfo,
          from,
          to,
          inAmount,
          direction
        );
        if (stableRouteResult.amount - result.amount >= 0) {
          // Compare direct routing and stable exchange routing,choose the best route
          this.useStableRoute = true;
          result = stableRouteResult;
        }
      }
      const { priceImpact, routes } = result;

      let _amount = result.amount;
      let fee = result.fee;

      // check amount of different decimals
      if (this.isStableCoinForOthers || this.isOthersForStableCoin) {
        const res = this.handleSpecialSwapAmountRes(
          fromAssetKey,
          toAssetKey,
          _amount,
          fee,
          direction
        );
        _amount = res.amount;
        fee = res.fee;
      }

      if (routes.length) {
        if (this.isStableCoinForOthers && this.useStableRoute) {
          routes.unshift(fromAssetKey);
        } else if (this.isOthersForStableCoin && this.useStableRoute) {
          routes.push(toAssetKey);
        }
      }
      return {
        amount: _amount,
        priceImpact,
        routes,
        fee
      };
    }
  }

  checkIsSpecialSwap(token1Key, token2Key) {
    this.resetSpecialSwap();
    if (token1Key && token2Key) {
      const lpKey1 = this.stableCoins[token1Key];
      const lpKey2 = this.stableCoins[token2Key];
      if (lpKey1 && lpKey1 === lpKey2) {
        // USDT(bsc) -> USDT(eth)
        this.isStableCoinForStableCoin = true;
        return;
      }
      if (token1Key === lpKey2 || token2Key === lpKey1) {
        // USDT ->USDTN / USDTN -> USDT
        this.isStableCoinSwap = true;
        return;
      }
      const specialStableKeys = getSpecialStableKeys();
      if (lpKey1 && specialStableKeys.includes(lpKey1)) {
        // USDT -> NVT
        this.isStableCoinForOthers = true;
        return;
      }
      if (lpKey2 && specialStableKeys.includes(lpKey2)) {
        // NVT-> USDT
        this.isOthersForStableCoin = true;
        return;
      }
    }
  }
  resetSpecialSwap() {
    this.isStableCoinForStableCoin = false;
    this.isStableCoinForOthers = false;
    this.isOthersForStableCoin = false;
    this.isStableCoinSwap = false;
  }

  calStableCoinSwapAmount(fromAssetKey, toAssetKey, amount, direction) {
    let fromAssetInfo, toAssetInfo;
    if (this.stableCoins[fromAssetKey] !== toAssetKey) {
      // USDTN -> USDT
      const stableN = this.stablePairList.find(v => v.lpToken === fromAssetKey);
      fromAssetInfo = { ...stableN, decimals: stableN.lpTokenDecimals };
      toAssetInfo = stableN.groupCoin[toAssetKey];
    } else {
      // USDT -> USDTN
      const stableN = this.stablePairList.find(v => v.lpToken === toAssetKey);
      fromAssetInfo = stableN.groupCoin[fromAssetKey];
      toAssetInfo = { ...stableN, decimals: stableN.lpTokenDecimals };
    }
    // const assetKey = this.stableCoins[fromAssetKey] !== toAssetKey ? fromAssetKey : toAssetKey;
    // const stableN = this.stablePairList.find(v => v.lpToken === assetKey);
    // const fromAssetInfo = stableN.groupCoin[fromAssetKey];
    // const toAssetInfo = stableN.groupCoin[toAssetKey];

    const fromDecimal =
      direction === 'from' ? fromAssetInfo.decimals : toAssetInfo.decimals;
    const targetDecimal =
      direction === 'from' ? toAssetInfo.decimals : fromAssetInfo.decimals;
    const fromAmount = divisionDecimals(amount, fromDecimal);

    if (this.stableCoins[fromAssetKey] !== toAssetKey) {
      // USDTN -> USDT, check pool balance
      const balance = divisionDecimals(
        toAssetInfo.balance,
        toAssetInfo.decimals
      );
      if (balance - fromAmount < 0) {
        // Insufficient pool balance
        return {
          amount: '0',
          priceImpact: '0',
          routes: [],
          fee: '0'
        };
      }
    }
    return {
      amount: timesDecimals(fromAmount, targetDecimal),
      priceImpact: '0',
      routes: [fromAssetKey, toAssetKey],
      fee: '0'
    };
  }

  calStableCoinForStableCoinAmount(
    fromAssetKey,
    toAssetKey,
    amount,
    direction
  ) {
    const stableNKey = this.stableCoins[fromAssetKey];
    const stableN = this.stablePairList.find(v => v.lpToken === stableNKey);
    const fromAssetInfo = stableN.groupCoin[fromAssetKey];
    const toAssetInfo = stableN.groupCoin[toAssetKey];
    const fromDecimal =
      direction === 'from' ? fromAssetInfo.decimals : toAssetInfo.decimals;
    const targetDecimal =
      direction === 'from' ? toAssetInfo.decimals : fromAssetInfo.decimals;
    const fromAmount = divisionDecimals(amount, fromDecimal);

    const poolBalance = divisionDecimals(
      toAssetInfo.balance,
      toAssetInfo.decimals
    );

    if (poolBalance - fromAmount < 0) {
      // Insufficient pool balance
      return {
        amount: '0',
        priceImpact: '0',
        routes: [],
        fee: '0'
      };
    }
    return {
      amount: timesDecimals(fromAmount, targetDecimal),
      priceImpact: '0',
      routes: [fromAssetKey, toAssetKey],
      fee: timesDecimals(
        fixNumber(
          Times(fromAmount, stableN.feeRate).toFixed(),
          fromAssetInfo.decimals
        ),
        fromAssetInfo.decimals
      )
    };
  }

  calSwapAmount(pairsInfo, fromAssetKey, toAssetKey, amount, direction) {
    const pairs = Object.values(pairsInfo || {});
    if (!pairsInfo || !pairs.length) {
      return {
        amount: '0',
        priceImpact: '0',
        routes: [],
        fee: '0'
      };
    }
    const bestExact =
      direction === 'from'
        ? this.bestTradeExactIn(amount, pairs, fromAssetKey, toAssetKey)
        : this.bestTradeExactOut(amount, pairs, fromAssetKey, toAssetKey);
    if (bestExact) {
      const inAmount = bestExact.tokenAmountIn.amount.toString();
      const outAmount = bestExact.tokenAmountOut.amount.toFixed();
      const tokenPathArray = bestExact.path;
      const routes = [];
      bestExact.path.map(v => {
        routes.push(v.chainId + '-' + v.assetId);
      });
      const pairsArray = [];
      for (let i = 0; i < tokenPathArray.length - 1; i++) {
        const token0 = tokenPathArray[i];
        const token1 = tokenPathArray[i + 1];
        const key = `${token0.chainId}-${token0.assetId}_${token1.chainId}-${token1.assetId}`;
        const reverseKey = `${token1.chainId}-${token1.assetId}_${token0.chainId}-${token0.assetId}`;
        if (pairsInfo[key]) {
          pairsArray.push(pairsInfo[key]);
        } else if (pairsInfo[reverseKey]) {
          pairsArray.push(pairsInfo[reverseKey]);
        }
      }
      const fromAmount = direction === 'from' ? inAmount : outAmount;
      const toAmount = direction === 'from' ? outAmount : inAmount;
      // console.log(tokenPathArray, '333');
      const priceImpact = nerve.swap.getPriceImpact(
        [fromAmount, toAmount],
        tokenPathArray,
        pairsArray
      );
      return {
        amount: outAmount,
        priceImpact: priceImpact.toFixed(),
        routes,
        fee: bestExact.pathFee
      };
    } else {
      return {
        amount: '0',
        priceImpact: '0',
        routes: [],
        fee: '0'
      };
    }
  }

  getNerveChainId() {
    return getChainInfo().NERVE.chainId;
  }
  bestTradeExactIn(amount, pairs, fromAssetKey, toAssetKey) {
    const [fromAssetChainId, fromAssetId] = fromAssetKey.split('-');
    const [toAssetChainId, toAssetId] = toAssetKey.split('-');
    const tokenAmountIn = nerve.swap.tokenAmount(
      +fromAssetChainId,
      +fromAssetId,
      amount
    );
    const tokenOut = nerve.swap.token(+toAssetChainId, +toAssetId);
    const maxPairSize = 3;
    const res = nerve.swap.bestTradeExactIn(
      this.getNerveChainId(),
      pairs,
      tokenAmountIn,
      tokenOut,
      maxPairSize
    );
    if (res && Object.values(res).length) {
      return res;
    } else {
      return null;
    }
  }
  bestTradeExactOut(amount, pairs, fromAssetKey, toAssetKey) {
    const [fromAssetChainId, fromAssetId] = fromAssetKey.split('-');
    const [toAssetChainId, toAssetId] = toAssetKey.split('-');
    const tokenIn = nerve.swap.token(+fromAssetChainId, +fromAssetId);
    const tokenAmountOut = nerve.swap.tokenAmount(
      +toAssetChainId,
      +toAssetId,
      amount
    );
    const maxPairSize = 3;
    const res = nerve.swap.bestTradeExactOut(
      this.getNerveChainId(),
      pairs,
      tokenIn,
      tokenAmountOut,
      maxPairSize
    );
    if (res && Object.values(res).length) {
      return {
        path: res.path,
        tokenAmountIn: res.tokenAmountOut,
        tokenAmountOut: res.tokenAmountIn,
        pathFee: res.pathFee
      };
    } else {
      return null;
    }
  }

  async storeSwapPairInfo(fromAssetKey, toAssetKey, amount, refresh) {
    const key = fromAssetKey + '_' + toAssetKey;
    const now = new Date().getTime();
    const expired = !this.cacheTime || now - this.cacheTime > expireTime;
    const info = this.storedExactInPairInfo[key];
    if (!info || refresh) {
      const allExactIn = await getTradeExactIn(
        fromAssetKey,
        toAssetKey,
        amount
      );
      const pairsInfo = {};
      if (allExactIn.length) {
        for (let i = 0; i < allExactIn.length; i++) {
          const token0 = allExactIn[i].token0;
          const token1 = allExactIn[i].token1;
          pairsInfo[
            `${token0.assetChainId}-${token0.assetId}_${token1.assetChainId}-${token1.assetId}`
          ] = nerve.swap.pair(
            {
              chainId: token0.assetChainId,
              assetId: token0.assetId
            },
            {
              chainId: token1.assetChainId,
              assetId: token1.assetId
            },
            allExactIn[i].reserve0,
            allExactIn[i].reserve1,
            allExactIn[i].feeRate
          );
        }
      }
      this.storedExactInPairInfo[key] = pairsInfo;
    }
    return this.storedExactInPairInfo[key];
  }

  // determine fromKey,toKey,inAmount by swap type. ex: NVT -> USDT、USDT -> NVT
  async checkSpecialSwapAsset(fromAssetKey, toAssetKey, amount, direction) {
    let from = fromAssetKey,
      to = toAssetKey,
      inAmount = amount;
    let lpToken;
    if (this.isStableCoinForOthers) {
      lpToken = this.stableCoins[fromAssetKey];
      const stableN = this.stablePairList.find(v => v.lpToken === lpToken);
      const originalFromInfo = stableN.groupCoin[fromAssetKey];
      from = lpToken;
      if (direction === 'from') {
        inAmount = timesDecimals(
          divisionDecimals(inAmount, originalFromInfo.decimals),
          stableN.lpTokenDecimals
        );
      }
    } else if (this.isOthersForStableCoin) {
      lpToken = this.stableCoins[toAssetKey];
      const stableN = this.stablePairList.find(v => v.lpToken === lpToken);
      const originalToInfo = stableN.groupCoin[toAssetKey];
      to = lpToken;
      if (direction === 'to') {
        inAmount = timesDecimals(
          divisionDecimals(inAmount, originalToInfo.decimals),
          stableN.lpTokenDecimals
        );
      }
    }

    return {
      from,
      to,
      inAmount
    };
  }

  // handle different decimals of USDT
  handleSpecialSwapAmountRes(fromAssetKey, toAssetKey, amount, fee, direction) {
    let finalAmount = amount,
      finalFee = fee;
    if (this.isStableCoinForOthers) {
      const lpToken = this.stableCoins[fromAssetKey];
      const stableN = this.stablePairList.find(v => v.lpToken === lpToken);
      const originalFromInfo = stableN.groupCoin[fromAssetKey];
      finalFee = timesDecimals(
        divisionDecimals(finalFee, stableN.lpTokenDecimals),
        originalFromInfo.decimals
      );
      if (direction === 'to') {
        finalAmount = timesDecimals(
          divisionDecimals(finalAmount, stableN.lpTokenDecimals),
          originalFromInfo.decimals
        );
      }
    } else if (this.isOthersForStableCoin && direction === 'from') {
      const lpToken = this.stableCoins[toAssetKey];
      const stableN = this.stablePairList.find(v => v.lpToken === lpToken);
      const originalToInfo = stableN.groupCoin[toAssetKey];
      finalAmount = timesDecimals(
        divisionDecimals(finalAmount, stableN.lpTokenDecimals),
        originalToInfo.decimals
      );
    }
    return {
      amount: finalAmount,
      fee: finalFee
    };
  }

  // determine fromKey,toKey,inAmount by swap type. ex: NVT -> USDT、USDT -> NVT
  async checkSpecialSwapAsset1(fromAssetKey, toAssetKey, amount) {
    let from = fromAssetKey,
      to = toAssetKey,
      inAmount = amount;
    let lpToken;
    if (this.isStableCoinForOthers) {
      lpToken = this.stableCoins[fromAssetKey];
    } else if (this.isOthersForStableCoin) {
      lpToken = this.stableCoins[toAssetKey];
    }
    let lpTokenInfo;
    if (lpToken) {
      const lpAddress = this.stablePairList.find(
        v => v.lpToken === lpToken
      )?.address;
      lpTokenInfo = this.lpTokenInfoMap[lpToken];
      const useCache = this.checkUseCache();
      if (!lpTokenInfo || !useCache) {
        lpTokenInfo = await getStableSwapPairInfo(lpAddress);
      }
      if (lpTokenInfo) {
        lpTokenInfo = {
          ...lpTokenInfo,
          decimals: lpTokenInfo.tokenLP.decimals,
          assetKey: lpToken
        };
        this.lpTokenInfoMap[lpToken] = lpTokenInfo;
      }
    }
    if (lpTokenInfo) {
      if (this.isStableCoinForOthers) {
        from = lpTokenInfo.assetKey;
        const stableCoin = lpTokenInfo.coins.find(
          v => v.assetChainId + '-' + v.assetId === fromAssetKey
        );
        const oldDecimals = stableCoin.decimals;
        const newDecimals = lpTokenInfo.decimals;
        inAmount = timesDecimals(
          divisionDecimals(inAmount, oldDecimals),
          newDecimals
        );
      } else {
        to = lpTokenInfo.assetKey;
      }
    }

    return {
      from,
      to,
      inAmount
    };
  }

  /**
   *
   * @param {object} param
   * @param {string} param.provider
   * @param {string} param.from
   * @param {string} param.fromAssetKey
   * @param {string} param.toAssetKey
   * @param {string} param.amount
   * @param {string} [param.slippage='0.5']
   * @param {string} [param.remark]
   * @param {string} param.EVMAddress
   * @param {string} param.pub
   * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
   */
  async swapTrade({
    provider,
    from,
    fromAssetKey,
    toAssetKey,
    amount,
    slippage = '0.5',
    remark = '',
    pub,
    EVMAddress
  }) {
    checkProvider(provider);
    if (!this.stablePairList.length) {
      await this.getStablePairList();
    }
    this.checkIsSpecialSwap(fromAssetKey, toAssetKey);
    const deadline = nerve.swap.currentTime() + 300;
    let tx;
    if (this.isStableCoinSwap) {
      tx = await this.getStableCoinSwapTX(
        from,
        from,
        fromAssetKey,
        toAssetKey,
        amount,
        deadline,
        remark
      );
    } else if (this.isStableCoinForStableCoin) {
      tx = await this.getStableForStableTX(
        from,
        from,
        fromAssetKey,
        toAssetKey,
        amount,
        deadline,
        remark
      );
    } else {
      tx = await this.getSwapTx(
        from,
        fromAssetKey,
        toAssetKey,
        amount,
        slippage,
        deadline,
        remark
      );
    }
    return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress);
  }

  async getStableCoinSwapTX(
    from,
    to,
    fromAssetKey,
    toAssetKey,
    amount,
    deadline,
    remark
  ) {
    const [chainId, assetId] = fromAssetKey.split('-');
    let tx;
    if (this.stableCoins[fromAssetKey] === toAssetKey) {
      // USDT -> USDTN
      const stableN = this.stablePairList.find(v => v.lpToken === toAssetKey);
      const stablePairAddress = stableN.address;
      const tokenAmounts = [nerve.swap.tokenAmount(+chainId, +assetId, amount)];
      tx = await nerve.swap.stableSwapAddLiquidity(
        from,
        stablePairAddress,
        tokenAmounts,
        deadline,
        to,
        remark
      );
    } else {
      // USDTN -> USDT
      const stableN = this.stablePairList.find(v => v.lpToken === fromAssetKey);
      const stablePairAddress = stableN.address;
      const tokenAmountLP = nerve.swap.tokenAmount(+chainId, +assetId, amount);
      const receiveOrderIndexs = await this.getReceiveOrderIndex(
        fromAssetKey,
        toAssetKey,
        amount,
        stablePairAddress
      );
      tx = await nerve.swap.stableSwapRemoveLiquidity(
        from,
        stablePairAddress,
        tokenAmountLP,
        receiveOrderIndexs,
        deadline,
        to,
        remark
      );
    }
    return tx;
  }

  async getReceiveOrderIndex(stableNKey, assetKey, amount, stablePairAddress) {
    const { index, info } = await this.getStableCoinInfoAndIndex(
      stableNKey,
      assetKey,
      stablePairAddress
    );
    if (index !== -1) {
      // consider different dicimals USDT
      // const balance = info.balances[index];
      // if (Minus(amount, balance) > 0) {
      //   throw new Error('Insufficient pool balance');
      // }
      const arr = new Array(info.coins.length).fill(1).map((v, i) => i);
      return arr.splice(index, 1).concat(arr);
    }
    return [];
  }
  async getStableCoinInfoAndIndex(stableNKey, assetKey, pariAddress) {
    const info = await getStableSwapPairInfo(pariAddress);

    let index = -1;
    if (info) {
      index = info.coins.findIndex(
        v => v.assetChainId + '-' + v.assetId === assetKey
      );
    }
    return { info, index };
  }

  async getStableForStableTX(
    from,
    to,
    fromAssetKey,
    toAssetKey,
    amount,
    deadline,
    remark
  ) {
    const stableKey = this.stableCoins[fromAssetKey];
    const stableN = this.stablePairList.find(v => v.lpToken === stableKey);
    const stablePairAddress = stableN.address;
    const [chainId, assetId] = fromAssetKey.split('-');
    const amountIns = [nerve.swap.tokenAmount(+chainId, +assetId, amount)];
    // get toAsset index in pool
    const { index: tokenOutIndex } = await this.getStableCoinInfoAndIndex(
      stableKey,
      toAssetKey,
      stablePairAddress
    );
    if (!this.stableSwapFeeAddress) {
      await this.getNerveFeeAddress();
    }
    const feeTo = this.stableSwapFeeAddress;
    const fromAssetInfo = stableN.groupCoin[fromAssetKey];
    const feeAmount = fixNumber(
      Times(amount, stableN.feeRate).toFixed(),
      fromAssetInfo.decimals
    );
    const feeTokenAmount = nerve.swap.tokenAmount(
      +chainId,
      +assetId,
      feeAmount
    );
    return await nerve.swap.stableSwapTrade(
      from,
      stablePairAddress,
      amountIns,
      tokenOutIndex,
      feeTo,
      deadline,
      to,
      remark,
      feeTokenAmount
    );
  }

  async getSwapTx(
    from,
    fromAssetKey,
    toAssetKey,
    amount,
    slippage,
    deadline,
    remark
  ) {
    const { amount: amountOut } = await this.getSwapInfo({
      fromAssetKey,
      toAssetKey,
      amount,
      refresh: true
    });
    // const toAssetInfo = await getChainAssetInfo(toAssetKey);
    const amountOutMin = Times(amountOut, 1 - slippage / 100).toFixed(0, 1);
    const feeTo = null;
    const to = from;
    const [fromAssetChainId, fromAssetId] = fromAssetKey.split('-');
    const [toAssetChainId, toAssetId] = toAssetKey.split('-');
    let tx;
    if (this.isStableCoinForOthers && this.useStableRoute) {
      //USDT -> NVT, use USDT -> USDTN -> NVT
      const tokenIn = nerve.swap.token(+fromAssetChainId, +fromAssetId);

      const stableNKey = this.stableCoins[fromAssetKey];
      const stableN = this.stablePairList.find(v => v.lpToken === stableNKey);
      const stablePairAddress = stableN.address; // 稳定币交易对地址
      const fromAssetInfo = stableN.groupCoin[fromAssetKey];
      const lpAmountIn = timesDecimals(
        divisionDecimals(amount, fromAssetInfo.decimals),
        stableN.lpTokenDecimals
      );

      const key = stableNKey + '_' + toAssetKey;
      const pairsInfo = this.storedExactInPairInfo[key];
      const pairs = Object.values(pairsInfo);
      const tokenPath = this.bestTradeExactIn(
        lpAmountIn,
        pairs,
        stableNKey,
        toAssetKey
      )?.path;
      tokenPath.unshift(tokenIn);
      tx = await nerve.swap.stableLpSwapTrade(
        from,
        stablePairAddress,
        amount,
        tokenPath,
        amountOutMin,
        feeTo,
        deadline,
        to,
        remark
      );
    } else if (this.isOthersForStableCoin && this.useStableRoute) {
      // NVT -> USDT, use NVT -> USDTN -> USDT
      const tokenOut = nerve.swap.token(+toAssetChainId, +toAssetId);

      const stableNKey = this.stableCoins[toAssetKey];
      const stableN = this.stablePairList.find(v => v.lpToken === stableNKey);
      const key = fromAssetKey + '_' + stableN.lpToken;
      const pairsInfo = this.storedExactInPairInfo[key];
      const pairs = Object.values(pairsInfo);
      const tokenPath = this.bestTradeExactIn(
        amount,
        pairs,
        fromAssetKey,
        stableN.lpToken
      )?.path;
      tx = await nerve.swap.swapTradeStableRemoveLp(
        from,
        amount,
        tokenPath,
        amountOutMin,
        feeTo,
        deadline,
        to,
        tokenOut,
        remark
      );
    } else {
      // 币币交换资产路径，路径中最后一个资产，是用户要买进的资产
      const key = fromAssetKey + '_' + toAssetKey;
      const pairsInfo = this.storedExactInPairInfo[key];
      const pairs = Object.values(pairsInfo);
      const tokenPath = this.bestTradeExactIn(
        amount,
        pairs,
        fromAssetKey,
        toAssetKey
      )?.path;
      tx = await nerve.swap.swapTrade(
        from,
        amount,
        tokenPath,
        amountOutMin,
        feeTo,
        deadline,
        to,
        remark
      );
    }
    return tx;
  }
}

export default NerveSwap;
