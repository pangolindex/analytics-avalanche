import { getHourlyRateData } from '../../contexts/PairData'
import dayjs from 'dayjs'

const configurationData = {
  supports_search: false,
  exchanges: [
    {
      value: 'Pangolin',
      name: 'Pangolin',
      desc: 'Pangolin',
    },
  ],
}

const getIntervalInSeconds = (resolution) => {
  let seconds

  const exceptLast = resolution.slice(0, resolution.length - 1)
  const last = resolution.slice(resolution.length - 1)

  // xS -> seconds
  if (last === 'S') {
    seconds = exceptLast
  }
  // xD -> in days
  else if (last === 'D') {
    seconds = parseInt(exceptLast) * 24 * 3600
  }
  // xW -> in weeks
  else if (last === 'W') {
    seconds = parseInt(exceptLast) * 7 * 24 * 3600
  }

  // xM -> in months
  else if (last === 'M') {
    seconds = parseInt(exceptLast) * 30.436875 * 24 * 3600
  }
  // 1 -> just numbers -> minutes
  else {
    seconds = resolution * 60
  }

  return seconds
}

export default (tokenAddress, symbol, base, pair) => {
  return {
    onReady: (callback) => {
      setTimeout(() => callback(configurationData))
    },

    searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {},

    resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
      const symbolInfo = {
        ticker: symbol,
        name: symbol,
        description: symbol,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Pangolin',
        minmov: 1,
        pricescale: 100,
        has_seconds: true,
        has_intraday: true,
        has_no_volume: true,
        has_daily: true,
        has_weekly_and_monthly: true,
        has_emtpy_bars: true,
      }

      console.log('[resolveSymbol]: Symbol resolved', symbolName)
      onSymbolResolvedCallback(symbolInfo)
    },

    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
      const { from, to } = periodParams

      try {
        const interval = getIntervalInSeconds(resolution)

        let pairChartdata = await getHourlyRateData(tokenAddress, from, to, interval, undefined)

        if (pairChartdata.length === 0) {
          // "noData" should be set if there is no data in the requested period.
          onHistoryCallback([], {
            noData: true,
          })
          return
        }

        let data = pair === 'Rate 0' && pairChartdata.length > 0 ? pairChartdata?.[0] : pairChartdata?.[1]
        let bars = []
        data.forEach((bar) => {
          if (bar.timestamp >= from && bar.timestamp < to) {
            bars = [
              ...bars,
              {
                time: bar.timestamp * 1000,
                low: parseFloat(bar.open),
                high: parseFloat(bar.close),
                open: parseFloat(bar.open || 0),
                close: parseFloat(bar.close || 0),
              },
            ]
          }
        })

        if (bars && bars.length > 0) {
          bars.push({
            time: dayjs().unix() * 1000,
            open: parseFloat(bars[bars.length - 1].close),
            close: parseFloat(base),
            low: Math.min(parseFloat(base), parseFloat(bars[bars.length - 1].close)),
            high: Math.max(parseFloat(base), parseFloat(bars[bars.length - 1].close)),
          })
        }

        onHistoryCallback(bars, {
          noData: false,
        })
      } catch (error) {
        console.log('[getBars]: Get error', error)
        onErrorCallback(error)
      }
    },

    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {},

    unsubscribeBars: (subscriberUID) => {},
  }
}
