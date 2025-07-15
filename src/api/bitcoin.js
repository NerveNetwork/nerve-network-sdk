import nerve from 'nerve-sdk-js';
const {
  BitcoinRechargeData
} = require('nerve-sdk-js/lib/model/BitcoinRechargeData');
import { isBeta } from '../utils/utils';
import { getUtxoCheckedInfo } from '../service/api';

nerve.bitcoin.initEccLibForWeb();

export async function getBTCPub(provider) {
  return await provider.getPublicKey();
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
 * @param {object} param.provider
 * @param {string} param.from
 * @param {string} param.multySignAddress
 * @param {string} param.nerveAddress
 * @param {string} param.amount
 * @param {string} param.pub
 * @param {boolean} [param.isMainnet]
 */
export async function BitCoinCrossToNERVE({
  provider,
  from,
  multySignAddress,
  nerveAddress,
  amount,
  pub,
  isMainnet = true
}) {
  if (!provider) {
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
  return await sendTransaction(provider, psbtHex);
}

async function sendTransaction(provider, psbtHex) {
  const signResult = await provider.signPsbt(psbtHex);
  return await provider.pushPsbt(signResult);
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

export async function getBTCWithdrawalInfo(isMainnet, multySignAddress) {
  let utxos = await nerve.bitcoin.getUtxos(isMainnet, multySignAddress);
  if (Array.isArray(utxos)) {
    utxos.sort((a, b) => {
      if (a.value !== b.value) {
        return a.value < b.value ? -1 : 1;
      } else {
        return a.txid < b.txid ? -1 : 1;
      }
    });
  }
  const filteredUtxo = await getUtxoCheckedInfo(201, utxos)
  const feeRate = await nerve.bitcoin.getFeeRate(isMainnet);
  return { utxos: filteredUtxo, feeRate };
}

export function getBTCWithdrawalFee(utxos, feeRate, amount) {
  const fee = nerve.bitcoin.calcFeeWithdrawal(utxos, amount, feeRate);
  return Math.ceil(fee);
}

export async function getBTCSpeedUpAmount(isMainnet, utxoSize, feeRateOnTx) {
  const feeRateOnNetwork = await nerve.bitcoin.getFeeRate(isMainnet);
  const txSize = nerve.bitcoin.calcTxSizeWithdrawal(utxoSize);
  if (feeRateOnNetwork - feeRateOnTx > 0) {
    const needAddFee = txSize * (feeRateOnNetwork - feeRateOnTx);
    return needAddFee;
  }
  return false;
}

export function checkBTCAddress(isMainnet, address) {
  return nerve.bitcoin.isValidBTCAddress(isMainnet, address);
}
