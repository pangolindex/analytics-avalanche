import { USER_MINTS_BUNRS_PER_PAIR } from '../apollo/queries'
import { client } from '../apollo/client'
import dayjs from 'dayjs'
import { getShareValueOverTime } from '.'

export const priceOverrides = [
  '0xc7198437980c041c805a1edcba50c1ce5db95118', // USDT.e
  '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', // DAI.e
  '0xde3a24028580884448a5397872046a019649b084', // USDT
  '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a', // DAI
]

interface ReturnMetrics {
  hodleReturn: number // difference in asset values t0 -> t1 with t0 deposit amounts
  netReturn: number // net return from t0 -> t1
  uniswapReturn: number // netReturn - hodlReturn
  impLoss: number
  fees: number
  fees0: number // fees of token0
  fees1: number // fees of token1
}

// used to calculate returns within a given window bounded by two positions
interface Position {
  pair: any
  liquidityTokenBalance: number
  liquidityTokenTotalSupply: number
  reserve0: number
  reserve1: number
  reserveUSD: number
  token0PriceUSD: number
  token1PriceUSD: number
}

// February 9th 2021 - WAVAX/USDT pair is created
const PRICE_DISCOVERY_START_TIMESTAMP = 1612876523

// TODO: Address avalanche specific assets and timeframes
function formatPricesForEarlyTimestamps(position): Position {
  if (position.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
    if (priceOverrides.includes(position?.pair?.token0.id)) {
      position.token0PriceUSD = 1
    }
    if (priceOverrides.includes(position?.pair?.token1.id)) {
      position.token1PriceUSD = 1
    }
    // WAVAX price
    if (position.pair?.token0.id === '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7') {
      position.token0PriceUSD = 18
    }
    if (position.pair?.token1.id === '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7') {
      position.token1PriceUSD = 18
    }
  }
  return position
}

async function getPrincipalForUserPerPair(user: string, pairAddress: string) {
  let usd = 0
  let amount0 = 0
  let amount1 = 0
  // get all minst and burns to get principal amounts
  const results = await client.query({
    query: USER_MINTS_BUNRS_PER_PAIR,
    variables: {
      user,
      pair: pairAddress,
    },
  })
  for (const index in results.data.mints) {
    const mint = results.data.mints[index]
    const mintToken0 = mint.pair.token0.id
    const mintToken1 = mint.pair.token1.id

    // if trackign before prices were discovered (pre-launch days), hardcode stablecoins
    if (priceOverrides.includes(mintToken0) && mint.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(mint.amount0) * 2
    } else if (priceOverrides.includes(mintToken1) && mint.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(mint.amount1) * 2
    } else {
      usd += parseFloat(mint.amountUSD)
    }
    amount0 += amount0 + parseFloat(mint.amount0)
    amount1 += amount1 + parseFloat(mint.amount1)
  }

  for (const index in results.data.burns) {
    const burn = results.data.burns[index]
    const burnToken0 = burn.pair.token0.id
    const burnToken1 = burn.pair.token1.id

    // if trackign before prices were discovered (pre-launch days), hardcode stablecoins
    if (priceOverrides.includes(burnToken0) && burn.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(burn.amount0) * 2
    } else if (priceOverrides.includes(burnToken1) && burn.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(burn.amount1) * 2
    } else {
      usd -= parseFloat(results.data.burns[index].amountUSD)
    }

    amount0 -= parseFloat(results.data.burns[index].amount0)
    amount1 -= parseFloat(results.data.burns[index].amount1)
  }

  return { usd, amount0, amount1 }
}

/**
 * Core algorithm for calculating retursn within one time window.
 * @param positionT0 // users liquidity info and token rates at beginning of window
 * @param positionT1 // '' at the end of the window
 */
