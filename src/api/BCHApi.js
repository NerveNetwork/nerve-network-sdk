import nerve from 'nerve-sdk-js';
import bitcore from 'bitcore-lib-cash';
import { BitcoinRechargeData } from 'nerve-sdk-js/lib/model/BitcoinRechargeData';
import { timesDecimals } from '../utils/utils';
import { callOKLinkApi } from '../service';
import { getSplitGranularity, getUtxoCheckedInfo } from '../service/api';

export const BCH_PREFIX = 'bitcoincash:';

async function getUTXOs(address) {
  if (address.includes(':')) {
    address = address.split(':')[1];
  }
  try {
    const res = await callOKLinkApi('get', '/api/v5/explorer/address/utxo', {
      chainShortName: 'BCH',
      address,
      page: 1,
      limit: 100
    });
    return res?.data?.[0]?.utxoList || [];
  } catch (e) {
    return [];
  }
}

async function getFee() {
  try {
    const res = await callOKLinkApi('get', '/api/v5/explorer/blockchain/fee', {
      chainShortName: 'BCH'
    });
    return res?.data?.[0]?.bestTransactionFee || 0;
  } catch (e) {
    return 0;
  }
}

export async function getBCHPub() {
  return await window.NaboxWallet.bch.getPub();
}

export function getBCHAddressByPub(pub) {
  if (!pub) return '';
  const publicKey = new bitcore.PublicKey(pub, { compressed: false });
  const bchAddress = publicKey.toAddress(bitcore.Networks.mainnet)?.toString();
  return bchAddress?.split(BCH_PREFIX)?.[1] || '';
}

async function getAccountUTXOs(fromAddress) {
  const okLinkutxos = await getUTXOs(fromAddress);
  const utxos = okLinkutxos.map(v => {
    return {
      txid: v.txid,
      vout: v.index,
      amount: +timesDecimals(v.unspentAmount, 8)
    };
  });
  return utxos;
}

async function getFeeAndUTXO(fromAddress, amount, msg) {
  const utxos = await getAccountUTXOs(fromAddress);
  console.log(utxos, 234234234, nerve);
  const _amount = +timesDecimals(amount, 8);
  const { utxo, fee } = nerve.bch.calcFeeAndUTXO(utxos, _amount, msg, 'hex');
  return { utxo, fee };
}

function getCrossInMsg(nerveAddress, amount) {
  const txData = new BitcoinRechargeData();
  txData.to = nerveAddress;
  txData.value = timesDecimals(amount, 8);
  const opReturnBuffer = txData.serialize();
  const msg = opReturnBuffer.toString('hex');
  return msg;
}

/**
 * @param {object} data
 * @param {string} data.from  from BCH address
 * @param {string} data.nerveAddress  nerve target address
 * @param {string} data.amount  transfer amount
 * @returns string
 */
export async function calBCHTxFee({ from, nerveAddress, amount }) {
  const msg = getCrossInMsg(nerveAddress, amount);
  const { fee } = await getFeeAndUTXO(from, amount, msg);
  console.log(fee, 234234);
  return fee;
}

/**
 * @param {object} data
 * @param {string} data.multySignAddress NERVE BCH multy sign address
 * @param {string} data.nerveAddress  nerve target address
 * @param {string} data.amount  transfer amount
 * @returns {Promise<string>}
 */
export async function BCHCrossToNERVE({
  multySignAddress,
  nerveAddress,
  amount
}) {
  const msg = getCrossInMsg(nerveAddress, amount);
  return window.NaboxWallet.bch.sendTransaction({
    to: multySignAddress,
    amount,
    msg,
    dataEncoding: 'hex'
  });
}

export async function getBCHTransactionDetail(txid) {
  try {
    const res = await callOKLinkApi(
      'get',
      '/api/v5/explorer/transaction/transaction-fills',
      {
        chainShortName: 'BCH',
        txid
      }
    );
    return (res && res.data && res.data[0]) || {};
  } catch (e) {
    return {};
  }
}

export function validateBCHAddres(address) {
  try {
    return new bitcore.Address(address);
  } catch (e) {
    return false;
  }
}

export async function getBCHWithdrawInfo(senderAddress, hid) {
  const utxos = await getAccountUTXOs(senderAddress);
  const feeRate = nerve.bch.getFeeRate();
  const splitGranularity = await getSplitGranularity(hid); // 203 -- bch hid
  // console.log(utxos, feeRate, splitGranularity, '=============')
  const filteredUtxo = await getUtxoCheckedInfo(hid, utxos);
  return { utxos: filteredUtxo, feeRate, splitGranularity };
}

export function getBCHWithdrawalFee(utxos, feeRate, amount, splitGranularity) {
  const fee = nerve.bch.calcFeeWithdrawal(
    utxos,
    amount,
    feeRate,
    splitGranularity
  );
  return Math.ceil(fee);
}
