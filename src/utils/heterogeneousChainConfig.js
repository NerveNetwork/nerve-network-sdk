import { isBeta } from './utils';

export function getHetergenousChainConfig() {
  const RPC_URL = {
    Ethereum: isBeta
      ? 'https://ethereum-goerli.publicnode.com'
      : 'https://ethereum.publicnode.com',
    BSC: isBeta
      ? 'https://data-seed-prebsc-1-s1.binance.org:8545/'
      : 'https://bsc-dataseed.binance.org/',
    Polygon: isBeta
      ? 'https://polygon-testnet.public.blastapi.io'
      : 'https://polygon-rpc.com',
    // Heco: isBeta
    //   ? 'https://http-testnet.hecochain.com'
    //   : 'https://http-mainnet.hecochain.com',
    OKTC: isBeta
      ? 'https://exchaintestrpc.okex.org'
      : 'https://exchainrpc.okex.org',
    Avalanche: isBeta
      ? 'https://api.avax-test.network/ext/bc/C/rpc'
      : 'https://api.avax.network/ext/bc/C/rpc',
    Harmony: isBeta ? 'https://api.s0.b.hmny.io' : 'https://api.harmony.one',
    KCC: isBeta
      ? 'https://rpc-testnet.kcc.network'
      : 'https://rpc-mainnet.kcc.network',
    Cronos: isBeta
      ? 'https://cronos-testnet-3.crypto.org:8545'
      : 'https://evm-cronos.crypto.org',
    Arbitrum: isBeta
      ? 'https://rinkeby.arbitrum.io/rpc'
      : 'https://arb1.arbitrum.io/rpc',
    Fantom: isBeta
      ? 'https://rpc.testnet.fantom.network'
      : 'https://rpc.ftm.tools',
    Metis: isBeta
      ? 'https://stardust.metis.io/?owner=588'
      : 'https://andromeda.metis.io/?owner=1088',
    IoTex: isBeta
      ? 'https://babel-api.testnet.iotex.io'
      : 'https://babel-api.mainnet.iotex.io',
    Optimism: isBeta
      ? 'https://kovan.optimism.io'
      : 'https://optimism-mainnet.public.blastapi.io',
    KAIA: isBeta
      ? 'https://api.baobab.klaytn.net:8651'
      : 'https://public-node-api.klaytnapi.com/v1/cypress',
    smartBCH: isBeta ? 'https://moeing.tech:9545' : 'https://smartbch.greyh.at',
    ENULS: isBeta ? 'https://beta.evmapi.nuls.io' : 'https://evmapi.nuls.io',
    KAVA: isBeta ? 'https://evm.testnet.kava.io' : 'https://evm.kava.io',
    ETHW: 'https://mainnet.ethereumpow.org/',
    REI: isBeta
      ? 'https://rpc-testnet.rei.network'
      : 'https://rpc-mainnet.rei.network',
    zkSync: isBeta
      ? 'https://zksync2-testnet.zksync.dev'
      : 'https://zksync2-mainnet.zksync.io',
    eosEVM: isBeta
      ? 'https://api.testnet.evm.eosnetwork.com'
      : 'https://api.evm.eosnetwork.com',
    polygonZkEVM: isBeta
      ? 'https://rpc.public.zkevm-test.net'
      : 'https://zkevm-rpc.com',

    Linea: isBeta
      ? 'https://rpc.goerli.linea.build'
      : 'https://rpc.linea.build',
    CELO: isBeta
      ? 'https://alfajores-forno.celo-testnet.org'
      : 'https://forno.celo.org',
    ETC: isBeta
      ? 'https://rpc.mordor.etccooperative.org'
      : 'https://etc.rivet.link',
    BASE: isBeta ? 'https://goerli.base.org' : 'https://mainnet.base.org',
    Scroll: isBeta ? 'https://alpha-rpc.scroll.io/l2' : 'https://rpc.scroll.io',
    Bitgert: isBeta
      ? 'https://testnet-rpc.brisescan.com'
      : 'https://mainnet-rpc.brisescan.com',
    Janus: isBeta ? 'https://rpc.test.janusnetwork.io/' : '',
    Manta: isBeta
      ? 'https://manta-testnet.calderachain.xyz/http'
      : 'https://pacific-rpc.manta.network/http',
    X1: isBeta ? 'https://x1testrpc.okx.com' : '',
    BTC: '',
    Zeta: isBeta
      ? 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
      : 'https://api.mainnet.zetachain.com/evm'
  };
  const _networkInfo = {
    BTC: {
      name: 'BTC',
      chainName: isBeta ? 'testnet' : 'livenet',
      chainId: isBeta ? 201 : '',
      assetKey: isBeta ? '5-171' : '',
      mainAsset: 'BTC',
      nativeId: '0x-a',
      decimals: 8,
      rpcUrl: RPC_URL.BTC
    },
    Ethereum: {
      name: isBeta ? 'Goerli' : 'Ethereum',
      chainName: isBeta ? 'Goerli' : 'Ethereum', // 用于metamask添加链时显示链名称 区分正式、测试网
      chainId: isBeta ? 118 : 101,
      assetKey: isBeta ? '5-2' : '9-2',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0x5' : '0x1',
      decimals: 18,
      rpcUrl: RPC_URL.Ethereum
    },
    BSC: {
      name: 'BSC',
      chainName: isBeta ? 'BSC_Beta' : 'BSC',
      chainId: 102,
      assetKey: isBeta ? '5-8' : '9-25',
      mainAsset: 'BNB',
      nativeId: isBeta ? '0x61' : '0x38',
      decimals: 18,
      rpcUrl: RPC_URL.BSC
    },
    Polygon: {
      name: 'Polygon',
      chainName: isBeta ? 'Polygon_Beta' : 'Polygon',
      chainId: 106,
      assetKey: isBeta ? '5-34' : '9-160',
      mainAsset: 'POL',
      nativeId: isBeta ? '0x13881' : '0x89',
      decimals: 18,
      rpcUrl: RPC_URL.Polygon
    },
    // Heco: {
    //   name: 'Heco',
    //   chainName: isBeta ? 'Heco_Beta' : 'Heco',
    //   chainId: 103,
    //   assetKey: isBeta ? '5-9' : '9-55',
    //   mainAsset: 'HT',
    //   nativeId: isBeta ? '0x100' : '0x80',
    //   decimals: 18,
    //   rpcUrl: RPC_URL.Heco
    // },
    OKTC: {
      name: 'OKTC',
      chainName: isBeta ? 'OKC_Beta' : 'OKTC',
      chainId: 104,
      assetKey: isBeta ? '5-12' : '9-87',
      mainAsset: 'OKT',
      nativeId: isBeta ? '0x41' : '0x42',
      decimals: 18,
      rpcUrl: RPC_URL.OKTC
    },
    Avalanche: {
      name: 'Avalanche',
      chainName: isBeta ? 'Avalanche_Beta' : 'Avalanche',
      chainId: 110,
      assetKey: isBeta ? '5-94' : '9-267',
      mainAsset: 'AVAX',
      nativeId: isBeta ? '0xa869' : '0xa86a',
      decimals: 18,
      rpcUrl: RPC_URL.Avalanche
    },
    Harmony: {
      name: 'Harmony',
      chainName: isBeta ? 'Harmony_Beta' : 'Harmony',
      chainId: 105,
      assetKey: isBeta ? '5-33' : '9-159',
      mainAsset: 'ONE',
      nativeId: isBeta ? '0x6357d2e0' : '0x63564c40',
      decimals: 18,
      rpcUrl: RPC_URL.Harmony
    },
    KCC: {
      name: 'KCC',
      chainName: isBeta ? 'KCC_Beta' : 'KCC',
      chainId: 107,
      assetKey: isBeta ? '5-35' : '9-161',
      mainAsset: 'KCS',
      nativeId: isBeta ? '0x142' : '0x141',
      decimals: 18,
      rpcUrl: RPC_URL.KCC
    },
    Cronos: {
      name: 'Cronos',
      chainName: isBeta ? 'Cronos_Beta' : 'Cronos',
      chainId: 109,
      assetKey: isBeta ? '5-93' : '9-266',
      mainAsset: 'CRO',
      nativeId: isBeta ? '0x152' : '0x19',
      decimals: 18,
      rpcUrl: RPC_URL.Cronos
    },
    Arbitrum: {
      name: 'Arbitrum',
      chainName: isBeta ? 'Arbitrum_Beta' : 'Arbitrum',
      chainId: 111,
      assetKey: isBeta ? '5-95' : '9-268',
      mainAsset: 'AETH',
      nativeId: isBeta ? '0x66eeb' : '0xa4b1',
      decimals: 18,
      rpcUrl: RPC_URL.Arbitrum
    },
    Fantom: {
      name: 'Fantom',
      chainName: isBeta ? 'Fantom_Beta' : 'Fantom',
      chainId: 112,
      assetKey: isBeta ? '5-96' : '9-269',
      mainAsset: 'FTM',
      nativeId: isBeta ? '0xfa2' : '0xfa',
      decimals: 18,
      rpcUrl: RPC_URL.Fantom
    },
    TRON: {
      name: 'TRON',
      chainName: 'TRON',
      chainId: 108,
      assetKey: isBeta ? '5-55' : '9-218',
      mainAsset: 'TRX',
      nativeId: '',
      decimals: 6
    },
    Metis: {
      name: 'Metis',
      chainName: isBeta ? 'Metis_Beta' : 'Metis',
      chainId: 113,
      assetKey: isBeta ? '5-115' : '9-445',
      mainAsset: 'METIS',
      nativeId: isBeta ? '0x24c' : '0x440',
      decimals: 18,
      rpcUrl: RPC_URL.Metis
    },
    IoTex: {
      name: 'IoTex',
      chainName: isBeta ? 'IoTex_Beta' : 'IoTex',
      chainId: 114,
      assetKey: isBeta ? '5-116' : '9-446',
      mainAsset: 'IOTX',
      nativeId: isBeta ? '0x1252' : '0x1251',
      decimals: 18,
      rpcUrl: RPC_URL.IoTex
    },
    Optimism: {
      name: 'Optimism',
      chainName: isBeta ? 'Optimism_Beta' : 'Optimism',
      chainId: 115,
      assetKey: isBeta ? '5-117' : '9-447',
      mainAsset: 'OETH',
      nativeId: isBeta ? '0x45' : '0xa',
      decimals: 18,
      rpcUrl: RPC_URL.Optimism
    },
    KAIA: {
      name: 'KAIA',
      chainName: isBeta ? 'KAIA_Beta' : 'KAIA',
      chainId: 116,
      assetKey: isBeta ? '5-118' : '9-448',
      mainAsset: 'KLAY',
      nativeId: isBeta ? '0x3e9' : '0x2019',
      decimals: 18,
      rpcUrl: RPC_URL.KAIA
    },
    smartBCH: {
      name: 'smartBCH',
      chainName: isBeta ? 'smartBCH_Beta' : 'smartBCH',
      chainId: 117,
      assetKey: isBeta ? '5-119' : '9-449',
      mainAsset: 'BCH',
      nativeId: isBeta ? '0x2711' : '0x2710',
      decimals: 18,
      rpcUrl: RPC_URL.smartBCH
    },
    ENULS: {
      name: 'ENULS',
      chainName: isBeta ? 'ENULS_Beta' : 'ENULS',
      chainId: 119,
      assetKey: isBeta ? '2-1' : '1-1',
      mainAsset: 'NULS',
      nativeId: isBeta ? '0x78' : '0x77',
      decimals: 18,
      rpcUrl: RPC_URL.ENULS
    },
    KAVA: {
      name: 'KAVA',
      chainName: isBeta ? 'KAVA_Beta' : 'KAVA',
      chainId: 120,
      assetKey: isBeta ? '5-136' : '9-597',
      mainAsset: 'KAVA',
      nativeId: isBeta ? '0x8ad' : '0x8ae',
      decimals: 18,
      rpcUrl: RPC_URL.KAVA
    },
    ETHW: {
      // 只有主网
      name: 'ETHW',
      chainName: isBeta ? '' : 'ETHW',
      chainId: 121,
      assetKey: isBeta ? '' : '9-598',
      mainAsset: 'ETHW',
      nativeId: '0x2711',
      decimals: 18,
      rpcUrl: RPC_URL.ETHW
    },
    REI: {
      name: 'REI',
      chainName: isBeta ? 'REI_Beta' : 'REI',
      chainId: 122,
      assetKey: isBeta ? '5-138' : '9-620',
      mainAsset: 'REI',
      nativeId: isBeta ? '0x3045' : '0xbabd',
      decimals: 18,
      rpcUrl: RPC_URL.REI
    },
    zkSync: {
      name: 'zkSync',
      chainName: isBeta ? 'zkSync_Beta' : 'zkSync',
      chainId: 123,
      assetKey: isBeta ? '5-139' : '9-621',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0x118' : '0x144',
      decimals: 18,
      rpcUrl: RPC_URL.zkSync
    },
    EOSEVM: {
      name: 'EOSEVM',
      chainName: isBeta ? 'EOSEVM_Beta' : 'EOSEVM',
      chainId: 124,
      assetKey: isBeta ? '5-148' : '9-692',
      mainAsset: 'EOS',
      nativeId: isBeta ? '0x3cc5' : '0x4571',
      decimals: 18,
      rpcUrl: RPC_URL.eosEVM
    },
    'Polygon zkEVM': {
      name: 'Polygon zkEVM',
      chainName: isBeta ? 'Polygon zkEVM_Beta' : 'Polygon zkEVM',
      chainId: 125,
      assetKey: isBeta ? '5-149' : '9-693',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0x5a2' : '0x44d',
      decimals: 18,
      rpcUrl: RPC_URL.polygonZkEVM
    },
    Linea: {
      name: 'Linea',
      chainName: isBeta ? 'Linea_Beta' : 'Linea',
      chainId: 126,
      assetKey: isBeta ? '5-150' : '9-694',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0xe704' : '0xe708',
      decimals: 18,
      rpcUrl: RPC_URL.Linea
    },
    Celo: {
      name: 'Celo',
      chainName: isBeta ? 'Celo_Beta' : 'Celo',
      chainId: 127,
      assetKey: isBeta ? '5-151' : '9-703',
      mainAsset: 'CELO',
      nativeId: isBeta ? '0xaef3' : '0xa4ec',
      decimals: 18,
      rpcUrl: RPC_URL.CELO
    },
    ETC: {
      name: 'ETC',
      chainName: isBeta ? 'ETC_Beta' : 'Ethereum Classic Mainnet',
      chainId: 128,
      assetKey: isBeta ? '5-152' : '9-704',
      // mainAsset: isBeta ? 'ETC' : 'METC',
      mainAsset: 'ETC',
      nativeId: isBeta ? '0x3f' : '0x3d',
      decimals: 18,
      rpcUrl: RPC_URL.ETC
    },
    Base: {
      name: 'Base',
      chainName: isBeta ? 'Base_Beta' : 'Base',
      chainId: 129,
      assetKey: isBeta ? '5-153' : '9-705',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0x14a33' : '0x2105',
      decimals: 18,
      rpcUrl: RPC_URL.BASE
    },
    Scroll: {
      name: 'Scroll',
      chainName: isBeta ? 'Scroll_Beta' : 'Scroll',
      chainId: 130,
      assetKey: isBeta ? '5-154' : '9-738',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0x82751' : '0x82750',
      decimals: 18,
      rpcUrl: RPC_URL.Scroll
    },
    Bitgert: {
      name: 'Bitgert',
      chainName: isBeta ? 'Bitgert_Beta' : 'Bitgert',
      chainId: 131,
      assetKey: isBeta ? '5-159' : '9-739',
      mainAsset: 'BRISE',
      nativeId: isBeta ? '0xfc9c' : '0x7f08',
      decimals: 18,
      rpcUrl: RPC_URL.Bitgert
    },
    Janus: {
      name: 'Janus',
      chainName: isBeta ? 'Janus_Beta' : 'Janus',
      chainId: 132,
      assetKey: isBeta ? '5-165' : '',
      mainAsset: 'JNS',
      nativeId: isBeta ? '0x105ac' : '',
      decimals: 18,
      rpcUrl: RPC_URL.Janus
    },
    Manta: {
      name: 'Manta',
      chainName: isBeta ? 'Manta_Beta' : 'Manta',
      chainId: 133,
      assetKey: isBeta ? '5-166' : '9-745',
      mainAsset: 'ETH',
      nativeId: isBeta ? '0x34816d' : '0xa9',
      decimals: 18,
      rpcUrl: RPC_URL.Manta
    },
    X1: {
      name: 'X1',
      chainName: isBeta ? 'X1_Beta' : 'X1',
      chainId: 134,
      assetKey: isBeta ? '5-170' : '',
      mainAsset: 'OKB',
      nativeId: isBeta ? '0xc3' : '',
      decimals: 18,
      rpcUrl: RPC_URL.X1
    },
    Zeta: {
      name: 'Zeta',
      chainName: isBeta ? 'Zeta_Beta' : 'Zeta',
      chainId: 135,
      assetKey: isBeta ? '5-172' : '',
      mainAsset: 'ZETA',
      nativeId: isBeta ? '0x1b59' : '0x1b58',
      decimals: 18,
      rpcUrl: RPC_URL.Zeta
    },
    NULS: {
      name: 'NULS',
      chainName: 'NULS',
      chainId: isBeta ? 2 : 1,
      assetKey: isBeta ? '2-1' : '1-1',
      mainAsset: 'NULS',
      nativeId: '0x-1'
    },
    NERVE: {
      name: 'NERVE',
      chainName: 'NERVE',
      chainId: isBeta ? 5 : 9,
      assetKey: isBeta ? '5-1' : '9-1',
      mainAsset: 'NVT',
      nativeId: '0x-2'
    }
  };
  if (isBeta) {
    delete _networkInfo.ETHW;
  } else {
    delete _networkInfo.Janus;
    delete _networkInfo.X1;
  }
  return _networkInfo;
}

export function getHetergenousChainInfo(chainId) {
  const config = getHetergenousChainConfig();
  const chain = Object.values(config).find(v => v.chainId === chainId);
  return chain;
}
