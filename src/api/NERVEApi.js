import nerve from 'nerve-sdk-js'
import Signature from 'elliptic/lib/elliptic/ec/signature'
import { getAssetBalance, broadcastHex } from '../service/api.js'
import {
  Plus,
  getChainInfo,
  htmlEncode,
  timesDecimals,
  Minus
} from '../utils/utils'

const nerveConfig = {
  5: {
    feeAddress: 'TNVTdTSPP9oSLvdtVSVFiUYCvXJdj1ZA1nyQU',
    blockHoleAddress: 'TNVTdTSPGwjgRMtHqjmg8yKeMLnpBpVN5ZuuY',
    pushFeeAddress: '',
    pushFeeScale: ''
  },
  9: {
    feeAddress: 'NERVEepb69f573sRzfoTX9Kn67WeNtXhG6Y6W8',
    blockHoleAddress: 'NERVEepb63T1M8JgQ26jwZpZXYL8ZMLdUAK31L',
    pushFeeAddress: 'NERVEepb6BiuhyRh4Q9mcwyQd44pfz4AofM2h5',
    pushFeeScale: 6
  }
}

export async function getNPub(address) {
  if (!window?.nabox?.selectedAddress) {
    throw new Error('Pls connect the plugin first')
  }
  const pub = await window.nabox.getPub({
    address
  })
  return pub
}

export function getNAddressByPub(pub, isNULS = false) {
  const key = isNULS ? 'NULS' : 'NERVE'
  const chainInfo = getChainInfo()
  const { chainId, assetId, prefix } = chainInfo[key]
  return nerve.getAddressByPub(chainId, assetId, pub, prefix)
}

function checkIsNULSLedger(provider) {
  const _provider = getWebProvider(provider)
  return _provider?.isNabox && _provider?.isNULSLedger
}

export function checkProvider(provider) {
  const _provider = getWebProvider(provider)
  if (!_provider) {
    throw new Error(`Provider not found`)
  }
}

export function getWebProvider(provider) {
  const _provider = typeof provider === 'string' ? window[provider] : provider
  return _provider
}

