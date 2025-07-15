import axios from 'axios';
const tbc = require('tbc-lib-js');
import {API, poolNFT, poolNFT2, MultiSig, FT as FTUtil} from "tbc-contract";
import { BitcoinRechargeData } from 'nerve-sdk-js/lib/model/BitcoinRechargeData';
import { divisionDecimals, Plus, timesDecimals } from '../utils/utils';


const PublicKey = tbc?.PublicKey;
const PrivateKey = tbc?.PrivateKey;
const Address = tbc?.Address;
const Script = tbc?.Script;
const FT = tbc?.FT;
const NFT = tbc?.NFT;
const Networks = tbc?.Networks;
const Transaction = tbc?.Transaction;
const Message = tbc?.Message;
const ECIES = tbc?.ECIES;

const TBC_NET_DUST = 80; // minimun amount

const FEE_BYTE = 0.1;

const TBC_FT_FEE = 800;

const TBC_NETWORK = 'mainnet';

export const TBC_FT_FEE_AMOUNT = 0.0008;

export const TBC_POOLNFT_FEE = 0.01;

const apiUrl = 'https://turingwallet.xyz/v1/tbc';

export async function getTBCPub() {
  const result = await window.NaboxWallet.tbc.getPubKey();
  return result?.tbcPubKey || '';
}

export function getTBCAddressByPub(pub) {
  if (!pub) return '';
  const tbcPubKey = new PublicKey(pub);
  const addressData = Address.fromPublicKey(
    tbcPubKey,
    // (isBeta && 'testnet') || 'livenet'
    'livenet'
  );
  return addressData.toString();
}

export const validateTBCAddress = address => {
  try {
    return Address.isValid(address, 'livenet');
  } catch (e) {
    return false;
  }
};

export const getTBCTransactionFee = async (transactionData, utxos, tempFee) => {
  let { from, to, amount, isMaxAmount, ftContractId } = transactionData;
  if (ftContractId) return '0.0008';
  amount = timesDecimals(amount, 6);
  let fee = tempFee || 0;
  if (!utxos?.length) {
    utxos = await getTBCUTXOs(from);
  }
  const targetAmount = Plus(amount, fee || 0);
  const { selectedUtxos, remainingUtxos } = selectTBCUtxos(utxos, targetAmount);
  const tempUtxo = selectedUtxos?.map(utxo => ({
    address: from,
    txId: utxo?.tx_hash,
    outputIndex: utxo?.tx_pos,
    script: Script.buildPublicKeyHashOut(from).toString(),
    satoshis: utxo?.value
  }));
  const transaction = new Transaction();
  transaction.version = 10;
  transaction?.from(tempUtxo);
  // transaction?.to(to, Number(amount));
  if (to.startsWith('1')) {
    transaction.addOutput(
      new tbc.Transaction.Output({
        script: tbc.Script.buildPublicKeyHashOut(to),
        satoshis: Number(amount)
      })
    );
  } else {
    transaction.addOutput(
      new tbc.Transaction.Output({
        script: tbc.Script.fromASM(MultiSig.getMultiSigLockScript(to)),
        satoshis: Number(amount)
      })
    );
  }

  const originalFee = Math.ceil(transaction?.getEstimateSize() * FEE_BYTE);
  fee = originalFee < TBC_NET_DUST ? TBC_NET_DUST : originalFee;
  const costAmount = Plus(amount, fee);
  const selectUTXOAmount = selectedUtxos?.reduce(
    (acr, cur) => (acr || 0) + (cur?.value || 0),
    0
  );
  if (isMaxAmount) {
    return divisionDecimals(fee, 6);
  }
  if (costAmount > selectUTXOAmount && remainingUtxos?.length) {
    return await getTBCTransactionFee(transactionData, utxos, fee);
  }
  return divisionDecimals(fee, 6);
};

function transferTBCData(nerveTo, tbcAmount, extend = '') {
  const txData = new BitcoinRechargeData();
  txData.to = nerveTo;
  txData.value = tbcAmount;
  txData.extend0 = extend;
  return '88888888' + txData.serialize().toString('hex');
}

