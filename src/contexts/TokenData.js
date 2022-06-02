import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'

import { client } from '../apollo/client'
import {
  TOKEN_DATA,
  FILTERED_TRANSACTIONS,
  TOKEN_CHART,
  TOKENS_CURRENT,
  TOKENS_DYNAMIC,
  PRICES_BY_BLOCK,
  TOKEN_PAIRS_DATA,
} from '../apollo/queries'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import _ from 'lodash'
import CoinGecko from 'coingecko-api'

import {
  get2DayPercentChange,
  getPercentChange,
  getBlockFromTimestamp,
  isAddress,
  getBlocksFromTimestamps,
  splitQuery,
  getMostRecentBlockSinceTimestamp,
  crawlSingleQuery,
} from '../utils'
import { timeframeOptions } from '../constants'
import { useLatestBlocks } from './Application'
import { updateNameData } from '../utils/data'
import { COIN_ID_MAP } from '../constants/coingecko'

const UPDATE = 'UPDATE'
const UPDATE_TOKEN_TXNS = 'UPDATE_TOKEN_TXNS'
const UPDATE_CHART_DATA = 'UPDATE_CHART_DATA'
const UPDATE_PRICE_DATA = 'UPDATE_PRICE_DATA'
const UPDATE_TOP_TOKENS = ' UPDATE_TOP_TOKENS'
const UPDATE_ALL_PAIRS = 'UPDATE_ALL_PAIRS'

const TOKEN_PAIRS_KEY = 'TOKEN_PAIRS_KEY'

dayjs.extend(utc)

const TokenDataContext = createContext()
const CoinGeckoClient = new CoinGecko()

function useTokenDataContext() {
  return useContext(TokenDataContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { tokenAddress, data } = payload
      return {
        ...state,
        [tokenAddress]: {
          ...state?.[tokenAddress],
          ...data,
        },
      }
    }
    case UPDATE_TOP_TOKENS: {
      const { topTokens } = payload
      let added = {}
      topTokens &&
        topTokens.map((token) => {
          return (added[token.id] = token)
        })
      return {
        ...state,
        ...added,
      }
    }

    case UPDATE_TOKEN_TXNS: {
      const { address, transactions } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          txns: transactions,
        },
      }
    }
    case UPDATE_CHART_DATA: {
      const { address, chartData } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          chartData,
        },
      }
    }

    case UPDATE_PRICE_DATA: {
      const { address, data, timeWindow, interval } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          [timeWindow]: {
            ...state?.[address]?.[timeWindow],
            [interval]: data,
          },
        },
      }
    }

    case UPDATE_ALL_PAIRS: {
      const { address, allPairs } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          [TOKEN_PAIRS_KEY]: allPairs,
        },
      }
    }
    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})
  const update = useCallback((tokenAddress, data) => {
    dispatch({
      type: UPDATE,
      payload: {
        tokenAddress,
        data,
      },
    })
  }, [])

  const updateTopTokens = useCallback((topTokens) => {
    dispatch({
      type: UPDATE_TOP_TOKENS,
      payload: {
        topTokens,
      },
    })
  }, [])

  const updateTokenTxns = useCallback((address, transactions) => {
    dispatch({
      type: UPDATE_TOKEN_TXNS,
      payload: { address, transactions },
    })
  }, [])

  const updateChartData = useCallback((address, chartData) => {
    dispatch({
      type: UPDATE_CHART_DATA,
      payload: { address, chartData },
    })
  }, [])

  const updateAllPairs = useCallback((address, allPairs) => {
    dispatch({
      type: UPDATE_ALL_PAIRS,
      payload: { address, allPairs },
    })
  }, [])

  const updatePriceData = useCallback((address, data, timeWindow, interval) => {
    dispatch({
      type: UPDATE_PRICE_DATA,
      payload: { address, data, timeWindow, interval },
    })
  }, [])

  return (
    <TokenDataContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update,
            updateTokenTxns,
            updateChartData,
            updateTopTokens,
            updateAllPairs,
            updatePriceData,
          },
        ],
        [state, update, updateTokenTxns, updateChartData, updateTopTokens, updateAllPairs, updatePriceData]
      )}
    >
      {children}
    </TokenDataContext.Provider>
  )
}

