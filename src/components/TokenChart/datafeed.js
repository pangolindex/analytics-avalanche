import { getIntervalTokenData } from '../../contexts/TokenData'
import dayjs from 'dayjs'
import { convertIntervalToSeconds } from '../../utils'

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

export default (tokenAddress, symbol, base) => {
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

      onSymbolResolvedCallback(symbolInfo)
    },

    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
      const { from, to } = periodParams

      try {
        const interval = convertIntervalToSeconds(resolution)
        let data = await getIntervalTokenData(tokenAddress, from, to, interval, undefined)

        if (data.length === 0) {
          // "noData" should be set if there is no data in the requested period.
          onHistoryCallback([], {
            noData: true,
          })
          return
        }
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
