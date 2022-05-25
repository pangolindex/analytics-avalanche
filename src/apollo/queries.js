import gql from 'graphql-tag'
import { FACTORY_ADDRESS, BUNDLE_ID } from '../constants'

export const SUBGRAPH_HEALTH = gql`
  query health {
    indexingStatusForCurrentVersion(subgraphName: "pangolindex/exchange-staging") {
      synced
      health
      chains {
        chainHeadBlock {
          number
        }
        latestBlock {
          number
        }
      }
    }
  }
`

export const GET_BLOCK = gql`
  query blocks($timestampFrom: Int!, $timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
    ) {
      id
      number
      timestamp
    }
  }
`

export const GET_BLOCK_BEFORE = gql`
  query blocks($timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: desc
      where: { timestamp_lt: $timestampTo }
    ) {
      number
    }
  }
`

export const GET_BLOCK_AFTER = gql`
  query blocks($timestampFrom: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: desc
      where: { timestamp_gt: $timestampFrom }
    ) {
      number
    }
  }
`

export const GET_BLOCKS = (timestamps) => {
  let queryString = 'query blocks {'
  queryString += timestamps.map((timestamp) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp + 60 * 60 * 24 * 7
      } }) {
      number
    }`
  })
  queryString += '}'
  return gql(queryString)
}

export const PRICES_BY_BLOCK = (tokenAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number} }) { 
        derivedUSD
      }
    `
  )
  queryString += '}'
  return gql(queryString)
}

export const TOP_LPS_PER_PAIRS = gql`
  query lps($pair: Bytes!) {
    liquidityPositions(where: { pair: $pair }, orderBy: liquidityTokenBalance, orderDirection: desc, first: 100) {
      user {
        id
      }
      pair {
        id
      }
      liquidityTokenBalance
    }
  }
`

export const HOURLY_PAIR_RATES = (pairAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}: pair(id:"${pairAddress}", block: { number: ${block.number} }) { 
        token0Price
        token1Price
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}

export const SHARE_VALUE = (pairAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}:pair(id:"${pairAddress}", block: { number: ${block.number} }) { 
        reserve0
        reserve1
        reserveUSD
        totalSupply 
        token0{
          derivedUSD
        }
        token1{
          derivedUSD
        }
      }
    `
  )
  queryString += '}'
  return gql(queryString)
}

export const ETH_PRICE = (block) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id: ${BUNDLE_ID} } block: {number: ${block}}) {
        id
        ethPrice
      }
    }
  `
    : ` query bundles {
      bundles(where: { id: ${BUNDLE_ID} }) {
        id
        ethPrice
      }
    }
  `
  return gql(queryString)
}

export const USER = (block, account) => {
  const queryString = `
    query users {
      user(id: "${account}", block: {number: ${block}}) {
        liquidityPositions
      }
    }
`
  return gql(queryString)
}

export const USER_MINTS_BUNRS_PER_PAIR = gql`
  query events($user: Bytes!, $pair: Bytes!) {
    mints(where: { to: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
    burns(where: { sender: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`

export const FIRST_SNAPSHOT = gql`
  query snapshots($user: Bytes!) {
    liquidityPositionSnapshots(first: 1, where: { user: $user }, orderBy: timestamp, orderDirection: asc) {
      timestamp
    }
  }
`

export const USER_HISTORY = gql`
  query snapshots($user: Bytes!, $now: Int!, $pointer: Int!) {
    liquidityPositionSnapshots(
      first: 1000
      where: { user: $user, timestamp_lte: $now, timestamp_gt: $pointer }
      orderBy: timestamp
      orderDirection: asc
    ) {
      timestamp
      reserveUSD
      liquidityTokenBalance
      liquidityTokenTotalSupply
      reserve0
      reserve1
      token0PriceUSD
      token1PriceUSD
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`

export const USER_POSITIONS = gql`
  query liquidityPositions($user: Bytes!, $pointer: String) {
    liquidityPositions(
      first: 1000
      where: {
        user: $user
        id_gt: $pointer
      }
      orderBy: id
      orderDirection: asc
    ) {
      id
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
          derivedUSD
        }
        token1 {
          id
          symbol
          derivedETH
          derivedUSD
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`