const getTopTokens = async () => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(2, 'day').unix()

  let [oneDayBlock, twoDayBlock] = await Promise.all([
    getBlockFromTimestamp(utcOneDayBack),
    getBlockFromTimestamp(utcTwoDaysBack),
  ])

  if (oneDayBlock === undefined) {
    oneDayBlock = await getMostRecentBlockSinceTimestamp(utcOneDayBack)
  }
  if (twoDayBlock === undefined) {
    twoDayBlock = await getMostRecentBlockSinceTimestamp(utcTwoDaysBack)
  }

  try {
    const currentQuery = client.query({
      query: TOKENS_CURRENT,
      fetchPolicy: 'cache-first',
    })

    const oneDayResultQuery = client.query({
      query: TOKENS_DYNAMIC(oneDayBlock),
      fetchPolicy: 'cache-first',
    })

    const twoDayResultQuery = client.query({
      query: TOKENS_DYNAMIC(twoDayBlock),
      fetchPolicy: 'cache-first',
    })

    const [current, oneDayResult, twoDayResult] = await Promise.all([
      currentQuery,
      oneDayResultQuery,
      twoDayResultQuery,
    ])

    let oneDayData = oneDayResult?.data?.tokens.reduce((obj, cur, i) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    let twoDayData = twoDayResult?.data?.tokens.reduce((obj, cur, i) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    let bulkResults = await Promise.all(
      current &&
        oneDayData &&
        twoDayData &&
        current?.data?.tokens.map(async (token) => {
          let data = token

          // let liquidityDataThisToken = liquidityData?.[token.id]
          let oneDayHistory = oneDayData?.[token.id]
          let twoDayHistory = twoDayData?.[token.id]

          // catch the case where token wasnt in top list in previous days
          if (!oneDayHistory) {
            let oneDayResult = await client.query({
              query: TOKEN_DATA(token.id, oneDayBlock),
              fetchPolicy: 'cache-first',
            })
            oneDayHistory = oneDayResult.data.tokens[0]
          }
          if (!twoDayHistory) {
            let twoDayResult = await client.query({
              query: TOKEN_DATA(token.id, twoDayBlock),
              fetchPolicy: 'cache-first',
            })
            twoDayHistory = twoDayResult.data.tokens[0]
          }

          // calculate percentage changes and daily changes
          const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
            data?.tradeVolumeUSD,
            oneDayHistory?.tradeVolumeUSD ?? 0,
            twoDayHistory?.tradeVolumeUSD ?? 0
          )
          const [oneDayTxns, txnChange] = get2DayPercentChange(
            data?.txCount,
            oneDayHistory?.txCount ?? 0,
            twoDayHistory?.txCount ?? 0
          )

          const currentLiquidityUSD = data?.totalLiquidity * data?.derivedUSD
          const oldLiquidityUSD = oneDayHistory?.totalLiquidity * oneDayHistory?.derivedUSD

          // percent changes
          const priceChangeUSD = getPercentChange(data?.derivedUSD, oneDayHistory?.derivedUSD ?? 0)

          // set data
          data.priceUSD = data?.derivedUSD
          data.totalLiquidityUSD = currentLiquidityUSD
          data.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD)
          data.volumeChangeUSD = volumeChangeUSD
          data.priceChangeUSD = priceChangeUSD
          data.liquidityChangeUSD = getPercentChange(currentLiquidityUSD ?? 0, oldLiquidityUSD ?? 0)
          data.oneDayTxns = oneDayTxns
          data.txnChange = txnChange

          // new tokens
          if (!oneDayHistory && data) {
            data.oneDayVolumeUSD = data.tradeVolumeUSD
            data.oneDayTxns = data.txCount
          }

          // update name data for
          updateNameData({
            token0: data,
          })

          return data
        })
    )

    return bulkResults

    // calculate percentage changes and daily changes
  } catch (e) {
    console.log(e)
  }
}

