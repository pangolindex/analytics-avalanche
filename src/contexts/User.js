import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'
import { usePairData } from './PairData'
import { client } from '../apollo/client'
import { USER_TRANSACTIONS, USER_POSITIONS, USER_HISTORY, PAIR_DAY_DATA_BULK } from '../apollo/queries'
import { useTimeframe, useStartTimestamp } from './Application'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { getLPReturnsOnPair, getHistoricalPairReturns } from '../utils/returns'
import { timeframeOptions } from '../constants'
import _ from 'lodash'
import { crawlSingleQuery } from '../utils'
import { updateNameData } from '../utils/data'

dayjs.extend(utc)

const UPDATE_TRANSACTIONS = 'UPDATE_TRANSACTIONS'
const UPDATE_POSITIONS = 'UPDATE_POSITIONS '
const UPDATE_USER_POSITION_HISTORY = 'UPDATE_USER_POSITION_HISTORY'
const UPDATE_USER_PAIR_RETURNS = 'UPDATE_USER_PAIR_RETURNS'

const TRANSACTIONS_KEY = 'TRANSACTIONS_KEY'
const POSITIONS_KEY = 'POSITIONS_KEY'
const USER_SNAPSHOTS = 'USER_SNAPSHOTS'
const USER_PAIR_RETURNS_KEY = 'USER_PAIR_RETURNS_KEY'

const UserContext = createContext()

