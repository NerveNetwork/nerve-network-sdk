import { post, sPost } from '.';

export async function getAssetBalance(chainId, assetId, address) {
  const res = await post('getAccountBalance', [chainId, assetId, address]);
  return res?.result || null;
}

export async function broadcastHex(txHex) {
  const res = await post('broadcastTx', [txHex]);
  return res.result || res;
}

export async function getTradeExactIn(tokenInStr, tokenOutStr, tokenInAmount) {
  const maxPairSize = 3;
  console.log(2345666);
  const res = await sPost('/swap/wholeTradeExactIn', {
    tokenInStr,
    tokenInAmount,
    tokenOutStr,
    maxPairSize,
    allPairs: []
  });
  return res.data || [];
}

export async function getAvailableStablePairList() {
  const res = await sPost('/swap/availableStablePairList');
  return res.data || [];
}

export async function getStableSwapPairInfo(pairAddress) {
  const res = await sPost('/swap/stableSwapPairInfo', {
    pairAddress
  });
  return res.data || null;
}

export async function getNerveFeeAddress() {
  const res = await sPost('/swap/nerveFeeAddress');
  return res.data || {};
}

export async function getChainAssetInfo(assetKey) {
  const res = await post('getChainAssetInfo', [assetKey], true);
  return res.result;
}

export async function getSwapPairInfo(tokenAStr, tokenBStr) {
  const res = await sPost('/swap/swapPairInfo', {
    tokenAStr,
    tokenBStr
  });
  return res.data || null;
}

export async function calMinAmountOnSwapAddLiquidity(
  amountA,
  amountB,
  tokenAStr,
  tokenBStr
) {
  const res = await sPost('/swap/calMinAmountOnSwapAddLiquidity', {
    amountA,
    amountB,
    tokenAStr,
    tokenBStr
  });
  return res.data || null;
}

export async function calMinAmountOnSwapRemoveLiquidity(
  amountLP,
  tokenAStr,
  tokenBStr
) {
  const res = await sPost('/swap/calMinAmountOnSwapRemoveLiquidity', {
    amountLP,
    tokenAStr,
    tokenBStr
  });
  return res.data || null;
}