const getTokenData = async (address) => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  let twoDayBlock = await getBlockFromTimestamp(utcTwoDaysBack)

  // initialize data arrays
  let data = {}
  let oneDayData = {}
  let twoDayData = {}

  try {
    const resultQuery = client.query({
      query: TOKEN_DATA(address),
      fetchPolicy: 'cache-first',
    })

    const oneDayResultQuery = client.query({
      query: TOKEN_DATA(address, oneDayBlock),
      fetchPolicy: 'cache-first',
    })

    const twoDayResultQuery = client.query({
      query: TOKEN_DATA(address, twoDayBlock),
      fetchPolicy: 'cache-first',
    })

    const [result, oneDayResult, twoDayResult] = await Promise.all([resultQuery, oneDayResultQuery, twoDayResultQuery])

    data = result?.data?.tokens?.[0]
    oneDayData = oneDayResult.data.tokens[0]
    twoDayData = twoDayResult.data.tokens[0]

    // catch the case where token wasnt in top list in previous days
    if (!oneDayData) {
      let oneDayResult = await client.query({
        query: TOKEN_DATA(address, oneDayBlock),
        fetchPolicy: 'cache-first',
      })
      oneDayData = oneDayResult.data.tokens[0]
    }
    if (!twoDayData) {
      let twoDayResult = await client.query({
        query: TOKEN_DATA(address, twoDayBlock),
        fetchPolicy: 'cache-first',
      })
      twoDayData = twoDayResult.data.tokens[0]
    }

    // calculate percentage changes and daily changes
    const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
      data?.tradeVolumeUSD,
      oneDayData?.tradeVolumeUSD ?? 0,
      twoDayData?.tradeVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
      data?.untrackedVolumeUSD,
      oneDayData?.untrackedVolumeUSD ?? 0,
      twoDayData?.untrackedVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayTxns, txnChange] = get2DayPercentChange(
      data?.txCount,
      oneDayData?.txCount ?? 0,
      twoDayData?.txCount ?? 0
    )

    const priceChangeUSD = getPercentChange(data?.derivedUSD, parseFloat(oneDayData?.derivedUSD ?? 0))

    const currentLiquidityUSD = data?.totalLiquidity * data?.derivedUSD
    const oldLiquidityUSD = oneDayData?.totalLiquidity * oneDayData?.derivedUSD

    // set data
    data.priceUSD = data?.derivedUSD
    data.totalLiquidityUSD = currentLiquidityUSD
    data.oneDayVolumeUSD = oneDayVolumeUSD
    data.volumeChangeUSD = volumeChangeUSD
    data.priceChangeUSD = priceChangeUSD
    data.oneDayVolumeUT = oneDayVolumeUT
    data.volumeChangeUT = volumeChangeUT
    data.liquidityChangeUSD = getPercentChange(currentLiquidityUSD ?? 0, oldLiquidityUSD ?? 0)
    data.oneDayTxns = oneDayTxns
    data.txnChange = txnChange

    // new tokens
    if (!oneDayData && data) {
      data.oneDayVolumeUSD = data.tradeVolumeUSD
      data.oneDayTxns = data.txCount
    }

    // update name data for
    updateNameData({
      token0: data,
    })
  } catch (e) {
    console.log(e)
  }
  return data
}

const getTokenTransactions = async (allPairsFormatted) => {
  const transactions = {}
  try {
    let result = await client.query({
      query: FILTERED_TRANSACTIONS,
      variables: {
        allPairs: allPairsFormatted,
      },
      fetchPolicy: 'cache-first',
    })
    transactions.mints = result.data.mints
    transactions.burns = result.data.burns
    transactions.swaps = result.data.swaps
  } catch (e) {
    console.log(e)
  }
  return transactions
}

const getTokenPairs = async (tokenAddress) => {
  try {
    // fetch all current and historical data
    let result = await client.query({
      query: TOKEN_PAIRS_DATA(tokenAddress),
      fetchPolicy: 'cache-first',
    })
    return result.data?.['pairs0'].concat(result.data?.['pairs1'])
  } catch (e) {
    console.log(e)
  }
}

export const getIntervalTokenData = async (
  tokenAddress,
  startTime,
  to = dayjs.utc().unix(),
  interval = 3600 * 24,
  latestBlock
) => {
  const utcEndTime = to
  let time = startTime

  // create an array of hour start times until we reach current hour
  // buffer by half hour to catch case where graph isnt synced to latest block

  const timestamps = []
  while (time < utcEndTime) {
    timestamps.push(time)
    time += interval
  }

  // backout if invalid timestamp format
  if (timestamps.length === 0) {
    return []
  }

  // once you have all the timestamps, get the blocks for each timestamp in a bulk query
  let blocks
  try {
    blocks = await getBlocksFromTimestamps(timestamps, 100)

    // catch failing case
    if (!blocks || blocks.length === 0) {
      return []
    }

    if (latestBlock) {
      blocks = blocks.filter((b) => {
        return parseFloat(b.number) <= parseFloat(latestBlock)
      })
    }

    let result = await splitQuery(PRICES_BY_BLOCK, client, [tokenAddress], blocks, 100)

    // format token ETH price results
    let values = []
    for (let row in result) {
      let timestamp = row.split('t')[1]
      if (!timestamp) continue

      const priceUSD = parseFloat(result[`t${timestamp}`]?.derivedUSD)

      values.push({
        timestamp,
        priceUSD,
      })
    }

    let formattedHistory = []

    // for each hour, construct the open and close price
    for (let i = 0; i < values.length - 1; i++) {
      formattedHistory.push({
        timestamp: values[i].timestamp,
        open: values[i].priceUSD,
        close: values[i + 1].priceUSD,
      })
    }

    return formattedHistory
  } catch (e) {
    console.log(e)
    console.log('error fetching blocks')
    return []
  }
}

