import TronWeb from 'tronweb';
import { ethers } from 'ethers';
import { Minus, isBeta } from '../utils/utils';

const TRC20_ALLOWANCE_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

/* function getCustomTronWeb() {
  const psUrl = isBeta
    ? 'https://api.shasta.trongrid.io'
    : 'https://api.trongrid.io'
  const tronWeb = new TronWeb({
    fullHost: psUrl,
    privateKey: '01'
  })
  // const randomIndex = Math.floor(Math.random() * apiKey.length)
  // if (!isBeta) {
  //   tronWeb.setHeader({ 'TRON-PRO-API-KEY': apiKey[randomIndex] })
  // }
  return tronWeb
} */

export async function getTRONPub(message) {
  const tronWeb = window.tronWeb;
  if (!tronWeb?.defaultAddress?.base58) {
    throw new Error('Pls connect the plugin first');
  }
  const messageHex = tronWeb.toHex(message);
  const signature = await tronWeb.trx.sign(messageHex);
  const TRX_MESSAGE_HEADER = '\x19TRON Signed Message:\n32';
  const messageBytes = [
    ...ethers.utils.toUtf8Bytes(TRX_MESSAGE_HEADER),
    ...ethers.utils.arrayify(messageHex)
  ];
  const msgHash = ethers.utils.keccak256(messageBytes);
  const msgHashBytes = ethers.utils.arrayify(msgHash);
  const recoveredPubKey = ethers.utils.recoverPublicKey(
    msgHashBytes,
    signature
  );
  if (recoveredPubKey.startsWith('0x04')) {
    const compressPub = ethers.utils.computePublicKey(recoveredPubKey, true);
    return compressPub.slice(2);
  } else {
    throw new Error('Get pub error');
  }
}

export function getTRONAddressByPub(pub) {
  const tronWeb = new TronWeb({
    fullHost: isBeta
      ? 'https://api.shasta.trongrid.io'
      : 'https://api.trongrid.io'
  });
  pub = pub.startsWith('0x') ? pub : '0x' + pub;
  const unCompressPub = ethers.utils.computePublicKey(
    ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(pub), 33),
    false
  );
  const addressArray = tronWeb.utils.crypto.computeAddress(
    tronWeb.utils.code.hexStr2byteArray(unCompressPub.slice(2))
  );
  return tronWeb.address.fromHex(
    tronWeb.utils.code.byteArray2hexStr(addressArray)
  );
}

/**
 * @param {object} param
 * @param {string} param.address
 * @param {string} param.multySignContract
 * @param {number} param.tokenContract
 * @returns {Promise<boolean}>}
 */
export async function checkTRC20Allowance({
  address,
  tokenContract,
  multySignContract
}) {
  const tronWeb = window.tronWeb;
  const instance = await tronWeb.contract(TRC20_ALLOWANCE_ABI, tokenContract);
  const allowance = await instance.allowance(address, multySignContract).call();
  const baseAllowance = '39600000000000000000000000000';
  return Minus(baseAllowance, allowance.toString()) >= 0;
}

/**
 * @param {object} param
 * @param {string} param.multySignContract
 * @param {number} param.tokenContract
 * @returns {Promise<{hash: string}}>}
 */
export async function approveTRC20({ tokenContract, multySignContract }) {
  const tronWeb = window.tronWeb;
  if (
    !validAddress(multySignContract) ||
    (tokenContract && !validAddress(tokenContract))
  ) {
    throw new Error('Invalid address');
  }

  const instance = await tronWeb.contract().at(tokenContract);
  const approveAmount = tronWeb
    .toBigNumber(
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    )
    .toFixed();
  const hash = await instance.approve(multySignContract, approveAmount).send({
    // feeLimit:100_000_000,
    callValue: 0,
    shouldPollResponse: false
  });
  return { hash };
}

function validAddress(address) {
  return window.tronWeb.isAddress(address);
}

/**
 * @param {object} param
 * @param {string} param.to nerve address
 * @param {string} param.amount
 * @param {string} param.multySignContract
 * @param {number} param.tokenContract
 * @returns {Promise<{hash: string}}>}
 */
export async function TRONCrossToNERVE({
  to,
  amount,
  multySignContract,
  tokenContract
}) {
  if (
    !validAddress(multySignContract) ||
    (tokenContract && !validAddress(tokenContract))
  ) {
    throw new Error('Invalid address');
  }
  const tronWeb = window.tronWeb;
  const contract =
    tokenContract || '0x0000000000000000000000000000000000000000';
  const instance = await tronWeb.contract().at(multySignContract);
  const hash = await instance.crossOut(to, amount, contract).send({
    // feeLimit:100_000_000,
    callValue: tokenContract ? 0 : amount,
    shouldPollResponse: false
  });
  return { hash };
}
