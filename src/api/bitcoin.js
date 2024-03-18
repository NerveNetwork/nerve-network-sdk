import nerve from 'nerve-sdk-js';
const {
  BitcoinRechargeData
} = require('nerve-sdk-js/lib/model/BitcoinRechargeData');
import { isBeta } from '../utils/utils';

nerve.bitcoin.initEccLibForWeb();

export async function getBTCPub() {
  return await window.unisat.getPublicKey();
}

export function getBTCAddressByPub(pub) {
  const addressObj = nerve.bitcoin.getAddressByPub(pub, !isBeta);
  return Object.values(addressObj);
}

/**
 * @param {object} param
 * @param {string} param.from
 * @param {string} param.multySignAddress
 * @param {string} param.nerveAddress
 * @param {string} param.amount
 * @param {boolean} [param.isMainnet]
 */
export async function calBTCTxFee({
  from,
  multySignAddress,
  nerveAddress,
  amount,
  isMainnet = true
}) {
  amount = Number(amount);
  const utxos = await nerve.bitcoin.getUtxos(isMainnet, from, 10000);
  const feeRate = await nerve.bitcoin.getFeeRate(isMainnet);
  const txData = new BitcoinRechargeData();
  txData.to = nerveAddress;
  txData.value = amount;
  const opReturnBuffer = txData.serialize();
  const opReturnArray = [opReturnBuffer];
  const sendAmount = txData.value;
  const addressType = nerve.bitcoin.checkAddressType(isMainnet, from);
  let { size, fee } = nerve.bitcoin.calcSpendingUtxosAndFee(
    isMainnet,
    addressType,
    utxos,
    multySignAddress,
    sendAmount,
    feeRate,
    opReturnArray
  );
  return fee;
}

/**
 * @param {object} param
 * @param {string} param.from
 * @param {string} param.multySignAddress
 * @param {string} param.nerveAddress
 * @param {string} param.amount
 * @param {string} param.pub
 * @param {boolean} [param.isMainnet]
 */
export async function BitCoinCrossToNERVE({
  from,
  multySignAddress,
  nerveAddress,
  amount,
  pub,
  isMainnet = true
}) {
  if (!window.unisat) {
    throw new Error('Please install the wallet first');
  }
  amount = Number(amount);
  const utxos = await nerve.bitcoin.getUtxos(isMainnet, from, amount);
  const feeRate = await nerve.bitcoin.getFeeRate(isMainnet);
  const txData = new BitcoinRechargeData();
  txData.to = nerveAddress;
  txData.value = amount;
  const opReturnBuffer = txData.serialize();
  const opReturnArray = [opReturnBuffer];
  const sendAmount = txData.value;
  const addressType = nerve.bitcoin.checkAddressType(isMainnet, from);
  let psbtHex;
  if (addressType === 0) {
    psbtHex = await nerve.bitcoin.createLegacyTx(
      isMainnet,
      pub,
      utxos,
      multySignAddress,
      sendAmount,
      feeRate,
      opReturnArray
    );
  } else if (addressType === 1) {
    psbtHex = nerve.bitcoin.createNestedSegwitTx(
      isMainnet,
      pub,
      utxos,
      multySignAddress,
      sendAmount,
      feeRate,
      opReturnArray
    );
  } else if (addressType === 2) {
    psbtHex = nerve.bitcoin.createNativeSegwitTx(
      isMainnet,
      pub,
      utxos,
      multySignAddress,
      sendAmount,
      feeRate,
      opReturnArray
    );
  } else if (addressType === 3) {
    psbtHex = nerve.bitcoin.createTaprootTx(
      isMainnet,
      pub,
      utxos,
      multySignAddress,
      sendAmount,
      feeRate,
      opReturnArray
    );
  } else {
    throw new Error('Invalid Address');
  }
  return await sendTransaction(psbtHex);
}

async function sendTransaction(psbtHex) {
  const signResult = await window.unisat.signPsbt(psbtHex);
  return await window.unisat.pushPsbt(signResult);
}

export async function getBTCTxDetail(txid, isMainnet) {
  return await nerve.bitcoin.getrawtransaction(isMainnet, txid, true);
}

export async function checkBTCTxConfirmed(txid, isMainnet) {
  try {
    const tx = await nerve.bitcoin.getrawtransaction(isMainnet, txid, true);
    if (tx && tx.confirmations) {
      return true;
    }
  } catch (e) {
    //
  }
  return false;
}
