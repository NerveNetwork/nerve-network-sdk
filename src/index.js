import NerveSdk from 'nerve-sdk-js';
import NerveSwap from './api/SwapApi';
import { setBaseUrl } from './service';
import { setIsBeta } from './utils/utils';
import { generateAddress } from './api/account';

// import {
//   BitCoinCrossToNERVE,
//   checkBTCTxConfirmed,
//   calBTCTxFee
// } from './api/bitcoin';

import {
  checkERC20Allowance,
  approveERC20,
  EVMCrossToNERVE
} from './api/EVMApi';

import {
  sendNERVETx,
  sendWithdrawalTx,
  sendJoinStakingTx,
  sendWithdrawalStakingTx,
  sendBatchQuitStakingTx,
  sendBatchJoinStakingTx,
  sendCreateNodeTx,
  sendAddDepositTx,
  sendQuitDepositTx,
  sendStopNodeTx,
  sendAdditionFeeTx,
  sendCreateTradingOrderTx,
  sendRevokeTradingOrderTx,
  sendCreateFarmTx,
  sendFramStakeTx,
  sendFramClaimTx,
  sendFramWithdrawalTx
} from './api/NERVEApi';

import { getWithdrawalInfo } from './api/fee'

import {
  getPairInfo,
  calAddLiquidity,
  calRemoveLiquidity,
  createPair,
  addLiquidity,
  removeLiquidity
} from './api/LiquidityApi';

setBaseUrl();

export function testnet(psUrl) {
  setIsBeta(true);
  NerveSdk.testnet();
  setBaseUrl(psUrl, true);
}

export function mainnet(psUrl) {
  setIsBeta(false);
  NerveSdk.mainnet();
  setBaseUrl(psUrl, false);
}

export { getChainInfo } from './utils/utils';

const nerve = {
  getAccount: generateAddress,
  // btc: {
  //   calTxFee: calBTCTxFee,
  //   crossIn: BitCoinCrossToNERVE,
  //   checkTxConfirmed: checkBTCTxConfirmed
  // },
  evm: {
    checkAuth: checkERC20Allowance,
    approve: approveERC20,
    crossIn: EVMCrossToNERVE
  },
  transfer: {
    transfer: sendNERVETx,
    withdrawal: sendWithdrawalTx,
    getWithdrawalInfo,
    addFee: sendAdditionFeeTx
  },
  staking: {
    joinStaking: sendJoinStakingTx,
    withdrawal: sendWithdrawalStakingTx,
    batchJoin: sendBatchJoinStakingTx,
    batchQuit: sendBatchQuitStakingTx
  },
  node: {
    createNode: sendCreateNodeTx,
    addDeposit: sendAddDepositTx,
    quitDeposit: sendQuitDepositTx,
    stopNode: sendStopNodeTx
  },
  swap: NerveSwap,
  liquidity: {
    getPairInfo,
    calAddLiquidity,
    calRemoveLiquidity,
    createPair,
    addLiquidity,
    removeLiquidity
  },
  push: {
    createOrder: sendCreateTradingOrderTx,
    revokeOrder: sendRevokeTradingOrderTx
  },
  farm: {
    createFarm: sendCreateFarmTx,
    stake: sendFramStakeTx,
    claim: sendFramClaimTx,
    withdrawal: sendFramWithdrawalTx
  }
};

export default nerve;