/**
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.to
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.amount
 * @param {string} [param.remark]
 * @param {number} param.type  -  2 | 10
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendNERVETx({
  provider,
  from,
  to,
  assetChainId,
  assetId,
  amount,
  type = 2,
  remark = '',
  EVMAddress,
  pub
}) {
  checkProvider(provider)
  const { inputs, outputs } = await getTxData(type, {
    from,
    to,
    assetChainId,
    assetId,
    amount
  })
  return sendTx(provider, type, inputs, outputs, remark, {}, pub, EVMAddress)
}

/**
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.amount
 * @param {object} param.feeInfo
 * @param {string} param.feeInfo.amount
 * @param {number} param.feeInfo.assetChainId
 * @param {number} param.feeInfo.assetId
 * @param {string} param.heterogeneousAddress
 * @param {number} param.heterogeneousChainId
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendWithdrawalTx({
  provider,
  from,
  assetChainId,
  assetId,
  amount,
  feeInfo = {},
  heterogeneousAddress,
  heterogeneousChainId,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 43
  checkProvider(provider)
  const { inputs, outputs } = await getTxData(type, {
    from,
    assetChainId,
    assetId,
    amount,
    feeInfo
  })
  const txData = {
    heterogeneousAddress,
    heterogeneousChainId
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.amount
 * @param {number} param.depositType 0|1
 * @param {number} param.timeType 0|1|2|3|4|5|6
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendJoinStakingTx({
  provider,
  from,
  assetChainId,
  assetId,
  amount,
  depositType,
  timeType,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 5
  checkProvider(provider)
  const { inputs, outputs } = await getTxData(type, {
    from,
    assetChainId,
    assetId,
    amount
  })
  const txData = {
    address: from,
    deposit: amount,
    assetsChainId: assetChainId,
    assetsId: assetId,
    depositType,
    timeType
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.amount
 * @param {string} param.agentHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendWithdrawalStakingTx({
  provider,
  from,
  assetChainId,
  assetId,
  amount,
  agentHash,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 6
  checkProvider(provider)
  const { inputs, outputs } = await getTxData(type, {
    from,
    assetChainId,
    assetId,
    amount,
    nonce: agentHash.substring(agentHash.length - 16)
  })
  const txData = {
    address: from,
    agentHash,
    deposit: amount,
    assetsChainId: assetChainId,
    assetsId: assetId,
    depositType: 0,
    timeType: 0
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {object[]} param.stakingList
 * @param {number} param.stakingList[].assetChainId
 * @param {number} param.stakingList[].assetId
 * @param {string} param.stakingList[].amount
 * @param {string} param.stakingList[].txHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendBatchQuitStakingTx({
  provider,
  from,
  stakingList = [],
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 32
  checkProvider(provider)
  const { inputs, outputs } = await getTxData(type, {
    from,
    stakingList
  })
  const txHashs = stakingList.map(v => v.txHash)
  const txData = {
    address: from,
    agentHash: txHashs
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {object[]} param.stakingList
 * @param {number} param.stakingList[].assetChainId
 * @param {number} param.stakingList[].assetId
 * @param {string} param.stakingList[].amount
 * @param {string} param.stakingList[].txHash
 * @param {number} param.depositType
 * @param {number} param.timeType
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendBatchJoinStakingTx({
  provider,
  from,
  stakingList = [],
  depositType,
  timeType,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 33
  checkProvider(provider)

  const { inputs, outputs, totalAmount } = await getTxData(type, {
    from,
    stakingList
  })
  const txHashs = stakingList.map(v => v.txHash)
  const txData = {
    deposit: totalAmount,
    address: from,
    assetsChainId: stakingList[0].assetChainId,
    assetsId: stakingList[0].assetId,
    depositType: depositType,
    timeType: timeType,
    agentHash: txHashs
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description create node
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {string} param.packingAddress
 * @param {string} param.rewardAddress
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendCreateNodeTx({
  provider,
  from,
  amount,
  packingAddress,
  rewardAddress,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 4
  checkProvider(provider)

  const { inputs, outputs } = await getTxData(type, {
    from,
    amount
  })
  const txData = {
    agentAddress: from,
    packingAddress,
    rewardAddress,
    deposit: amount
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description add node deposit
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {string} param.agentHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendAddDepositTx({
  provider,
  from,
  amount,
  agentHash,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 28
  checkProvider(provider)

  const { inputs, outputs } = await getTxData(type, {
    from,
    amount
  })
  const txData = {
    address: from,
    agentHash,
    amount
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description reduce node deposit
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {object[]} param.reduceList
 * @param {string} param.reduceList[].deposit
 * @param {string} param.reduceList[].nonce
 * @param {string} param.agentHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendQuitDepositTx({
  provider,
  from,
  amount,
  agentHash,
  reduceList = [],
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 29
  checkProvider(provider)

  const { inputs, outputs } = await getTxData(type, {
    from,
    amount,
    reduceList
  })
  const txData = {
    address: from,
    agentHash,
    amount
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description stop node
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {object[]} param.reduceList reduce nonc list
 * @param {string} param.reduceList[].deposit
 * @param {string} param.reduceList[].nonce
 * @param {string} param.agentHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendStopNodeTx({
  provider,
  from,
  amount,
  agentHash,
  reduceList = [],
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 9
  checkProvider(provider)

  const { inputs, outputs } = await getTxData(type, {
    from,
    amount,
    reduceList
  })
  const txData = {
    address: from,
    agentHash,
    amount
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description addtion withdrawal fee
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.txHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @param {boolean} param.BTCSpeedUp
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendAdditionFeeTx({
  provider,
  from,
  amount,
  assetChainId,
  assetId,
  txHash,
  remark = '',
  EVMAddress,
  pub,
  BTCSpeedUp
}) {
  const type = 56
  checkProvider(provider)

  const { inputs, outputs } = await getTxData(type, {
    from,
    amount,
    assetChainId,
    assetId
  })
  const txData = {
    txHash
  }
  if (BTCSpeedUp) {
    txData.extend = '020000'
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description push create trading order
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.payAmount
 * @param {string} param.payAssetKey
 * @param {string} param.orderAmount
 * @param {string} param.price
 * @param {string} param.tradingHash
 * @param {number} param.orderType - 1(buy) | 2(sell)
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendCreateTradingOrderTx({
  provider,
  from,
  payAmount,
  payAssetKey,
  orderAmount,
  price,
  tradingHash,
  orderType,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 229
  checkProvider(provider)

  const assetInfo = payAssetKey.split('-')
  const assetChainId = +assetInfo[0]
  const assetId = +assetInfo[1]
  const { inputs, outputs } = await getTxData(type, {
    from,
    amount: payAmount,
    assetChainId,
    assetId
  })
  const { chainId: NERVEChainId } = getChainInfo().NERVE
  const { pushFeeAddress, pushFeeScale } = nerveConfig[NERVEChainId]
  const txData = {
    address: from,
    tradingHash,
    orderType,
    assetChainId,
    assetId,
    amount: orderAmount,
    price,
    feeAddress: pushFeeAddress,
    feeScale: pushFeeScale
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description push create trading order
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.orderHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendRevokeTradingOrderTx({
  provider,
  from,
  orderHash,
  remark = '',
  EVMAddress,
  pub
}) {
  const type = 230
  checkProvider(provider)
  const { inputs, outputs } = await getTxData(type, {
    from
  })
  const txData = {
    address: from,
    orderHash
  }
  return sendTx(
    provider,
    type,
    inputs,
    outputs,
    remark,
    txData,
    pub,
    EVMAddress
  )
}

/**
 * @description create Farm
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.stakeAssetKey
 * @param {string} param.rewardAssetKey
 * @param {string} param.totalReward
 * @param {string} param.rewardPerBlock
 * @param {number} [param.startBlockHeight]
 * @param {number} [param.lockedTime]
 * @param {boolean} [param.modifiable]
 * @param {number} [param.withdrawLockTime]
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendCreateFarmTx({
  provider,
  from,
  stakeAssetKey,
  rewardAssetKey,
  totalReward,
  rewardPerBlock,
  startBlockHeight = 1,
  lockedTime = 1,
  modifiable,
  withdrawLockTime,
  remark = '',
  EVMAddress,
  pub
}) {
  const { chainId: NERVEChainId, prefix } = getChainInfo().NERVE
  const stakeAsset = stakeAssetKey.split('-')
  const rewardAsset = rewardAssetKey.split('-')
  const tx = await nerve.swap.farmCreate(
    from,
    nerve.swap.token(+stakeAsset[0], +stakeAsset[1]),
    nerve.swap.token(+rewardAsset[0], +rewardAsset[1]),
    NERVEChainId,
    totalReward,
    rewardPerBlock,
    startBlockHeight,
    lockedTime,
    prefix,
    modifiable,
    withdrawLockTime,
    remark
  )
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress)
}

/**
 * @description Farm stake
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {numbrt} param.assetChainId
 * @param {numbrt} param.assetId
 * @param {string} param.farmHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendFramStakeTx({
  provider,
  from,
  amount,
  assetChainId,
  assetId,
  farmHash,
  remark = '',
  EVMAddress,
  pub
}) {
  const { chainId, prefix } = getChainInfo().NERVE
  const tx = await nerve.swap.farmStake(
    from,
    nerve.swap.token(+assetChainId, +assetId),
    chainId,
    prefix,
    amount,
    farmHash,
    remark
  )
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress)
}

/**
 * @description Farm claim
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {numbrt} param.assetChainId
 * @param {numbrt} param.assetId
 * @param {string} param.farmHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendFramClaimTx({
  provider,
  from,
  assetChainId,
  assetId,
  farmHash,
  remark = '',
  EVMAddress,
  pub
}) {
  const { chainId, prefix } = getChainInfo().NERVE
  const tx = await nerve.swap.farmStake(
    from,
    nerve.swap.token(+assetChainId, +assetId),
    chainId,
    prefix,
    '0',
    farmHash,
    remark
  )
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress)
}

/**
 * @description Farm withdrawal
 * @param {object} param
 * @param {string | object} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {numbrt} param.assetChainId
 * @param {numbrt} param.assetId
 * @param {string} param.farmHash
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
export async function sendFramWithdrawalTx({
  provider,
  from,
  amount,
  assetChainId,
  assetId,
  farmHash,
  remark = '',
  EVMAddress,
  pub
}) {
  const tx = await nerve.swap.farmWithdraw(
    from,
    nerve.swap.token(+assetChainId, +assetId),
    amount,
    farmHash,
    remark
  )
  return await sendTxWithUnSignedHex(provider, tx.hex, pub, EVMAddress)
}

function getTxData(type, tx) {
  if (type === 2) {
    // genetal
    return getTransferTxData(tx)
  } else if (type === 10) {
    // cross to nuls
    return getCrossTxData(tx)
  } else if (type === 43) {
    // withdrawal to L1
    return getWithdrawalTxData(tx)
  } else if (type == 5) {
    // join staking
    return getJoinStakingTxData(tx)
  } else if (type === 6) {
    // withdrawal staking
    return getQuitStakingTxData(tx)
  } else if (type === 32) {
    // batch quit staking
    return getBatchQuitTxData(tx)
  } else if (type === 33) {
    // merge staking / batch change staking period
    return getBatchJoinTxData(tx)
  } else if (type === 4) {
    // create node
    return getCreateNodeTxData(tx)
  } else if (type === 28) {
    // add deposit
    return getAddDepositTxData(tx)
  } else if (type === 29) {
    // quit deposit
    return getQuitDepositTxData(tx)
  } else if (type === 9) {
    // stop node
    return getQuitDepositTxData(tx, true)
  } else if (type === 56) {
    // add withdrawal fee
    return getAdditionFeeTxData(tx)
  } else if (type === 229) {
    // trading order
    return getTradingOrderTxData(tx)
  } else if (type === 230) {
    // revoke order
    return getRevokeOrderTxData(tx)
  }
}

async function getTransferTxData(tx) {
  const { from, to, assetChainId, assetId, amount } = tx
  const inputs = [],
    outputs = []
  const NERVEInfo = getChainInfo().NERVE
  const nonce = await getNonce(from, assetChainId, assetId)
  if (!nonce) {
    throw new Error('Fail to get nonce')
  }
  if (assetChainId === NERVEInfo.chainId && assetId === NERVEInfo.assetId) {
    // transfer nvt, no fee cost
    // const newAmount = Plus(amount, fee).toFixed()
    inputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: 0,
      nonce
    })
  } else {
    inputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: 0,
      nonce
    })
  }
  outputs.push({
    address: to,
    assetsChainId: assetChainId,
    assetsId: assetId,
    amount,
    lockTime: 0
  })
  return { inputs, outputs }
}

async function getCrossTxData(tx) {
  const { inputs, outputs } = await getTransferTxData(tx)
  const { NERVE, NULS } = getChainInfo()

  const crossFee = timesDecimals(0.01, 8) // cross fee 0.01 NVT + 0.01 NULS

  const input = inputs[0]
  if (
    input.assetsChainId === NERVE.chainId &&
    input.assetsId === NERVE.assetId
  ) {
    input.amount = Plus(input.amount, crossFee).toFixed()
  } else {
    const nonce = await getNonce(tx.from, NERVE.chainId, NERVE.assetId)
    if (!nonce) {
      throw new Error('Fail to get nonce')
    }
    inputs.push({
      address: tx.from,
      assetsChainId: NERVE.chainId,
      assetsId: NERVE.assetId,
      amount: crossFee,
      locked: 0,
      nonce: nonce
    })
  }
  if (input.assetsChainId === NULS.chainId && input.assetsId === NULS.assetId) {
    input.amount = Plus(input.amount, crossFee).toFixed()
  } else {
    const nonce = await getNonce(tx.from, NULS.chainId, NULS.assetId)
    if (!nonce) {
      throw new Error('Fail to get nonce')
    }
    inputs.push({
      address: tx.from,
      assetsChainId: NULS.chainId,
      assetsId: NULS.assetId,
      amount: crossFee,
      locked: 0,
      nonce: nonce
    })
  }
  return { inputs, outputs }
}
async function getWithdrawalTxData(tx) {
  const { from, assetChainId, assetId, amount, feeInfo } = tx

  const {
    amount: feeAmount,
    assetChainId: feeChainId,
    assetId: feeAssetId
  } = feeInfo

  const nonce = await getNonce(from, assetChainId, assetId)

  let inputs = []
  if (feeChainId === assetChainId && feeAssetId === assetId) {
    // withdrawal asset = fee asset
    const newAmount = Plus(amount, feeAmount).toFixed()
    inputs.push({
      address: from,
      amount: newAmount,
      assetsChainId: assetChainId,
      assetsId: assetId,
      nonce,
      locked: 0
    })
  } else {
    const feeAssetNonce = await getNonce(from, feeChainId, feeAssetId)
    inputs = [
      {
        address: from,
        amount,
        assetsChainId: assetChainId,
        assetsId: assetId,
        nonce,
        locked: 0
      },
      {
        address: from,
        amount: feeAmount,
        assetsChainId: feeChainId,
        assetsId: feeAssetId,
        nonce: feeAssetNonce,
        locked: 0
      }
    ]
  }
  const { chainId: NERVEChainId } = getChainInfo().NERVE
  const { feeAddress, blockHoleAddress } = nerveConfig[NERVEChainId]
  let outputs = [
    {
      address: blockHoleAddress,
      amount: amount,
      assetsChainId: assetChainId,
      assetsId: assetId,
      locked: 0
    },
    {
      address: feeAddress,
      amount: feeAmount,
      assetsChainId: feeChainId,
      assetsId: feeAssetId,
      locked: 0
    }
  ]
  return { inputs, outputs }
}

async function getJoinStakingTxData(tx) {
  const { from, assetChainId, assetId, amount } = tx
  const nonce = await getNonce(from, assetChainId, assetId)
  const inputs = [
    {
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: 0,
      nonce
    }
  ]
  const outputs = [
    {
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      lockTime: -1
    }
  ]
  return { inputs, outputs }
}

async function getQuitStakingTxData(tx) {
  const { from, assetChainId, assetId, amount, nonce } = tx
  const inputs = []
  const outputs = []
  const NERVEInfo = getChainInfo().NERVE
  const { chainId: NERVEChainId, assetId: NERVEAssetId } = NERVEInfo
  if (assetChainId !== NERVEChainId || assetId !== NERVEAssetId) {
    // asset is not NVT
    inputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: -1,
      nonce // The last 16 bits of TxHash
    })
    outputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      lockTime: 0
    })
  } else {
    // asset is NVT, lock 7days
    const sevenDays = new Date().valueOf() + 3600000 * 24 * 7
    const lockTime = Number(
      sevenDays.toString().substr(0, sevenDays.toString().length - 3)
    )
    inputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: -1,
      nonce
    })
    outputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      lockTime
    })
  }

  return { inputs, outputs }
}

async function getBatchQuitTxData(tx) {
  const { from, stakingList } = tx
  const inputs = []
  const outputs = []
  const sevenDays = new Date().valueOf() + 3600000 * 24 * 7 // lock 7 days
  const lockTime = Number(
    sevenDays.toString().substr(0, sevenDays.toString().length - 3)
  )
  const symbolList = [],
    outs = []
  const NERVEInfo = getChainInfo().NERVE
  const { chainId: NERVEChainId, assetId: NERVEAssetId } = NERVEInfo
  stakingList.map(async v => {
    inputs.push({
      address: from,
      assetsChainId: v.assetChainId,
      assetsId: v.assetId,
      amount: Plus(0, v.amount).toFixed(),
      locked: -1,
      nonce: v.txHash.substring(v.txHash.length - 16)
    })
    const isNvt = NERVEChainId === v.assetChainId && NERVEAssetId === v.assetId
    const id = v.assetChainId + '-' + v.assetId
    if (symbolList.indexOf(id) === -1) {
      symbolList.push(id)
      outs.push({
        isNvt: isNvt,
        id: id,
        address: from,
        chainId: v.assetChainId,
        assetId: v.assetId,
        amount: Plus(0, v.amount).toFixed(),
        lockTime: isNvt ? lockTime : 0
      })
    } else {
      outs.map(out => {
        if (out.id === id) {
          out.amount = Plus(out.amount, v.amount).toFixed()
        }
      })
    }
  })
  const hasNvt = outs.filter(v => v.isNvt).length
  if (hasNvt) {
    outs.map(item => {
      outputs.push({
        address: item.address,
        assetsChainId: item.chainId,
        assetsId: item.assetId,
        amount: item.isNvt
          ? Minus(item.amount, 100000).toString()
          : item.amount, // A handling fee of 0.001 is required
        lockTime: item.lockTime
      })
    })
  } else {
    const nonce = await getNonce(from, NERVEChainId, NERVEAssetId)
    // this is required
    inputs.push({
      address: from,
      assetsChainId: NERVEChainId,
      assetsId: NERVEAssetId,
      amount: 0,
      locked: 0,
      nonce
    })
    outs.map(item => {
      outputs.push({
        address: item.address,
        assetsChainId: item.chainId,
        assetsId: item.assetId,
        amount: item.amount,
        lockTime: item.lockTime
      })
    })
  }
  return { inputs, outputs }
}

async function getBatchJoinTxData(tx) {
  const { from, stakingList } = tx
  const assetChainId = stakingList[0].assetChainId
  const assetId = stakingList[0].assetId
  const inputs = []
  const outputs = []
  const NERVEInfo = getChainInfo().NERVE
  const { chainId: NERVEChainId, assetId: NERVEAssetId } = NERVEInfo
  let totalAmount = '0'
  stakingList.map(v => {
    totalAmount = Plus(totalAmount, v.amount).toFixed()
    inputs.push({
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount: v.amount,
      locked: -1,
      nonce: v.txHash.substring(v.txHash.length - 16)
    })
  })
  if (assetChainId !== NERVEChainId || assetId !== NERVEAssetId) {
    // not nvt
    const nvtNonce = await getNonce(from, NERVEChainId, NERVEAssetId)
    inputs.push({
      address: from,
      assetsChainId: NERVEChainId,
      assetsId: NERVEAssetId,
      amount: 0,
      locked: 0,
      nonce: nvtNonce
    })
  } else {
    // is nvt, combine amount and fee
    totalAmount = Minus(totalAmount, 100000).toFixed()
  }
  outputs.push({
    address: from,
    assetsChainId: assetChainId,
    assetsId: assetId,
    amount: totalAmount, // A handling fee of 0.001 is required
    lockTime: -1
  })
  return { inputs, outputs, totalAmount }
}

async function getCreateNodeTxData(tx) {
  const { from, amount } = tx
  const { chainId, assetId } = getChainInfo().NERVE
  const nonce = await getNonce(from, chainId, assetId)
  const inputs = [
    {
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: amount,
      locked: 0,
      nonce
    }
  ]
  const outputs = [
    {
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: amount,
      lockTime: -1
    }
  ]
  return { inputs, outputs }
}
async function getAddDepositTxData(tx) {
  const { from, amount } = tx
  const { chainId, assetId } = getChainInfo().NERVE
  const nonce = await getNonce(from, chainId, assetId)
  const inputs = [
    {
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: amount,
      locked: 0,
      nonce
    }
  ]
  const outputs = [
    {
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: amount,
      lockTime: -1
    }
  ]
  return { inputs, outputs }
}
async function getQuitDepositTxData(tx, isStopNode = false) {
  const { from, amount, reduceList } = tx
  const { chainId, assetId } = getChainInfo().NERVE
  const fee = 100000
  // lock 15 days
  const time = new Date().valueOf() + 3600000 * 24 * 15
  const lockTime = Number(time.toString().substr(0, time.toString().length - 3))
  const inputs = []
  const outputs = []
  for (let item of reduceList) {
    inputs.push({
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: item.deposit,
      locked: -1,
      nonce: item.nonce
    })
  }

  outputs.push({
    address: from,
    assetsChainId: chainId,
    assetsId: assetId,
    amount: Minus(amount, fee).toFixed(), // A handling fee of 0.001 is required
    lockTime: lockTime
  })
  if (!isStopNode) {
    let allAmount = '0'
    for (let item of reduceList) {
      allAmount = Plus(allAmount, item.deposit).toFixed()
    }
    if (allAmount !== amount) {
      outputs.push({
        address: from,
        assetsChainId: chainId,
        assetsId: assetId,
        amount: Minus(allAmount, amount).toFixed(),
        lockTime: -1
      })
    }
  }
  console.log(inputs, outputs, '333')
  return { inputs, outputs }
}

async function getAdditionFeeTxData(tx) {
  const { from, amount, assetChainId, assetId } = tx
  const { chainId: NERVEChainId } = getChainInfo().NERVE
  const { feeAddress } = nerveConfig[NERVEChainId]
  const nonce = await getNonce(from, assetChainId, assetId)
  const inputs = [
    {
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: 0,
      nonce
    }
  ]
  const outputs = [
    {
      address: feeAddress,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      lockTime: 0
    }
  ]
  return { inputs, outputs }
}

async function getTradingOrderTxData(tx) {
  const { from, amount, assetChainId, assetId } = tx
  const nonce = await getNonce(from, assetChainId, assetId)
  const inputs = [
    {
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      locked: 0,
      nonce
    }
  ]
  const outputs = [
    {
      address: from,
      assetsChainId: assetChainId,
      assetsId: assetId,
      amount,
      lockTime: -2
    }
  ]
  return { inputs, outputs }
}

async function getRevokeOrderTxData(tx) {
  const { from } = tx
  const { chainId, assetId } = getChainInfo().NERVE
  const nonce = await getNonce(from, chainId, assetId)
  const inputs = [
    {
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: '0',
      locked: 0,
      nonce
    }
  ]
  const outputs = [
    {
      address: from,
      assetsChainId: chainId,
      assetsId: assetId,
      amount: '0',
      lockTime: 0
    }
  ]
  return { inputs, outputs }
}

async function getNonce(from, assetChainId, assetId) {
  const res = await getAssetBalance(assetChainId, assetId, from)
  return res ? res.nonce : null
}

export async function sendTx(
  provider,
  type,
  inputs,
  outputs,
  remark,
  txData,
  pub,
  signAddress
) {
  // console.log(arguments, '==--=arguments=--==');
  let signedHex
  remark = htmlEncode(remark)
  const isNULSLedger = checkIsNULSLedger(provider)
  if (isNULSLedger) {
    const unsignedHex = await getUnSignHex(
      type,
      inputs,
      outputs,
      remark,
      txData
    )
    signedHex = await window.nabox.signNULSTransaction({ txHex: unsignedHex })
  } else {
    signedHex = await getTxHex({
      provider,
      type,
      inputs,
      outputs,
      remark,
      txData,
      pub,
      signAddress
    })
  }
  return await broadcastHex(signedHex)
}

export async function sendTxWithUnSignedHex(provider, hex, pub, signAddress) {
  const isNULSLedger = checkIsNULSLedger(provider)
  let signedHex
  if (isNULSLedger) {
    signedHex = await window.nabox.signNULSTransaction({ txHex: hex })
  } else {
    const tAssemble = nerve.deserializationTx(hex)
    signedHex = await getTxHex({ provider, tAssemble, pub, signAddress })
  }
  return await broadcastHex(signedHex)
}

async function getUnSignHex(type, inputs, outputs, remark, txData) {
  const tAssemble = nerve.transactionAssemble(
    inputs,
    outputs,
    remark,
    type,
    txData
  )
  return tAssemble.txSerialize().toString('hex')
}

export async function getTxHex({
  provider,
  type,
  inputs,
  outputs,
  remark,
  txData,
  pub,
  signAddress,
  tAssemble
}) {
  // let tAssemble = data.tAssemble;
  let hash
  if (!tAssemble) {
    tAssemble = nerve.transactionAssemble(inputs, outputs, remark, type, txData)
  }
  hash = '0x' + tAssemble.getHash().toString('hex')
  const signature = await signHash(provider, hash, signAddress)
  tAssemble.signatures = nerve.appSplicingPub(signature, pub)
  return tAssemble.txSerialize().toString('hex')
}

async function signHash(provider, hash, signAddress) {
  hash = hash.startsWith('0x') ? hash : '0x' + hash
  const _provider = getWebProvider(provider)
  let flat = await _provider.request({
    method: 'eth_sign',
    params: [signAddress, hash]
  })
  // console.log(flat, 66, signAddress)
  flat = flat.slice(2)
  const r = flat.slice(0, 64)
  const s = flat.slice(64, 128)
  // const recoveryParam = flat.slice(128)
  // signature = signature.slice(2)
  return new Signature({ r, s }).toDER('hex')
}
