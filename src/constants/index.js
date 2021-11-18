export const FACTORY_ADDRESS = '0xefa94DE7a4656D787667C749f7E1223D71E9FD88' // new factory

export const WAVAX_ADDRESS = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
export const PNG_ADDRESS = '0x60781C2586D68229fde47564546784ab3fACA982'

export const BUNDLE_ID = '1'

export const SWAP_FEE = 0.003
export const SWAP_FEE_TO_LP = 0.0025

export const timeframeOptions = {
  WEEK: '1 week',
  MONTH: '1 month',
  // THREE_MONTHS: '3 months',
  // YEAR: '1 year',
  ALL_TIME: 'All time',
}

// token list urls to fetch tokens from - use for warnings on tokens and pairs
export const SUPPORTED_LIST_URLS__NO_ENS = [
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/ab.tokenlist.json',
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/aeb.tokenlist.json',
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/defi.tokenlist.json',
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/stablecoin.tokenlist.json',
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/top15.tokenlist.json',
]

// token list urls to fetch migrated tokens from - use for warnings on tokens and pairs
export const MIGRATED_LIST_URLS__NO_ENS = [
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/aeb.tokenlist.json',
]

// hide from overview list
export const OVERVIEW_TOKEN_BLACKLIST = [
  '0xa47a05ed74f80fa31621612887d26df40bcf0ca9', // Das Coin (DAS)
  '0x97b99b4009041e948337ebca7e6ae52f9f6e633c', // Connor Coin (CON)

  // AEB Tokens
  '0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15', // ETH
  '0xde3A24028580884448a5397872046a019649b084', // USDT
  '0x408D4cD0ADb7ceBd1F1A1C33A0Ba2098E1295bAB', // WBTC
  '0xB3fe5374F67D7a22886A0eE082b2E2f9d2651651', // LINK
  '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a', // DAI
  '0xf39f9671906d8630812f9d9863bBEf5D523c84Ab', // UNI
  '0x39cf1BD5f15fb22eC3D9Ff86b0727aFc203427cc', // SUSHI
  '0x8cE2Dee54bB9921a2AE0A63dBb2DF8eD88B91dD9', // AAVE
  '0x99519AcB025a0e0d44c3875A4BbF03af65933627', // YFI
]

// pair blacklist
export const PAIR_BLACKLIST = []

/**
 * For tokens that cause errors on fee calculations
 */
export const FEE_WARNING_TOKENS = []


export const PAIR_CHART_VIEW_OPTIONS  = {
  VOLUME: 'Volume',
  LIQUIDITY: 'Liquidity',
  RATE0: 'Rate 0',
  RATE1: 'Rate 1',
}
