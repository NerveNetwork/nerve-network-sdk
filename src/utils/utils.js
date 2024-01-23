import { BigNumber } from 'bignumber.js';

export const Power = arg => {
  const newPower = new BigNumber(10);
  return newPower.pow(arg);
};

export const Plus = (nu, arg) => {
  const newPlus = new BigNumber(nu);
  return newPlus.plus(arg);
};

export const Minus = (nu, arg) => {
  const newMinus = new BigNumber(nu);
  return newMinus.minus(arg);
};

export const Times = (nu, arg) => {
  const newTimes = new BigNumber(nu);
  return newTimes.times(arg);
};

export const Division = (nu, arg) => {
  const newDiv = new BigNumber(nu);
  return newDiv.div(arg);
};

export const timesDecimals = (nu, decimals = 8) => {
  return new BigNumber(Times(nu, Power(decimals).toString()))
    .toFormat()
    .replace(/[,]/g, '');
};

export const divisionDecimals = (nu, decimals = 8) => {
  return new BigNumber(Division(nu, Power(decimals).toString()))
    .toFormat()
    .replace(/[,]/g, '');
};

export function fixNumber(str, fix = 8) {
  str = '' + str;
  const int = str.split('.')[0];
  let float = str.split('.')[1];
  if (!float || !Number(float)) return int;
  float = float.slice(0, fix).replace(/(0+)$/g, '');
  return Number(float) ? int + '.' + float : int;
}

export let isBeta = false;

export function setIsBeta(flag) {
  isBeta = flag;
}

export function getChainInfo() {
  return {
    NERVE: {
      chainId: isBeta ? 5 : 9,
      assetId: 1,
      prefix: isBeta ? 'TNVT' : 'NERVE'
    },
    NULS: {
      chainId: isBeta ? 2 : 1,
      assetId: 1,
      prefix: isBeta ? 'tNULS' : 'NULS'
    }
  };
}

export function htmlEncode(str) {
  let s = '';
  if (str.length === 0) {
    return '';
  }
  s = str.replace(/&/g, '&amp;');
  s = s.replace(/</g, '&lt;');
  s = s.replace(/>/g, '&gt;');
  s = s.replace(/ /g, '&nbsp;');
  s = s.replace(/\\'/g, '&#39;');
  s = s.replace(/\\"/g, '&quot;');
  return s;
}
