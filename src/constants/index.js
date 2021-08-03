export const FACTORY_ADDRESS = '0xefa94DE7a4656D787667C749f7E1223D71E9FD88' // new factory

export const WAVAX_ADDRESS = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'

export const BUNDLE_ID = '1'

export const timeframeOptions = {
  WEEK: '1 week',
  MONTH: '1 month',
  // THREE_MONTHS: '3 months',
  // YEAR: '1 year',
  ALL_TIME: 'All time',
}

// token list urls to fetch tokens from - use for warnings on tokens and pairs
export const SUPPORTED_LIST_URLS__NO_ENS = [
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/aeb.tokenlist.json',
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/ab.tokenlist.json',
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/top15.tokenlist.json',
]

// hide from overview list
export const OVERVIEW_TOKEN_BLACKLIST = [
  '0xa47a05ed74f80fa31621612887d26df40bcf0ca9', // Das Coin (DAS)
  '0x97b99b4009041e948337ebca7e6ae52f9f6e633c', // Connor Coin (CON)
]

// pair blacklist
export const PAIR_BLACKLIST = []

/**
 * For tokens that cause errors on fee calculations
 */
export const FEE_WARNING_TOKENS = []
