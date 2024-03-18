import { getNPub, getNAddressByPub } from './NERVEApi';
import { getEVMPub, getEVMAddressByPub } from './EVMApi';
import { getTRONPub, getTRONAddressByPub } from './TRONApi';
import { getBTCPub, getBTCAddressByPub } from './bitcoin';

/**
 *
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.address
 * @param {string} [param.message]
 * @returns {Promise<{address:{ NERVE: string, NULS: string, EVM: string, TRON: string }, pub: string}>}
 */
export async function generateAddress({
  provider,
  address,
  message = 'Generate Multi-chain Address'
}) {
  let pub;
  if (provider === 'unisat') {
    pub = await getBTCPub();
  } else if (provider === 'tronWeb') {
    pub = await getTRONPub(message);
  } else if (address.startsWith('0x')) {
    pub = await getEVMPub(provider, message);
  } else {
    pub = await getNPub(address);
  }

  return getAccountByPub(pub);
}

export function getAccountByPub(pub) {
  const NERVE = getNAddressByPub(pub, false);
  const NULS = getNAddressByPub(pub, true);
  const EVM = getEVMAddressByPub(pub);
  const TRON = getTRONAddressByPub(pub);
  const BTC = getBTCAddressByPub(pub);
  return {
    address: { NERVE, NULS, EVM, TRON, BTC },
    pub
  };
}
