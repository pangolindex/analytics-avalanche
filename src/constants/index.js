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
  'https://raw.githubusercontent.com/pangolindex/tokenlists/main/top15.tokenlist.json'
]

// hide from overview list
export const TOKEN_BLACKLIST = [
  '0xa47a05ed74f80fa31621612887d26df40bcf0ca9',
  '0x97b99b4009041e948337ebca7e6ae52f9f6e633c',
  '0x820ae7bf39792d7ce7befc70b0172f4d267f1938', // JOY
  '0x008e26068b3eb40b443d3ea88c1ff99b789c10f7', // ZERO
  '0xe54eb2c3009fa411bf24fb017f9725b973ce36f0', // 1INCH
  '0xf6f3eea905ac1da6f6dd37d06810c6fcb0ef5183', // zEth
  '0x474bb79c3e8e65dcc6df30f9de68592ed48bbfdb', // zUSDC
]

// pair blacklist - never shown
export const PAIR_BLACKLIST = [,
  '0x27eef94e479cb4774b050530cfc45e4a6ccc7e5f',
  '0xcf341bfcb92f3c8bf4811ea7f2111efaf1d0e237']

export const BLOCKED_WARNINGS = {
  '0xf4eda77f0b455a12f3eb44f8653835f377e36b76':
    'TikTok Inc. has asserted this token is violating its trademarks and therefore is not available.',
}

/**
 * For tokens that cause erros on fee calculations
 */
export const FEE_WARNING_TOKENS = ['0xd46ba6d942050d489dbd938a2c909a5d5039a161']

export const UNTRACKED_COPY = 'Derived USD values may be inaccurate without liquid stablecoin or ETH pairings.'