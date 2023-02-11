export const WNAT_ADDRESS = '0x0000000000000000000000000000000002dfa5b2'
export const WNAT_SYMBOL = 'WHBAR'
export const WNAT_SYMBOL_UNWRAPPED = 'HBAR'
export const SYMBOL_MAX_DISPLAY_LENGTH = 9

export const SWAP_FEE_TO_LP = 0.003

export const PANGOLIN_LINK_APP = 'https://app.pangolin.exchange'
export const SOCIAL_LINK_DISCORD = 'https://discord.com/invite/pangolindex'
export const SOCIAL_LINK_TWITTER = 'https://twitter.com/Pangolin_Hedera'

export const EXPLORER_LINK_BASE = 'https://hashscan.io/mainnet'
export const EXPLORER_NAME = 'HashScan'

export const SUBGRAPH_NAME = 'pangolin'
export const SUBGRAPH_HOST = 'https://hedera-graph.pangolin.network'
export const CHAIN_ID = 295
export const STARTING_BLOCK = 43336946

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

export const PANGOLIN_TOKEN_IMAGE_REPO_BASE = 'https://raw.githubusercontent.com/pangolindex/tokens'

// hide from overview list
export const OVERVIEW_TOKEN_BLACKLIST = []

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
