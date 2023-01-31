/*
 * Mapping between address and CoinGecko coin id
 * Using CoinGecko API: https://api.coingecko.com/api/v3/coins/list
 */
const UNFORMATTED_COIN_ID_MAP = {
  '0x0000000000000000000000000000000002dfa5b2': 'hedera-hashgraph', // WHBAR
}

// Ensure all address keys are lowercase
export const COIN_ID_MAP = Object.entries(UNFORMATTED_COIN_ID_MAP).reduce(
  (map, [address, id]) => ({ ...map, [address.toLowerCase()]: id }),
  {}
)
