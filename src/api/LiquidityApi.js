import nerve from 'nerve-sdk-js';
import {
  getSwapPairInfo,
  calMinAmountOnSwapAddLiquidity,
  calMinAmountOnSwapRemoveLiquidity
} from '../service/api';
import { Plus, Division } from '../utils/utils';
import { sendTxWithUnSignedHex, checkProvider } from './NERVEApi';

const swapPairInfo = {};
let cacheTime = null;
const expireTime = 2 * 60 * 1000;

/**
 * @param {object} param
 * @param {string} param.tokenAKey
 * @param {string} param.tokenBKey
 * @param {boolean} [param.refresh]
 * @returns {Promise<{amount: string, share: string}>}
 */
export async function getPairInfo(tokenAKey, tokenBKey, refresh = false) {
  const key = tokenAKey + '_' + tokenBKey;
  const now = new Date().getTime();
  const expired = !cacheTime || now - cacheTime > expireTime;
  let info = swapPairInfo[key] || null;
  if (!info || refresh || expired) {
    info = await getSwapPairInfo(tokenAKey, tokenBKey);
    if (info) {
      const token0Key = info.token0.assetChainId + '-' + info.token0.assetId;
      const reserveFrom =
        token0Key === tokenAKey ? info.reserve0 : info.reserve1;
      const reserveTo = token0Key === tokenAKey ? info.reserve1 : info.reserve0;
      swapPairInfo[key] = {
        reserveFrom,
        reserveTo,
        ...info
      };
      cacheTime = now;
    }
  }
  return swapPairInfo[key] || null;
}

/**
 * @param {object} param
 * @param {string} param.tokenAKey
 * @param {string} param.tokenBKey
 * @param {string} param.amount
 * @param {string} [param.direction= from | to]
 * @param {boolean} [param.refresh]
 * @returns {Promise<string>}
 */
export async function calAddLiquidity({
  tokenAKey,
  tokenBKey,
  amount,
  direction = 'from',
  refresh = false
}) {
  const info = await getPairInfo(tokenAKey, tokenBKey, refresh);
  if (info) {
    const { reserveFrom, reserveTo } = info;
    // const token0Key = info.token0.assetChainId + '-' + info.token0.assetId;
    // const reserveFrom = token0Key === tokenAKey ? info.reserve0 : info.reserve1;
    // const reserveTo = token0Key === tokenAKey ? info.reserve1 : info.reserve0;
    const reserveA = direction === 'from' ? reserveFrom : reserveTo;
    const reserveB = direction === 'from' ? reserveTo : reserveFrom;
    const result = nerve.swap.quote(amount, reserveA, reserveB).toFixed();
    /* let share = '0';
    if (reserveFrom === 0 || reserveTo === 0) {
      share = '100';
    } else {
      const fromAmount = direction === 'from' ? amount : result;
      const allReserveFrom = Plus(fromAmount, reserveFrom);
      share = Division(fromAmount, allReserveFrom).toFixed();
    } */
    return result;
  } else {
    return '';
  }
}

/**
 * @param {object} param
 * @param {string} param.tokenAKey
 * @param {string} param.tokenBKey
 * @param {string} param.amount
 * @param {boolean} [param.refresh]
 * @returns {Promise<{tokenAAmount: string, tokenBAmount: string}>}
 */
export async function calRemoveLiquidity({
  tokenAKey,
  tokenBKey,
  amount,
  refresh
}) {
  const info = await getPairInfo(tokenAKey, tokenBKey, refresh);
  const {
    token0: tempToken0,
    token1: tempToken1,
    reserve0,
    reserve1,
    // tokenLP,
    totalLP
  } = info;
  const tempNervePair = nerve.swap.pair(
    tempToken0,
    tempToken1,
    reserve0,
    reserve1
  );
  const nervePair = { ...tempNervePair, totalSupply: totalLP };
  const tokenA = nerve.swap.token(tempToken0.assetChainId, tempToken0.assetId);
  const tokenB = nerve.swap.token(tempToken1.assetChainId, tempToken1.assetId);
  const { amountA, amountB } = nerve.swap.calRemoveLiquidity(
    amount,
    tokenA,
    tokenB,
    nervePair
  );
  return {
    tokenAAmount: amountA.toFixed(),
    tokenBAmount: amountB.toFixed()
  };
}

