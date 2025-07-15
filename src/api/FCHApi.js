import nerve from 'nerve-sdk-js';
import fch from 'fch-sdk';
import { BitcoinRechargeData } from 'nerve-sdk-js/lib/model/BitcoinRechargeData';
import { timesDecimals } from '../utils/utils';
import { getSplitGranularity, getUtxoCheckedInfo } from '../service/api';
// const { BitcoinRechargeData } = require('nerve-sdk-js/model/BitcoinRechargeData');

export async function getFCHPub() {
  return await window.NaboxWallet.fch.getPub();
}

export function getFCHAddressByPub(pub) {
  return fch.getAddress(pub);
}

async function getFeeAndUTXO(fromAddress, amount, msg) {
  const utxos = await fch.getAccountUTXOs(fromAddress);
  console.log(utxos, '11111111111', amount)
  const { utxo, fee } = fch.calcFeeAndUTXO(utxos, amount, msg);
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
 * @param {string} data.from  from FCH address
 * @param {string} data.nerveAddress  nerve target address
 * @param {string} data.amount  transfer amount
 * @returns string
 */
export async function calFCHTxFee({ from, nerveAddress, amount }) {
  const msg = getCrossInMsg(nerveAddress, amount);
  const { fee } = await getFeeAndUTXO(from, amount, msg);
  return fee;
}

/**
 * @param {object} data
 * @param {string} data.multySignAddress NERVE FCH multy sign address
 * @param {string} data.nerveAddress  nerve target address
 * @param {string} data.amount  transfer amount
 * @returns {Promise<string>}
 */
export async function FCHCrossToNERVE({
  multySignAddress,
  nerveAddress,
  amount
}) {
  const msg = getCrossInMsg(nerveAddress, amount);
  return window.NaboxWallet.fch.sendTransaction({
    to: multySignAddress,
    amount,
    msg
  });
}

export function validateFCHAddres(address) {
  return fch.validFchAddress(address)
}

export async function getFCHWithdrawInfo(senderAddress, hid) {
  const utxos = await fch.getAccountUTXOs(senderAddress)
  const feeRate = nerve.fch.getFeeRate()
  const filteredUtxo = await getUtxoCheckedInfo(hid, utxos)
  const splitGranularity = await getSplitGranularity(hid) // 202 -- fch hid
  return { utxos: filteredUtxo, feeRate, splitGranularity }
}

export function getFCHWithdrawalFee(utxos, feeRate, amount, splitGranularity) {
  const fee = nerve.fch.calcFeeWithdrawal(utxos, amount, feeRate, splitGranularity);
  return Math.ceil(fee);
}
