import axios from 'axios';
import { getChainInfo } from '../utils/utils';

export const ps_mainnet = 'https://public.nerve.network';
export const ps_testnet = 'https://beta.public.nerve.network';

export const swap_mainnet = 'https://api.swap.nerve.network';
export const swap_testnet = 'https://beta.api.swap.nerve.network';

let ps_baseUrl = '';
let swap_baseUrl = '';
export function setBaseUrl(baseURL, isBeta) {
  const defaultUrl = isBeta ? ps_testnet : ps_mainnet;
  ps_baseUrl = baseURL || defaultUrl;
  swap_baseUrl = isBeta ? swap_testnet : swap_mainnet;
  // axios.defaults.baseURL = baseURL || defaultUrl;
}

export function post(method, data = [], withoutChainId = false) {
  return new Promise((resolve, reject) => {
    const chainId = getChainInfo().NERVE.chainId;
    if (!withoutChainId) {
      data.unshift(chainId);
    }
    const params = {
      jsonrpc: '2.0',
      method,
      params: data,
      id: Math.floor(Math.random() * 1000)
    };
    axios.post(ps_baseUrl, params).then(
      response => {
        resolve(response.data);
      },
      err => {
        reject(err);
      }
    );
  });
}

export function sPost(path, params = {}) {
  const url = swap_baseUrl + path;
  return new Promise((resolve, reject) => {
    axios.post(url, params).then(
      res => resolve(res.data),
      err => reject(err)
    );
  });
}

export function callOKLinkApi(method, api, params) {
  const url = 'https://api.v2.nabox.io/nabox-api/ok/link/api/call'
  return new Promise((resolve, reject) => {
    // const params = {
    //   "method": "get",
    //   "api": "/api/v5/explorer/address/utxo",
    //   "params": {
    //     "chainShortName": "BCH",
    //     "address": "qpat0x74cqp4fe757dr8fxkh6tql3whqxyxrmshfn6",
    //     "page": 1,
    //     "limit": 100
    //   }
    // }
    const data = {
      method,
      api,
      params
    }
    axios({url, method: 'post', data }).then(
      response => {
        resolve(response.data);
      },
      err => {
        reject(err);
      }
    );
  });
}
