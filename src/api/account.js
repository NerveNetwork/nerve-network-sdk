import { getNPub, getNAddressByPub } from './NERVEApi';
import { getEVMPub, getEVMAddressByPub } from './EVMApi';
import { getTRONPub, getTRONAddressByPub } from './TRONApi';
/**
 *
 * @param {object} param
 * @param {string} param.provider
 * @param {string} [param.message]
 */
export async function generateAddress({
  provider,
  address,
  message = 'Generate Multi-chain Address'
}) {
  let pub;
  if (provider === 'tronWeb') {
    pub = await getTRONPub();
  } else if (address.startsWith('0x')) {
    pub = await getEVMPub(provider, message);
  } else {
    pub = await getNPub(address);
  }

  const NERVE = getNAddressByPub(pub, false);
  const NULS = getNAddressByPub(pub, true);
  const EVM = getEVMAddressByPub(pub);
  const TRON = getTRONAddressByPub(pub);
  return {
    address: { NERVE, NULS, EVM, TRON },
    pub
  };
}
