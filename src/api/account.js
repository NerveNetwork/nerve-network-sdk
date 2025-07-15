import { getNAddressByPub } from './NERVEApi';
import { getEVMPub, getEVMAddressByPub } from './EVMApi';
import { getTRONPub, getTRONAddressByPub } from './TRONApi';
import { getBTCPub, getBTCAddressByPub } from './bitcoin';
import { getFCHPub, getFCHAddressByPub } from './FCHApi';
import { getBCHPub, getBCHAddressByPub } from './BCHApi';
import { getTBCPub, getTBCAddressByPub } from './TBCApi';

/**
 *
 * @param {object} param
 * @param {string} param.provider
 * @param {string} param.address
 * @param {string} [param.message]
 * @param {string} [param.network]
 * @returns {Promise<{address:{ NERVE: string, NULS: string, EVM: string, TRON: string, FCH: string }, pub: string}>}
 */
export async function generateAddress({
  provider,
  message = 'Generate Multi-chain Address',
  network,
  address
}) {
  let pub;
  if (network === 'BTC') {
    pub = await getBTCPub(provider);
  } else if (network === 'TRON') {
    pub = await getTRONPub(provider, message);
  } else if (network === 'FCH') {
    pub = await getFCHPub(provider);
  } else if (network === 'BCH') {
    pub = await getBCHPub(provider);
  } else if (network === 'TBC') {
    pub = await getTBCPub(provider);
  } else {
    pub = await getEVMPub(provider, message);
  }

  return getAccountByPub(pub);
}

export function getAccountByPub(pub) {
  const NERVE = getNAddressByPub(pub, false);
  const NULS = getNAddressByPub(pub, true);
  const EVM = getEVMAddressByPub(pub);
  const TRON = getTRONAddressByPub(pub);
  const BTC = getBTCAddressByPub(pub);
  const FCH = getFCHAddressByPub(pub);
  const BCH = getBCHAddressByPub(pub);
  const TBC = getTBCAddressByPub(pub);
  return {
    address: { NERVE, NULS, EVM, TRON, BTC, FCH, BCH, TBC },
    pub
  };
}