const getTokenChartData = async (tokenAddress) => {
  let data = []
  const utcEndTime = dayjs.utc()
  let utcStartTime = utcEndTime.subtract(1, 'year')
  let startTime = utcStartTime.startOf('minute').unix() - 1

  try {
    data = await crawlSingleQuery(
      TOKEN_CHART,
      'tokenDayDatas',
      client,
      { fetchPolicy: 'cache-first' },
      { tokenAddr: tokenAddress },
      startTime,
      'date',
      true
    )

    let dayIndexSet = new Set()
    let dayIndexArray = []
    const oneDay = 24 * 60 * 60
    data.forEach((dayData, i) => {
      // add the day index to the set of days
      dayIndexSet.add((data[i].date / oneDay).toFixed(0))
      dayIndexArray.push(data[i])
      dayData.dailyVolumeUSD = parseFloat(dayData.dailyVolumeUSD)
    })

    // fill in empty days
    let timestamp = data[0] && data[0].date ? data[0].date : startTime
    let latestLiquidityUSD = data[0] && data[0].totalLiquidityUSD
    let latestPriceUSD = data[0] && data[0].priceUSD
    let index = 1
    while (timestamp < utcEndTime.startOf('minute').unix() - oneDay) {
      const nextDay = timestamp + oneDay
      let currentDayIndex = (nextDay / oneDay).toFixed(0)
      if (!dayIndexSet.has(currentDayIndex)) {
        data.push({
          date: nextDay,
          dayString: nextDay,
          dailyVolumeUSD: 0,
          priceUSD: latestPriceUSD,
          totalLiquidityUSD: latestLiquidityUSD,
        })
      } else {
        latestLiquidityUSD = dayIndexArray[index].totalLiquidityUSD
        latestPriceUSD = dayIndexArray[index].priceUSD
        index = index + 1
      }
      timestamp = nextDay
    }
    data = data.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1))
  } catch (e) {
    console.log(e)
  }
  return data
}

export function Updater() {
  const [, { updateTopTokens }] = useTokenDataContext()
  useEffect(() => {
    async function getData() {
      // get top pairs for overview list
      let topTokens = await getTopTokens()
      topTokens && updateTopTokens(topTokens)
    }
    getData()
  }, [updateTopTokens])
  return null
}

export function useTokenData(tokenAddress) {
  const [state, { update }] = useTokenDataContext()
  const tokenData = state?.[tokenAddress]

  useEffect(() => {
    if (!tokenData && isAddress(tokenAddress)) {
      getTokenData(tokenAddress).then((data) => {
        update(tokenAddress, data)
      })
    }
  }, [tokenAddress, tokenData, update])

  return tokenData || {}
}

export function useTokenTransactions(tokenAddress) {
  const [state, { updateTokenTxns }] = useTokenDataContext()
  const tokenTxns = state?.[tokenAddress]?.txns

  const allPairsFormatted =
    state[tokenAddress] &&
    state[tokenAddress].TOKEN_PAIRS_KEY &&
    state[tokenAddress].TOKEN_PAIRS_KEY.map((pair) => {
      return pair.id
    })

  useEffect(() => {
    async function checkForTxns() {
      if (!tokenTxns && allPairsFormatted) {
        let transactions = await getTokenTransactions(allPairsFormatted)
        updateTokenTxns(tokenAddress, transactions)
      }
    }
    checkForTxns()
  }, [tokenTxns, tokenAddress, updateTokenTxns, allPairsFormatted])

  if (tokenTxns) {
    let txCopy = _.cloneDeep(tokenTxns)
    return txCopy
  }

  return tokenTxns || []
}