function transferTokenData(
  nerveTo,
  tokenAmount,
  tokenContract,
  extend = '',
  tbcAmount = 0
) {
  const txData = new BitcoinRechargeData();
  txData.to = nerveTo;
  txData.value = tbcAmount;
  txData.extend0 = extend;
  txData.extend1 = tokenContract + '' + tokenAmount;
  return '88888888' + txData.serialize().toString('hex');
}

/**
 * @param {object} data
 * @param {string} data.multySignAddress NERVE TBC multy sign address
 * @param {string} data.nerveAddress  nerve target address
 * @param {string} data.amount  transfer amount, TBC(with decimals), token(without decimals )
 * @param {string?} data.tokenContract  token contract
 * @param {number} data.decimals  token decimals
 * @returns {Promise<string>}
 */
export async function TBCCrossToNERVE({
  multySignAddress,
  nerveAddress,
  amount,
  tokenContract,
  decimals
}) {
  let remarkData, params;
  if (tokenContract) {
    const tokenAmount = timesDecimals(amount, decimals);
    remarkData = transferTokenData(nerveAddress, tokenAmount, tokenContract);
    params = [
      {
        flag: 'FT_TRANSFER',
        ft_contract_address: tokenContract,
        ft_amount: amount,
        address: multySignAddress,
        // tbc_amount: '0',
        remark: remarkData
      }
    ];
  } else {
    const tbcAmount = timesDecimals(amount, decimals);
    remarkData = transferTBCData(nerveAddress, tbcAmount);
    params = [
      {
        flag: 'P2PKH',
        satoshis: tbcAmount,
        address: multySignAddress,
        remark: remarkData
      }
    ];
  }
  console.log(params, 23424);
  return window.NaboxWallet.tbc.sendTransaction(params);
}

export const handleGetTBCBalance = async (address, ftContractId) => {
  if (!ftContractId) {
    return await getTBCBalance(address);
  } else {
    return await getTBCFTBalance(address, ftContractId);
  }
};

export const getTBCBalance = async address => {
  const url = `${apiUrl}/address/${address}/get/balance`;
  try {
    const res = await axios.get(url);
    const result = res.data;
    console.log(result, '123');
    if (result?.status === 0) {
      return {
        balance: divisionDecimals(result.data.balance, 6)
      };
    }
    return { balance: '0' };
  } catch (e) {
    return { balance: '0' };
  }
};

export const getTBCFTBalance = async (address, ftContractId) => {
  try {
    const url = `${apiUrl}/main/ft/balance/address/${address}/contract/${ftContractId}`;
    const res = await axios.get(url);
    const result = res.data;
    console.log(result, 234);
    if (result?.ftContractId) {
      return {
        balance: divisionDecimals(result.ftBalance, result.ftDecimal),
        decimals: result.ftDecimal || 6
      };
    }
    return { balance: '0' };
  } catch (e) {
    return { balance: '0' };
  }
};

export const getTBCTransactionByHash = async hash => {
  try {
    const url = `${apiUrl}/main/tx/hex/${hash}/decode`;
    const res = await axios.get(url);
    if (res?.data?.hash) {
      return res.data;
    }
    return {};
  } catch (e) {
    console.error(e, 'error');
    return {};
  }
};

export const getTBCUTXOs = async address => {
  try {
    const url = `${apiUrl}/main/address/${address}/unspent`;
    const res = await axios.get(url);
    if (res.data?.length) {
      return res.data;
    }
    return [];
  } catch (e) {
    console.error(e, 'error');
    return [];
  }
};

const selectTBCUtxos = (utxos, targetAmount, isFT) => {
  let selectedUtxos = [];
  let remainingUtxos = [];
  let totalAmount = 0;
  let tempUTXOs;
  if (isFT) {
    tempUTXOs = utxos.sort((a, b) => b.ftBalance - a.ftBalance);
  } else {
    tempUTXOs = utxos;
  }
  for (const utxo of tempUTXOs) {
    if (totalAmount < targetAmount) {
      totalAmount += (!isFT && utxo.value) || utxo.ftBalance;
      selectedUtxos.push(utxo);
    } else {
      remainingUtxos.push(utxo);
    }
  }
  return {
    selectedUtxos,
    remainingUtxos
  };
};