export const USER_TRANSACTIONS = gql`
  query transactions($user: Bytes!) {
    mints(orderBy: timestamp, orderDirection: desc, where: { to: $user }) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burns(orderBy: timestamp, orderDirection: desc, where: { sender: $user }) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      sender
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(orderBy: timestamp, orderDirection: desc, where: { to: $user }) {
      id
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
    }
  }
`

export const PAIR_CHART = gql`
  query pairDayDatas($pairAddress: Bytes!, $pointer: Int!) {
    pairDayDatas(
      first: 1000
      orderBy: date
      orderDirection: asc
      where: { pairAddress: $pairAddress, date_gt: $pointer }
    ) {
      id
      date
      dailyVolumeUSD
      reserveUSD
    }
  }
`

export const PAIR_DAY_DATA = gql`
  query pairDayDatas($pairAddress: Bytes!, $date: Int!) {
    pairDayDatas(first: 1, orderBy: date, orderDirection: desc, where: { pairAddress: $pairAddress, date_lt: $date }) {
      id
      date
      dailyVolumeUSD
      totalSupply
      reserveUSD
    }
  }
`

export const PAIR_DAY_DATA_BULK = gql`
  query pairDayDatas($pointer: Int!, $pairs: [Bytes]!) {
    pairDayDatas(
      first: 1000
      orderBy: date
      orderDirection: asc
      where: { pairAddress_in: $pairs, date_gt: $pointer }
    ) {
      id
      pairAddress
      date
      dailyVolumeUSD
      totalSupply
      reserveUSD
    }
  }
`

export const GLOBAL_CHART = gql`
  query pangolinDayDatas($pointer: Int!) {
    pangolinDayDatas(first: 1000, where: { date_gt: $pointer }, orderBy: date, orderDirection: asc) {
      id
      date
      totalVolumeUSD
      dailyVolumeUSD
      totalLiquidityUSD
      totalLiquidityETH
    }
  }
`

export const GLOBAL_DATA = (block) => {
  const queryString = ` query pangolinFactories {
      pangolinFactories(
       ${block ? `block: { number: ${block}}` : ``} 
       where: { id: "${FACTORY_ADDRESS}" }) {
        id
        totalVolumeUSD
        totalVolumeETH
        untrackedVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
        txCount
        pairCount
      }
    }`
  return gql(queryString)
}

export const GLOBAL_TXNS = gql`
  query transactions {
    transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
      mints(orderBy: timestamp, orderDirection: desc) {
        transaction {
          id
          timestamp
        }
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        to
        liquidity
        amount0
        amount1
        amountUSD
      }
      burns(orderBy: timestamp, orderDirection: desc) {
        transaction {
          id
          timestamp
        }
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        sender
        liquidity
        amount0
        amount1
        amountUSD
      }
      swaps(orderBy: timestamp, orderDirection: desc) {
        transaction {
          id
          timestamp
        }
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        amount0In
        amount0Out
        amount1In
        amount1Out
        amountUSD
        to
      }
    }
  }
`

export const ALL_TOKENS = gql`
  query tokens($skip: Int!) {
    tokens(first: 500, skip: $skip, orderBy: totalLiquidity) {
      id
      name
      symbol
      totalLiquidity
    }
  }
`

export const TOKEN_SEARCH = gql`
  query tokens($value: String, $id: String) {
    asSymbol: tokens(where: { symbol_contains_nocase: $value }, orderBy: totalLiquidity, orderDirection: desc) {
      id
      symbol
      name
      totalLiquidity
    }
    asName: tokens(where: { name_contains_nocase: $value }, orderBy: totalLiquidity, orderDirection: desc) {
      id
      symbol
      name
      totalLiquidity
    }
    asAddress: tokens(where: { id: $id }, orderBy: totalLiquidity, orderDirection: desc) {
      id
      symbol
      name
      totalLiquidity
    }
  }
`

export const PAIR_SEARCH = gql`
  query pairs($tokens: [Bytes]!, $id: String) {
    as0: pairs(where: { token0_in: $tokens }) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    as1: pairs(where: { token1_in: $tokens }) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
    asAddress: pairs(where: { id: $id }) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`