export function getMetricsForPositionWindow(positionT0: Position, positionT1: Position): ReturnMetrics {
  positionT0 = formatPricesForEarlyTimestamps(positionT0)
  positionT1 = formatPricesForEarlyTimestamps(positionT1)

  // calculate ownership at ends of window, for end of window we need original LP token balance / new total supply
  // eslint-disable-next-line eqeqeq
  const t0Ownership =
    positionT0.liquidityTokenTotalSupply !== 0
      ? positionT0.liquidityTokenBalance / positionT0.liquidityTokenTotalSupply
      : 0
  // eslint-disable-next-line eqeqeq
  const t1Ownership =
    positionT1.liquidityTokenTotalSupply !== 0
      ? positionT0.liquidityTokenBalance / positionT1.liquidityTokenTotalSupply
      : 0

  // get starting amounts of token0 and token1 deposited by LP
  const token0_amount_t0 = t0Ownership * positionT0.reserve0
  const token1_amount_t0 = t0Ownership * positionT0.reserve1

  // get current token values
  const token0_amount_t1 = t1Ownership * positionT1.reserve0
  const token1_amount_t1 = t1Ownership * positionT1.reserve1

  // calculate squares to find imp loss and fee differences
  const sqrK_t0 = Math.sqrt(token0_amount_t0 * token1_amount_t0)
  // eslint-disable-next-line eqeqeq
  const priceRatioT1 = positionT1.token0PriceUSD != 0 ? positionT1.token1PriceUSD / positionT1.token0PriceUSD : 0

  const token0_amount_no_fees = positionT1.token1PriceUSD && priceRatioT1 ? sqrK_t0 * Math.sqrt(priceRatioT1) : 0
  const token1_amount_no_fees =
    Number(positionT1.token1PriceUSD) && priceRatioT1 ? sqrK_t0 / Math.sqrt(priceRatioT1) : 0
  const no_fees_usd =
    token0_amount_no_fees * positionT1.token0PriceUSD + token1_amount_no_fees * positionT1.token1PriceUSD

  const difference_fees_token0 = token0_amount_t1 - token0_amount_no_fees
  const difference_fees_token1 = token1_amount_t1 - token1_amount_no_fees
  const difference_fees_usd =
    difference_fees_token0 * positionT1.token0PriceUSD + difference_fees_token1 * positionT1.token1PriceUSD

  // calculate USD value at t0 and t1 using initial token deposit amounts for asset return
  const assetValueT0 = token0_amount_t0 * positionT0.token0PriceUSD + token1_amount_t0 * positionT0.token1PriceUSD
  const assetValueT1 = token0_amount_t0 * positionT1.token0PriceUSD + token1_amount_t0 * positionT1.token1PriceUSD

  const imp_loss_usd = no_fees_usd - assetValueT1
  const uniswap_return = difference_fees_usd + imp_loss_usd

  // get net value change for combined data
  const netValueT0 = t0Ownership * positionT0.reserveUSD
  const netValueT1 = t1Ownership * positionT1.reserveUSD

  return {
    hodleReturn: assetValueT1 - assetValueT0,
    netReturn: netValueT1 - netValueT0,
    uniswapReturn: uniswap_return,
    impLoss: imp_loss_usd,
    fees: difference_fees_usd,
    fees0: difference_fees_token0,
    fees1: difference_fees_token1,
  }
}

/**
 * formats data for historical chart for an LPs position in 1 pair over time
 * @param startDateTimestamp // day to start tracking at
 * @param currentPairData // current stat of the pair
 * @param pairSnapshots // history of entries and exits for lp on this pair
 * @param currentETHPrice // current price of eth used for usd conversions
 */
