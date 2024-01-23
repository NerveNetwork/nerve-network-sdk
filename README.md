# NERVESWAP SDK

## Start

```jsx
import nerveswap, { mainnet, testnet } from 'nerveswap-sdk
mainnet() // set up the network, default by mainnet
```

## L1 to NERVE

### Check token allowance

```jsx
/**
 * @param {object} param
 * @param {string} param.provider the wallet collected to the dapp, ex: ethereum/NaboxWallet
 * @param {string} param.tokenContract
 * @param {string} param.multySignContract
 * @param {string} param.address
 * @param {string} param.amount
 */
const needAuth = await nerveswap.evm.checkAuth({
	provider: 'ethereum',
  tokenContract: '',
  multySignContract: '',
  address: 'your L1 address',
  amount: '1000000000000000000'
})
```

### Approve token

```jsx
nerveswap.evm.approve({
  provider: 'ethereum',
  tokenContract: '',
  multySignContract: '',
  address: ''
});
```

### Cross to NERVE

```jsx
/**
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.multySignContract
 * @param {string} param.nerveAddress
 * @param {string} param.amount
 * @param {string} param.from
 * @param {string} param.tokenContract
 */
nerveswap.evm.crossIn({
	provider: 'ethereum',
  multySignContract: '',
  nerveAddress: 'target nerve address',
  amount: '1000000000000000000',
  from: 'your L1 address',
  tokenContract: ''
})
```

## NERVE Transfer

### Transfer transaction

```jsx
/**
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.from
 * @param {string} param.to
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.amount
 * @param {string} [param.remark]
 * @param {number} param.type  -2|10  default by 2, 10 for cross to nuls
 * @param {string} param.EVMAddress the sign address
 * @param {string} param.pub the pub of the sign address
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
nerveswap.transfer.transfer(param)
```

### Withdrawal to L1, add withdrawal fee

```jsx
/**
 * @param {object} param
 * @param {string} param.provider
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
nerveswap.transfer.withdrawal(param)

/**
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.from
 * @param {string} param.amount
 * @param {number} param.assetChainId
 * @param {number} param.assetId
 * @param {string} param.txHash the hash of the withdrawal tx
 * @param {string} [param.remark]
 * @param {string} param.EVMAddress
 * @param {string} param.pub
 * @returns {Promise<{hash: string} | {error: {code: number, message: string}}>}
 */
nerveswap.transfer.addFee(param)
```

## Nerve Swap

```jsx
const swap = new nerveswap.swap()
```

### Calculate the number of swaps

```jsx
/**
 * @param {object} param
 * @param {string} param.fromAssetKey
 * @param {string} param.toAssetKey
 * @param {string} param.amount
 * @param {string} [param.direction = from | to]
 * @returns {Promise<{amount: string, priceImpact: string, routes: string[], fee: string}>}
 */
swap.getSwapInfo(param)
```

### Send swap tx

```jsx
/**
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
swap.swapTrade(param)
```

## Nerve Liquidity

Add Liquidity nerveswap.liquidity.addLiquidity(param)

Remove Liquidity nerveswap.liquidity.removeLiquidity(param)