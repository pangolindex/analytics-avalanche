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
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/pangolin.tokenlist.json',
]

// hide from overview list
export const OVERVIEW_TOKEN_BLACKLIST = [
  '0xa47a05ed74f80fa31621612887d26df40bcf0ca9', // Das Coin (DAS)
  '0x97b99b4009041e948337ebca7e6ae52f9f6e633c', // Connor Coin (CON)
  '0x2bc8834bc217f15df898fcab896e2b3e3673faf6', // SXI - Deprecated for SWAPXI

  // AEB Tokens
  '0xf20d962a6c8f70c731bd838a3a388d7d48fa6e15', // ETH
  '0xde3a24028580884448a5397872046a019649b084', // USDT
  '0x408d4cd0adb7cebd1f1a1c33a0ba2098e1295bab', // WBTC
  '0xb3fe5374f67d7a22886a0ee082b2e2f9d2651651', // LINK
  '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a', // DAI
  '0xf39f9671906d8630812f9d9863bbef5d523c84ab', // UNI
  '0x39cf1bd5f15fb22ec3d9ff86b0727afc203427cc', // SUSHI
  '0x8ce2dee54bb9921a2ae0a63dbb2df8ed88b91dd9', // AAVE
  '0x99519acb025a0e0d44c3875a4bbf03af65933627', // YFI
]

export const AEB_TOKEN_ADDRESSES = [
  '0xf20d962a6c8f70c731bd838a3a388d7d48fa6e15',
  '0xe54eb2c3009fa411bf24fb017f9725b973ce36f0',
  '0x8ce2dee54bb9921a2ae0a63dbb2df8ed88b91dd9',
  '0x6b329326e0f6b95b93b52229b213334278d6f277',
  '0xaeb044650278731ef3dc244692ab9f64c78ffaea',
  '0xb3fe5374f67d7a22886a0ee082b2e2f9d2651651',
  '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a',
  '0x46c54b16af7747067f412c78ebadae203a26ada0',
  '0xe1463e8991c8a62e64b77b5fb6b22f190344c2a9',
  '0x39cf1bd5f15fb22ec3d9ff86b0727afc203427cc',
  '0x68e44c4619db40ae1a0725e77c02587bc8fbd1c9',
  '0xde3a24028580884448a5397872046a019649b084',
  '0x390ba0fb0bd3aa2a5484001606329701148074e6',
  '0xc84d7bff2555955b44bdf6a307180810412d751b',
  '0xf39f9671906d8630812f9d9863bbef5d523c84ab',
  '0x408d4cd0adb7cebd1f1a1c33a0ba2098e1295bab',
  '0x99519acb025a0e0d44c3875a4bbf03af65933627',
]

// pair blacklist
export const PAIR_BLACKLIST = []

/**
 * For tokens that cause errors on fee calculations
 */
export const FEE_WARNING_TOKENS = []

export const PAIR_CHART_VIEW_OPTIONS = {
  VOLUME: 'Volume',
  LIQUIDITY: 'Liquidity',
  RATE0: 'Rate 0',
  RATE1: 'Rate 1',
}