/**
 * @description create pair
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.from
 * @param {object} param.tokenA
 * @param {number} param.tokenA.assetChainId
 * @param {number} param.tokenA.assetId
 * @param {object} param.tokenB
 * @param {number} param.tokenB.assetChainId
 * @param {number} param.tokenB.assetId
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function createPair({
  provider,
  from,
  tokenA,
  tokenB,
  remark = '',
  EVMAddress,
  pub
}) {
  checkProvider(provider);
  const _tokenA = nerve.swap.token(+tokenA.assetChainId, +tokenA.assetId);
  const _tokenB = nerve.swap.token(+tokenB.assetChainId, +tokenB.assetId);
  const tx = await nerve.swap.swapCreatePair(from, _tokenA, _tokenB, remark);
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress);
}

/**
 * @description add liquidity
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.from
 * @param {object} param.tokenA
 * @param {number} param.tokenA.assetChainId
 * @param {number} param.tokenA.assetId
 * @param {string} param.tokenA.amount
 * @param {object} param.tokenB
 * @param {number} param.tokenB.assetChainId
 * @param {number} param.tokenB.assetId
 * @param {string} param.tokenB.amount
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function addLiquidity({
  provider,
  from,
  tokenA,
  tokenB,
  remark = '',
  EVMAddress,
  pub
}) {
  checkProvider(provider);
  let { amountAMin, amountBMin } = await calMinAmountOnSwapAddLiquidity(
    tokenA.amount,
    tokenB.amount,
    tokenA.assetChainId + '-' + tokenA.assetId,
    tokenB.assetChainId + '-' + tokenB.assetId
  );
  if (amountAMin == 0 || amountBMin == 0) {
    amountAMin = tokenA.amount;
    amountBMin = tokenB.amount;
  }
  const tokenAmountA = nerve.swap.tokenAmount(
    +tokenA.assetChainId,
    +tokenA.assetId,
    tokenA.amount
  );
  const tokenAmountB = nerve.swap.tokenAmount(
    +tokenB.assetChainId,
    +tokenB.assetId,
    tokenB.amount
  );
  const deadline = nerve.swap.currentTime() + 300;
  const tx = await nerve.swap.swapAddLiquidity(
    from,
    tokenAmountA,
    tokenAmountB,
    amountAMin,
    amountBMin,
    deadline,
    from,
    remark
  );
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress);
}

/**
 * @description remove liquidity
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.from
 * @param {string} param.removeAmount
 * @param {object} param.tokenA
 * @param {number} param.tokenA.assetChainId
 * @param {number} param.tokenA.assetId
 * @param {object} param.tokenB
 * @param {number} param.tokenB.assetChainId
 * @param {number} param.tokenB.assetId
 * @param {object} param.tokenLP
 * @param {number} param.tokenLP.assetChainId
 * @param {number} param.tokenLP.assetId
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function removeLiquidity({
  provider,
  from,
  removeAmount,
  tokenA,
  tokenB,
  tokenLP,
  remark = '',
  EVMAddress,
  pub
}) {
  checkProvider(provider);
  const tokenAmountLP = nerve.swap.tokenAmount(
    +tokenLP.assetChainId,
    +tokenLP.assetId,
    removeAmount
  );
  const minRemove = await calMinAmountOnSwapRemoveLiquidity(
    removeAmount,
    tokenA.assetChainId + '-' + tokenA.assetId,
    tokenB.assetChainId + '-' + tokenB.assetId
  );

  if (!minRemove) {
    throw new Error('Cal min removeAmount failed');
  }

  const tokenAmountAMin = nerve.swap.tokenAmount(
    tokenA.assetChainId,
    tokenA.assetId,
    minRemove.amountAMin
  );
  const tokenAmountBMin = nerve.swap.tokenAmount(
    tokenB.assetChainId,
    tokenB.assetId,
    minRemove.amountBMin
  );
  const deadline = nerve.swap.currentTime() + 300;

  const tx = await nerve.swap.swapRemoveLiquidity(
    from,
    tokenAmountLP,
    tokenAmountAMin,
    tokenAmountBMin,
    deadline,
    from,
    remark
  );
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress);
}
