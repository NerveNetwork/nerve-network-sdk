import NerveSdk from 'nerve-sdk-js';
import NerveSwap from './api/SwapApi';
import { setBaseUrl } from './service';
import { setIsBeta } from './utils/utils';
import { generateAddress, getAccountByPub } from './api/account';

import {
  BitCoinCrossToNERVE,
  checkBTCTxConfirmed,
  calBTCTxFee,
  getBTCAddressByPub,
  getBTCWithdrawalInfo,
  getBTCWithdrawalFee,
  getBTCSpeedUpAmount,
  checkBTCAddress
} from './api/bitcoin';

import {
  checkERC20Allowance,
  approveERC20,
  EVMCrossToNERVE
} from './api/EVMApi';

import {
  checkTRC20Allowance,
  approveTRC20,
  TRONCrossToNERVE
} from './api/TRONApi';

import {
  calFCHTxFee,
  FCHCrossToNERVE,
  validateFCHAddres,
  getFCHWithdrawInfo,
  getFCHWithdrawalFee
} from './api/FCHApi';

import {
  BCH_PREFIX,
  calBCHTxFee,
  BCHCrossToNERVE,
  validateBCHAddres,
  getBCHTransactionDetail,
  getBCHWithdrawInfo,
  getBCHWithdrawalFee
} from './api/BCHApi';

import {
  handleGetTBCBalance,
  getTBCTransactionFee,
  TBCCrossToNERVE,
  getTBCTransactionByHash
} from './api/TBCApi';

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

import { getWithdrawalInfo } from './api/fee';

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
  getAccountByPub,
  evm: {
    checkAuth: checkERC20Allowance,
    approve: approveERC20,
    crossIn: EVMCrossToNERVE
  },
  tron: {
    checkAuth: checkTRC20Allowance,
    approve: approveTRC20,
    crossIn: TRONCrossToNERVE
  },
  btc: {
    getAddress: getBTCAddressByPub,
    calTxFee: calBTCTxFee,
    crossIn: BitCoinCrossToNERVE,
    checkTxConfirmed: checkBTCTxConfirmed,
    getBTCWithdrawalInfo,
    getWithdrawInfo: getBTCWithdrawalInfo,
    getWithdrawalFee: getBTCWithdrawalFee,
    getBTCWithdrawalFee,
    getBTCSpeedUpAmount,
    checkBTCAddress,
    validateAddress: checkBTCAddress
  },
  fch: {
    calTxFee: calFCHTxFee,
    crossIn: FCHCrossToNERVE,
    validateAddress: validateFCHAddres,
    getWithdrawInfo: getFCHWithdrawInfo,
    getWithdrawalFee: getFCHWithdrawalFee
  },
  bch: {
    addressPrefix: BCH_PREFIX,
    calTxFee: calBCHTxFee,
    crossIn: BCHCrossToNERVE,
    validateAddress: validateBCHAddres,
    getTx: getBCHTransactionDetail,
    getWithdrawInfo: getBCHWithdrawInfo,
    getWithdrawalFee: getBCHWithdrawalFee
  },
  tbc: {
    getBalance: handleGetTBCBalance,
    calTxFee: getTBCTransactionFee,
    crossIn: TBCCrossToNERVE,
    getTx: getTBCTransactionByHash
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