export function useTokenPairs(tokenAddress) {
  const [state, { updateAllPairs }] = useTokenDataContext()
  const tokenPairs = state?.[tokenAddress]?.[TOKEN_PAIRS_KEY]

  useEffect(() => {
    async function fetchData() {
      let allPairs = await getTokenPairs(tokenAddress)
      updateAllPairs(tokenAddress, allPairs)
    }
    if (!tokenPairs && isAddress(tokenAddress)) {
      fetchData()
    }
  }, [tokenAddress, tokenPairs, updateAllPairs])

  return tokenPairs || []
}

export function useTokenChartData(tokenAddress) {
  const [state, { updateChartData }] = useTokenDataContext()
  const chartData = state?.[tokenAddress]?.chartData
  useEffect(() => {
    async function checkForChartData() {
      if (!chartData) {
        let data = await getTokenChartData(tokenAddress)
        updateChartData(tokenAddress, data)
      }
    }
    checkForChartData()
  }, [chartData, tokenAddress, updateChartData])
  return chartData
}

/**
 * get candlestick data for a token - saves in context based on the window and the
 * interval size
 * @param {*} tokenAddress
 * @param {*} timeWindow // a preset time window from constant - how far back to look
 * @param {*} interval  // the chunk size in seconds - default is 1 hour of 3600s
 */
export function useTokenPriceData(tokenAddress, timeWindow, interval = 3600) {
  const [state, { updatePriceData }] = useTokenDataContext()
  const chartData = state?.[tokenAddress]?.[timeWindow]?.[interval]
  const [latestBlock] = useLatestBlocks()

  useEffect(() => {
    const currentTime = dayjs.utc()
    const windowSize = timeWindow === timeframeOptions.MONTH ? 'month' : 'week'

    // February 8th 2021 - Pangolin Factory is created
    const startTime =
      timeWindow === timeframeOptions.ALL_TIME
        ? dayjs('2021-02-08').startOf('day').unix()
        : currentTime.subtract(1, windowSize).startOf('hour').unix()

    async function fetch() {
      let data = await getIntervalTokenData(tokenAddress, startTime, undefined, interval, latestBlock)

      updatePriceData(tokenAddress, data, timeWindow, interval)
    }
    if (!chartData) {
      fetch()
    }
  }, [chartData, interval, timeWindow, tokenAddress, updatePriceData, latestBlock])

  return chartData
}

export function useAllTokenData() {
  const [state] = useTokenDataContext()
  return state
}

export function useCoinGeckoTokenData(address) {
  const [result, setResult] = useState({})

  useEffect(() => {
    let data = {}

    const getCoinData = async () => {
      try {
        const coinId = COIN_ID_MAP[address.toLowerCase()]

        if (!!coinId) {
          const coin = await CoinGeckoClient.coins.fetch(coinId, {
            tickers: false,
            community_data: false,
            developer_data: false,
            localization: false,
            sparkline: false,
          })
          data.coinId = coinId
          data.homePage = coin?.data?.links?.homepage?.[0]
          data.description = coin?.data?.description.en
          data.chatURL = coin?.data?.links?.chat_url?.[0]
          data.announcementChannel = coin?.data?.links?.announcement_url?.[0]
          data.twitter = coin?.data?.links?.twitter_screen_name
          data.telegram = coin?.data?.links?.telegram_channel_identifier
          data.totalValueLockedUSD = coin?.data?.market_data?.total_value_locked?.usd
          data.allTimeHigh = coin?.data?.market_data?.ath?.usd
          data.allTimeHighChangePercentage = coin?.data?.market_data?.ath_change_percentage.usd
          data.allTimeHighDate = coin?.data?.market_data?.ath_date?.usd
          data.allTimeLow = coin?.data?.market_data?.atl?.usd
          data.allTimeLowChangePercentage = coin?.data?.market_data?.atl_change_percentage.usd
          data.allTimeLowDate = coin?.data?.market_data?.atl_date.usd
          data.fullyDilutedValuation = coin?.data?.market_data?.fully_diluted_valuation.usd
          data.totalSupply = coin?.data?.market_data?.total_supply
          data.maxSupply = coin?.data?.market_data?.max_supply
          data.circulatingSupply = coin?.data?.market_data?.circulating_supply
          data.marketCapUSD = coin?.data?.market_data?.market_cap?.usd
        }

        setResult(data)
      } catch (e) {
        console.error(e)
      }
    }
    if (address) {
      getCoinData()
    }
  }, [address])

  return result
}
