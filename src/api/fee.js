import sdkApi from 'nerve-sdk-js/lib/api/sdk'
import { ethers, BigNumber } from 'ethers'
import { getChainInfo, timesDecimals } from '../utils/utils'
import {
  getHetergenousChainInfo,
  getHetergenousChainConfig
} from '../utils/heterogeneousChainConfig'
import { getAssetPrice, getWithdrawalGasLimit } from '../service/api'

export async function getWithdrawalInfo(chainId) {
  const configs = getHetergenousChainConfig()
  const heterogeneousChain = getHetergenousChainInfo(chainId)
  if (!heterogeneousChain) {
    throw new Error('Invalid chain')
  }

  const ethereumChain = configs.Ethereum
  const withdrawalProvider = new ethers.providers.JsonRpcProvider(
    heterogeneousChain.rpcUrl
  )
  const ethereumProvider = new ethers.providers.JsonRpcProvider(
    ethereumChain.rpcUrl
  )
  const NerveInfo = getChainInfo().NERVE
  const [L1ChainId, L1AssetId] = heterogeneousChain.assetKey.split('-')

  const gasLimit = await getGasLimit(heterogeneousChain.chainId)

  // use NVT for fee
  const feeUSD = await getAssetPrice(NerveInfo.chainId, NerveInfo.assetId, true)
  const feeDecimals = 8
  const mainAssetUSD = await getAssetPrice(+L1ChainId, +L1AssetId, true)

  const gasPrice = await withdrawalProvider.getGasPrice()
  const gasLimit_big = BigNumber.from(gasLimit)

  const ethGasPrice = await ethereumProvider.getGasPrice()
  const extraL1FeeBig = sdkApi.getL1Fee(heterogeneousChain.chainId, ethGasPrice)
  const totalL1Fee = gasLimit_big.mul(gasPrice).add(extraL1FeeBig)
  const feeUSDBig = ethers.utils.parseUnits(feeUSD.toString(), 18)
  const mainAssetUSDBig = ethers.utils.parseUnits(mainAssetUSD.toString(), 18)
  let result = mainAssetUSDBig
    .mul(totalL1Fee)
    .mul(ethers.utils.parseUnits('1', feeDecimals))
    .div(ethers.utils.parseUnits('1', 18))
    .div(feeUSDBig)
  // use Math.ceil to handle fee
  const numberStr = ethers.utils.formatUnits(result, feeDecimals)
  const ceil = Math.ceil(+numberStr) || 1
  result = ethers.utils.parseUnits(ceil.toString(), feeDecimals).toString()
  const finalFee = formatEthers(result, feeDecimals)
  return {
    feeInfo: {
      amount: timesDecimals(finalFee, feeDecimals),
      assetChainId: NerveInfo.chainId,
      assetId: NerveInfo.assetId
    },
    heterogeneousChainId: heterogeneousChain.chainId
  }
}

async function getGasLimit(chainId) {
  const gasLimitConfig = await getWithdrawalGasLimit()
  return gasLimitConfig[chainId].gasLimitOfWithdraw
}

function formatEthers(amount, decimals) {
  return ethers.utils.formatUnits(amount, decimals).toString()
}
