import React, { useRef, useEffect } from 'react'
import { useDarkModeManager } from '../../contexts/LocalStorage'
import { useMedia } from 'react-use'
import { widget } from '@pangolindex/tradingview-chart'

const AdvanceChart = ({ tokenAddress, symbolName, base, pair, style, datafeed }) => {
  const [darkMode] = useDarkModeManager()
  const below600 = useMedia('(max-width: 600px)')
  const tvWidgetRef = useRef(null)

  useEffect(() => {
    const widgetOptions = {
      symbol: symbolName || 'PNG',
      datafeed: datafeed(tokenAddress, symbolName, base, pair),
      interval: '1D',
      container_id: 'tv_chart_container',
      library_path: '/tradingview-chart/',
      timeframe: '2M',
      debug: false,
      time_frames: [
        { text: '1Y', resolution: '1W', description: '1 Year', title: '1yr' },
        { text: '1M', resolution: '1D', description: '1 Months' },
        { text: '1D', resolution: 60, description: '1 Day' },
      ],
      locale: 'en',
      disabled_features: ['use_localstorage_for_settings', 'header_fullscreen_button'],
      charts_storage_url: 'https://saveload.tradingview.com',
      charts_storage_api_version: '1.1',
      fullscreen: false,
      autosize: true,
      theme: darkMode ? 'Dark' : 'Light',
      preset: below600 ? 'mobile' : undefined,
      loading_screen: { foregroundColor: '#000000' },
    }

    const tvWidget = new widget(widgetOptions)
    tvWidgetRef.current = tvWidget

    return () => {
      if (tvWidgetRef.current !== null) {
        tvWidgetRef.current.remove()
        tvWidgetRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const themeName = darkMode ? 'Dark' : 'Light'

    tvWidgetRef.current.onChartReady(() => {
      tvWidgetRef.current.changeTheme(themeName, { disableUndo: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode])

  return <div id="tv_chart_container" className={'AdvanceChart'} style={style} />
}

export default AdvanceChart