function useUserContext() {
  return useContext(UserContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE_TRANSACTIONS: {
      const { account, transactions } = payload
      return {
        ...state,
        [account]: {
          ...state?.[account],
          [TRANSACTIONS_KEY]: transactions,
        },
      }
    }
    case UPDATE_POSITIONS: {
      const { account, positions } = payload
      return {
        ...state,
        [account]: { ...state?.[account], [POSITIONS_KEY]: positions },
      }
    }
    case UPDATE_USER_POSITION_HISTORY: {
      const { account, historyData } = payload
      return {
        ...state,
        [account]: { ...state?.[account], [USER_SNAPSHOTS]: historyData },
      }
    }

    case UPDATE_USER_PAIR_RETURNS: {
      const { account, pairAddress, data } = payload
      return {
        ...state,
        [account]: {
          ...state?.[account],
          [USER_PAIR_RETURNS_KEY]: {
            ...state?.[account]?.[USER_PAIR_RETURNS_KEY],
            [pairAddress]: data,
          },
        },
      }
    }

    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

const INITIAL_STATE = {}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const updateTransactions = useCallback((account, transactions) => {
    dispatch({
      type: UPDATE_TRANSACTIONS,
      payload: {
        account,
        transactions,
      },
    })
  }, [])

  const updatePositions = useCallback((account, positions) => {
    dispatch({
      type: UPDATE_POSITIONS,
      payload: {
        account,
        positions,
      },
    })
  }, [])

  const updateUserSnapshots = useCallback((account, historyData) => {
    dispatch({
      type: UPDATE_USER_POSITION_HISTORY,
      payload: {
        account,
        historyData,
      },
    })
  }, [])

  const updateUserPairReturns = useCallback((account, pairAddress, data) => {
    dispatch({
      type: UPDATE_USER_PAIR_RETURNS,
      payload: {
        account,
        pairAddress,
        data,
      },
    })
  }, [])

  return (
    <UserContext.Provider
      value={useMemo(
        () => [state, { updateTransactions, updatePositions, updateUserSnapshots, updateUserPairReturns }],
        [state, updateTransactions, updatePositions, updateUserSnapshots, updateUserPairReturns]
      )}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUserTransactions(account) {
  const [state, { updateTransactions }] = useUserContext()
  const transactions = state?.[account]?.[TRANSACTIONS_KEY]
  useEffect(() => {
    async function fetchData(account) {
      try {
        let result = await client.query({
          query: USER_TRANSACTIONS,
          variables: {
            user: account,
          },
          fetchPolicy: 'no-cache',
        })
        if (result?.data) {
          updateTransactions(account, result?.data)
        }
      } catch (e) {
        console.log(e)
      }
    }
    if (!transactions && account) {
      fetchData(account)
    }
  }, [account, transactions, updateTransactions])

  if (transactions) {
    let txCopy = _.cloneDeep(transactions)
    //txCopy.converted = true
    return txCopy
  }

  return transactions || {}
}

/**
 * Store all the snapshots of liquidity activity for this account.
 * Each snapshot is a moment when an LP position was created or updated.
 * @param {*} account
 */
export function useUserSnapshots(account) {
  const [state, { updateUserSnapshots }] = useUserContext()
  const snapshots = state?.[account]?.[USER_SNAPSHOTS]

  useEffect(() => {
    async function fetchData() {
      try {
        const allResults = await crawlSingleQuery(
          USER_HISTORY,
          'liquidityPositionSnapshots',
          client,
          { fetchPolicy: 'cache-first' },
          {
            user: account,
            now: dayjs.utc().unix(),
          },
          0,
          'timestamp',
          true
        )
        if (allResults) {
          updateUserSnapshots(account, allResults)
        }
      } catch (e) {
        console.log(e)
      }
    }
    if (!snapshots && account) {
      fetchData()
    }
  }, [account, snapshots, updateUserSnapshots])

  return snapshots
}

/**
 * For a given position (data about holding) and user, get the chart
 * data for the fees and liquidity over time
 * @param {*} position
 * @param {*} account
 */
export function useUserPositionChart(position, account) {
  const pairAddress = position?.pair?.id
  const [state, { updateUserPairReturns }] = useUserContext()

  // get oldest date of data to fetch
  const startDateTimestamp = useStartTimestamp()

  // get users adds and removes on this pair
  const snapshots = useUserSnapshots(account)

  // get data needed for calculations
  const currentPairData = usePairData(pairAddress)

  // formatted array to return for chart data
  const formattedHistory = state?.[account]?.[USER_PAIR_RETURNS_KEY]?.[pairAddress]

  useEffect(() => {
    async function fetchData() {
      const pairSnapshots = snapshots.filter((currentSnapshot) => {
        return currentSnapshot.pair.id === position.pair.id
      })
      const fetchedData = await getHistoricalPairReturns(startDateTimestamp, currentPairData, pairSnapshots)
      updateUserPairReturns(account, pairAddress, fetchedData)
    }
    if (
      account &&
      startDateTimestamp &&
      !formattedHistory &&
      currentPairData &&
      Object.keys(currentPairData).length > 0 &&
      pairAddress &&
      snapshots &&
      position.pair.id
    ) {
      fetchData()
    }
  }, [
    account,
    startDateTimestamp,
    formattedHistory,
    currentPairData,
    pairAddress,
    snapshots,
    position.pair.id,
    updateUserPairReturns,
  ])

  return formattedHistory
}

/**
 * For each day starting with min(first position timestamp, beginning of time window),
 * get total liquidity supplied by user in USD. Format in array with date timestamps
 * and usd liquidity value.
 */
export function useUserLiquidityChart(account) {
  const history = useUserSnapshots(account)
  // formatted array to return for chart data
  const [formattedHistory, setFormattedHistory] = useState()

  const [startDateTimestamp, setStartDateTimestamp] = useState()
  const [activeWindow] = useTimeframe()

  // monitor the old date fetched
  useEffect(() => {
    const utcEndTime = dayjs.utc()
    // based on window, get start time
    let utcStartTime
    switch (activeWindow) {
      case timeframeOptions.WEEK:
        utcStartTime = utcEndTime.subtract(1, 'week').startOf('day')
        break
      case timeframeOptions.ALL_TIME:
        utcStartTime = utcEndTime.subtract(1, 'year')
        break
      default:
        utcStartTime = utcEndTime.subtract(1, 'year').startOf('year')
        break
    }
    let startTime = utcStartTime.unix() - 1
    if ((activeWindow && startTime < startDateTimestamp) || !startDateTimestamp) {
      setStartDateTimestamp(startTime)
    }
  }, [activeWindow, startDateTimestamp])

  useEffect(() => {
    async function fetchData() {
      let dayIndex = parseInt(startDateTimestamp / 86400) // get unique day bucket unix
      const currentDayIndex = parseInt(dayjs.utc().unix() / 86400)

      // sort snapshots in order
      const sortedPositions = history.sort((a, b) => {
        return parseInt(a.timestamp) > parseInt(b.timestamp) ? 1 : -1
      })
      // if UI start time is > first position time - bump start index to this time
      if (parseInt(sortedPositions[0].timestamp) > startDateTimestamp) {
        dayIndex = parseInt(parseInt(sortedPositions[0].timestamp) / 86400)
      }

      const dayTimestamps = []
      // get date timestamps for all days in view
      while (dayIndex <= currentDayIndex) {
        dayTimestamps.push(parseInt(dayIndex) * 86400)
        dayIndex = dayIndex + 1
      }

      // get unique pair addresses from history
      const pairs = [...new Set(history.map((history) => history.pair.id))]

      // get all day datas where date is in this list, and pair is in pair list
      const pairDayDatas = await crawlSingleQuery(
        PAIR_DAY_DATA_BULK,
        'pairDayDatas',
        client,
        { fetchPolicy: 'cache-first' },
        { pairs: pairs },
        startDateTimestamp,
        'date',
        true
      )

      const formattedHistory = []

      // map of current pair => ownership %
      const ownershipPerPair = {}
      for (const dayTimestamp of dayTimestamps) {
        const timestampCeiling = dayTimestamp + 86400

        // cycle through relevant positions and update ownership for any that we need to
        const relevantPositions = history.filter((snapshot) => {
          return snapshot.timestamp < timestampCeiling && snapshot.timestamp >= dayTimestamp
        })
        for (const position of relevantPositions) {
          // case where pair not added yet
          if (!ownershipPerPair[position.pair.id]) {
            ownershipPerPair[position.pair.id] = {
              lpTokenBalance: position.liquidityTokenBalance,
              timestamp: position.timestamp,
            }
          }
          // case where more recent timestamp is found for pair
          if (ownershipPerPair[position.pair.id] && ownershipPerPair[position.pair.id].timestamp < position.timestamp) {
            ownershipPerPair[position.pair.id] = {
              lpTokenBalance: position.liquidityTokenBalance,
              timestamp: position.timestamp,
            }
          }
        }

        const relevantDayDatas = Object.keys(ownershipPerPair).map((pairAddress) => {
          // find last day data after timestamp update
          const dayDatasForThisPair = pairDayDatas.filter((dayData) => {
            return dayData.pairAddress === pairAddress
          })
          // find the most recent reference to pair liquidity data
          let mostRecent = dayDatasForThisPair[0]
          for (const dayData of dayDatasForThisPair) {
            if (dayData.date < dayTimestamp && dayData.date > mostRecent.date) {
              mostRecent = dayData
            }
          }
          return mostRecent
        })

        // now cycle through pair day datas, for each one find usd value = ownership[address] * reserveUSD
        const dailyUSD = relevantDayDatas.reduce((totalUSD, dayData) => {
          return (
            totalUSD +
            (dayData && ownershipPerPair[dayData.pairAddress]
              ? (parseFloat(ownershipPerPair[dayData.pairAddress].lpTokenBalance) / parseFloat(dayData.totalSupply)) *
                parseFloat(dayData.reserveUSD)
              : 0)
          )
        }, 0)

        formattedHistory.push({
          date: dayTimestamp,
          valueUSD: dailyUSD,
        })
      }

      setFormattedHistory(formattedHistory)
    }
    if (history && startDateTimestamp && history.length > 0) {
      fetchData()
    }
  }, [history, startDateTimestamp])

  return formattedHistory
}

export function useUserPositions(account) {
  const [state, { updatePositions }] = useUserContext()
  const positions = state?.[account]?.[POSITIONS_KEY]

  const snapshots = useUserSnapshots(account)

  useEffect(() => {
    async function fetchData(account) {
      try {
        const result = await crawlSingleQuery(
          USER_POSITIONS,
          'liquidityPositions',
          client,
          { fetchPolicy: 'cache-first' },
          { user: account },
          '0',
          'id'
        )

        if (result) {
          const formattedPositions = await Promise.all(
            result.map(async (positionData) => {
              const returnData = await getLPReturnsOnPair(account, positionData.pair, snapshots)
              return {
                ...positionData,
                pair: updateNameData(positionData.pair),
                ...returnData,
              }
            })
          )
          updatePositions(account, formattedPositions)
        }
      } catch (e) {
        console.log(e)
      }
    }
    if (!positions && account && snapshots) {
      fetchData(account)
    }
  }, [account, positions, updatePositions, snapshots])

  return positions
}