export const ALL_PAIRS = gql`
  query pairs($skip: Int!) {
    pairs(first: 500, skip: $skip, orderBy: trackedReserveUSD, orderDirection: desc) {
      id
      token0 {
        id
        symbol
        name
      }
      token1 {
        id
        symbol
        name
      }
    }
  }
`

export const PAIRS_CURRENT = gql`
  query pairs {
    pairs(first: 200, orderBy: trackedReserveUSD, orderDirection: desc) {
      id
    }
  }
`

export const PAIR_DATA = (pairAddress, block) => {
  const queryString = `
    query pairs {
      pairs(${block ? `block: {number: ${block}}` : ``} where: { id: "${pairAddress}"} ) {
        id
        txCount
        token0 {
          id
          symbol
          name
          totalLiquidity
          derivedETH
          derivedUSD
        }
        token1 {
          id
          symbol
          name
          totalLiquidity
          derivedETH
          derivedUSD
        }
        reserve0
        reserve1
        reserveUSD
        totalSupply
        trackedReserveUSD
        reserveETH
        volumeUSD
        untrackedVolumeUSD
        token0Price
        token1Price
        createdAtTimestamp
      }
    }`
  return gql(queryString)
}

export const MINING_POSITIONS = (account) => {
  const queryString = `
    query users {
      user(id: "${account}") {
        miningPosition {
          id
          user {
            id
          }
          miningPool {
              pair {
                id
                token0
                token1
              }
          }
          balance
        }
      }
    }
`
  return gql(queryString)
}

export const PAIRS_BULK = gql`
  query pairs($allPairs: [Bytes]!) {
    pairs(where: { id_in: $allPairs }, orderBy: trackedReserveUSD, orderDirection: desc) {
      id
      token0 {
        id
        symbol
        name
        derivedUSD
      }
      token1 {
        id
        symbol
        name
        derivedUSD
      }
      reserveUSD
      totalSupply
      trackedReserveUSD
      reserveETH
      volumeUSD
      untrackedVolumeUSD
      token0Price
      token1Price
      createdAtTimestamp
      createdAtBlockNumber
    }
  }
`

export const PAIRS_HISTORICAL_BULK = (block, pairs) => {
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`)
  })
  pairsString += ']'
  let queryString = `
  query pairs {
    pairs(first: 200, where: {id_in: ${pairsString}}, block: {number: ${block}}, orderBy: trackedReserveUSD, orderDirection: desc) {
      id
      reserveUSD
      trackedReserveUSD
      volumeUSD
      untrackedVolumeUSD
    }
  }
  `
  return gql(queryString)
}

export const TOKEN_CHART = gql`
  query tokenDayDatas($tokenAddr: String!, $pointer: Int!) {
    tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: $tokenAddr, date_gt: $pointer }) {
      date
      priceUSD
      totalLiquidityUSD
      dailyVolumeUSD
    }
  }
`

export const TOKENS_CURRENT = gql`
  query tokens {
    tokens(first: 200, orderBy: tradeVolumeUSD, orderDirection: desc) {
      id
      name
      symbol
      decimals
      derivedETH
      derivedUSD
      tradeVolumeUSD
      untrackedVolumeUSD
      totalLiquidity
      txCount
    }
  }
`

export const TOKENS_DYNAMIC = (block) => {
  const queryString = `
    query tokens {
      tokens(block: {number: ${block}} first: 200, orderBy: tradeVolumeUSD, orderDirection: desc) {
        id
        name
        symbol
        decimals
        derivedETH
        derivedUSD
        tradeVolumeUSD
        untrackedVolumeUSD
        totalLiquidity
        txCount
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_DATA = (tokenAddress, block) => {
  const queryString = `
    query tokens {
      tokens(${block ? `block : {number: ${block}}` : ``} where: {id:"${tokenAddress}"}) {
        id
        name
        symbol
        decimals
        derivedETH
        derivedUSD
        tradeVolumeUSD
        untrackedVolumeUSD
        totalLiquidity
        txCount
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_PAIRS_DATA = (tokenAddress) => {
  const queryString = `
    query tokens {
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
    }
  `
  return gql(queryString)
}

export const FILTERED_TRANSACTIONS = gql`
  query($allPairs: [Bytes]!) {
    mints(first: 20, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burns(first: 20, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      sender
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(first: 30, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      id
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
    }
  }
`
