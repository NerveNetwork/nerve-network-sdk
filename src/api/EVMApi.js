import { ethers, BigNumber } from 'ethers';
import { isBeta } from '../utils/utils';

export async function getEVMPub(provider, message) {
  if (!window[provider]?.selectedAddress) {
    throw new Error('Pls connect the plugin first');
  }
  const _provider = getProvider(provider);
  const jsonRpcSigner = _provider.getSigner();
  const signature = await jsonRpcSigner.signMessage(message);
  const msgHash = ethers.utils.hashMessage(message);
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

export const getEVMAddressByPub = pub => {
  pub = pub.startsWith('0x') ? pub : '0x' + pub;
  return ethers.utils.computeAddress(
    ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(pub), 33)
  );
};

const CROSS_OUT_ABI = [
  'function crossOut(string to, uint256 amount, address ERC20) public payable returns (bool)'
];

const ERC20_ABI = [
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

function getProvider(walletType, rpcUrl) {
  if (rpcUrl) {
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  }
  return new ethers.providers.Web3Provider(window[walletType]);
}

/**
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.tokenContract
 * @param {string} param.multySignContract
 * @param {string} param.address
 * @param {string} param.amount
 */
export async function checkERC20Allowance({
  provider,
  tokenContract,
  multySignContract,
  address,
  amount
}) {
  if (!window[provider]) {
    throw new Error(`${provider} not found`);
  }
  const _provider = getProvider(provider);
  const contract = new ethers.Contract(tokenContract, ERC20_ABI, _provider);
  const allowancePromise = contract.allowance(address, multySignContract);
  return allowancePromise
    .then(allowance => {
      // console.log(allowance, arguments, '-=-=-=-=');
      // const baseAllowance = '39600000000000000000000000000';
      const needAllowance = amount
        ? BigNumber.from(amount)
        : '39600000000000000000000000000';
      return allowance.sub(needAllowance).lt('0');
    })
    .catch(e => {
      // console.log(e, 3333);
      return true;
    });
}

/**
 *
 * @param {string} provider
 * @param {string} tokenContract
 * @param {string} multySignContract
 * @param {string} address
 * @returns
 */
export async function approveERC20({
  provider,
  tokenContract,
  multySignContract,
  address
}) {
  if (!window[provider]) {
    throw new Error(`${provider} not found`);
  }
  if (!tokenContract || !multySignContract || !address) {
    throw new Error('Invalid params');
  }
  const _provider = getProvider(provider);

  await validateAddress(tokenContract);
  await validateAddress(multySignContract);
  await validateAddress(address);
  const iface = new ethers.utils.Interface(ERC20_ABI);
  const data = iface.encodeFunctionData('approve', [
    multySignContract,
    BigNumber.from(
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    )
  ]);
  const txData = {
    to: tokenContract,
    from: address,
    value: '0x00',
    data: data
  };
  const KlaytnNativeId = getKlaytnNativeId();
  if (_provider.provider?.chainId === KlaytnNativeId) {
    // Klaytn set default gas
    txData.gasPrice = '0x3a35294400';
  }
  await validateTx(_provider, txData);
  return await sendTransaction(_provider, txData);
}

/**
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.multySignContract
 * @param {string} param.nerveAddress
 * @param {string} param.amount
 * @param {string} param.from
 * @param {string} param.tokenContract
 */
export async function EVMCrossToNERVE({
  provider,
  multySignContract,
  nerveAddress,
  amount,
  from,
  tokenContract,
  gasPrice,
  gasLimit
}) {
  if (!window[provider]) {
    throw new Error(`${provider} not found`);
  }
  if (!multySignContract || !nerveAddress || !from) {
    throw new Error('Invalid params');
  }
  const _provider = getProvider(provider);
  let txData;
  validateAddress(multySignContract);
  validateAddress(from);
  const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
  if (tokenContract) {
    validateAddress(tokenContract);
    const data = iface.encodeFunctionData('crossOut', [
      nerveAddress,
      amount,
      tokenContract
    ]);
    txData = {
      from,
      to: multySignContract,
      value: '0x00',
      data
    };
  } else {
    const data = iface.encodeFunctionData('crossOut', [
      nerveAddress,
      amount,
      '0x0000000000000000000000000000000000000000'
    ]);
    txData = {
      from,
      to: multySignContract,
      value: amount,
      data
    };
  }
  if (gasPrice) {
    txData.gasPrice = gasPrice;
  }
  if (gasLimit) {
    txData.gasLimit = gasLimit;
  }
  const KlaytnNativeId = getKlaytnNativeId();
  if (_provider.provider?.chainId === KlaytnNativeId) {
    // Klaytn set default gas
    txData.gasPrice = '0x3a35294400';
  }
  await validateTx(_provider, txData);
  return await sendTransaction(_provider, txData);
}

function validateAddress(address) {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch (error) {
    throw new Error('Invalid address');
  }
}

async function validateTx(provider, tx) {
  const isShardeum = getShardeumNativeId() === provider.provider?.chainId;
  if (isShardeum) {
    return;
  }
  return await provider.call(tx).then(result => {
    const reason = ethers.utils.toUtf8String('0x' + result.substr(138));
    if (reason) {
      throw reason;
    }
  });
}

async function sendTransaction(provider, tx) {
  const wallet = provider.getSigner();
  return await wallet.sendTransaction(tx);
}

function getShardeumNativeId() {
  return isBeta ? '0x1f92' : '';
}

function getKlaytnNativeId() {
  return isBeta ? '0x3e9' : '0x2019';
}