export async function getHistoricalPairReturns(startDateTimestamp, currentPairData, pairSnapshots, currentETHPrice) {
  // catch case where data not puplated yet
  if (!currentPairData.createdAtTimestamp) {
    return []
  }
  let dayIndex: number = Math.round(startDateTimestamp / 86400) // get unique day bucket unix
  const currentDayIndex: number = Math.round(dayjs.utc().unix() / 86400)
  const sortedPositions = pairSnapshots.sort((a, b) => {
    return parseInt(a.timestamp) > parseInt(b.timestamp) ? 1 : -1
  })
  if (sortedPositions[0].timestamp > startDateTimestamp) {
    dayIndex = Math.round(sortedPositions[0].timestamp / 86400)
  }

  const dayTimestamps = []
  while (dayIndex < currentDayIndex) {
    // only account for days where this pair existed
    if (dayIndex * 86400 >= parseInt(currentPairData.createdAtTimestamp)) {
      dayTimestamps.push(dayIndex * 86400)
    }
    dayIndex = dayIndex + 1
  }

  const shareValues = await getShareValueOverTime(currentPairData.id, dayTimestamps)
  const shareValuesFormatted = {}
  shareValues?.map((share) => {
    shareValuesFormatted[share.timestamp] = share
  })

  // set the default position and data
  let positionT0 = pairSnapshots[0]
  const formattedHistory = []
  let netFees = 0

  // keep track of up to date metrics as we parse each day
  for (const index in dayTimestamps) {
    // get the bounds on the day
    const dayTimestamp = dayTimestamps[index]
    const timestampCeiling = dayTimestamp + 86400

    // for each change in position value that day, create a window and update
    const dailyChanges = pairSnapshots.filter((snapshot) => {
      return snapshot.timestamp < timestampCeiling && snapshot.timestamp > dayTimestamp
    })
    for (let i = 0; i < dailyChanges.length; i++) {
      const positionT1 = dailyChanges[i]
      const localReturns = getMetricsForPositionWindow(positionT0, positionT1)
      netFees = netFees + localReturns.fees
      positionT0 = positionT1
    }

    // now treat the end of the day as a hypothetical position
    let positionT1 = shareValuesFormatted[dayTimestamp + 86400]
    if (!positionT1) {
      positionT1 = {
        pair: currentPairData.id,
        liquidityTokenBalance: positionT0.liquidityTokenBalance,
        totalSupply: currentPairData.totalSupply,
        reserve0: currentPairData.reserve0,
        reserve1: currentPairData.reserve1,
        reserveUSD: currentPairData.reserveUSD,
        token0PriceUSD: currentPairData.token0.derivedETH * currentETHPrice,
        token1PriceUSD: currentPairData.token1.derivedETH * currentETHPrice,
      }
    }

    if (positionT1) {
      positionT1.liquidityTokenTotalSupply = positionT1.totalSupply
      positionT1.liquidityTokenBalance = positionT0.liquidityTokenBalance
      const currentLiquidityValue =
        (parseFloat(positionT1.liquidityTokenBalance) / parseFloat(positionT1.liquidityTokenTotalSupply)) *
        parseFloat(positionT1.reserveUSD)
      const localReturns = getMetricsForPositionWindow(positionT0, positionT1)
      const localFees = netFees + localReturns.fees

      formattedHistory.push({
        date: dayTimestamp,
        usdValue: currentLiquidityValue,
        fees: localFees,
      })
    }
  }

  return formattedHistory
}

/**
 * For a given pair and user, get the return metrics
 * @param user
 * @param pair
 * @param ethPrice
 */
export async function getLPReturnsOnPair(user: string, pair, ethPrice: number, snapshots) {
  // initialize values
  const principal = await getPrincipalForUserPerPair(user, pair.id)
  let hodlReturn = 0
  let netReturn = 0
  let uniswapReturn = 0
  let fees = 0
  let feesToken0 = 0
  let feesToken1 = 0

  snapshots = snapshots.filter((entry) => {
    return entry.pair.id === pair.id
  })

  // get data about the current position
  const currentPosition: Position = {
    pair,
    liquidityTokenBalance: snapshots[snapshots.length - 1]?.liquidityTokenBalance,
    liquidityTokenTotalSupply: pair.totalSupply,
    reserve0: pair.reserve0,
    reserve1: pair.reserve1,
    reserveUSD: pair.reserveUSD,
    token0PriceUSD: pair.token0.derivedETH * ethPrice,
    token1PriceUSD: pair.token1.derivedETH * ethPrice,
  }

  for (const index in snapshots) {
    // get positions at both bounds of the window
    const positionT0 = snapshots[index]
    const positionT1 = parseInt(index) === snapshots.length - 1 ? currentPosition : snapshots[parseInt(index) + 1]

    const results = getMetricsForPositionWindow(positionT0, positionT1)
    hodlReturn = hodlReturn + results.hodleReturn
    netReturn = netReturn + results.netReturn
    uniswapReturn = uniswapReturn + results.uniswapReturn
    fees = fees + results.fees
    feesToken0 = feesToken0 + results.fees0
    feesToken1 = feesToken1 + results.fees1
  }

  return {
    principal,
    net: {
      return: netReturn,
    },
    uniswap: {
      return: uniswapReturn,
    },
    fees: {
      sum: fees,
      token0: feesToken0,
      token1: feesToken1,
    },
  }
}
