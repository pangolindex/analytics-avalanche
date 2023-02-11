import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import 'feather-icons'
import { Maximize, Minimize } from 'react-feather'
import { Area, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, BarChart, Bar } from 'recharts'
import { RowBetween, AutoRow } from '../Row'
import { toK, toNiceDate, toNiceDateYear, formattedNum, getTimeframe } from '../../utils'
import { OptionButton } from '../ButtonStyled'
import { darken } from 'polished'
import { usePairChartData, usePairData } from '../../contexts/PairData'
import { timeframeOptions, PAIR_CHART_VIEW_OPTIONS, SYMBOL_MAX_DISPLAY_LENGTH } from '../../constants'
import { useMedia } from 'react-use'
import { EmptyCard } from '..'
import DropdownSelect from '../DropdownSelect'
import LocalLoader from '../LocalLoader'
import { useDarkModeManager } from '../../contexts/LocalStorage'
import AdvanceChart from '../AdvanceChart'
import datafeed from './datafeed.js'

const ChartWrapper = styled.div`
  height: 100%;

  @media screen and (max-width: 600px) {
    min-height: 200px;
  }
`

const OptionsRow = styled.div`
  display: flex;
  flex-direction: row;
  width: auto;
  margin-bottom: ${(props) => (props.isFullScreen ? 0 : '20px')};
  padding: ${(props) => (props.isFullScreen ? '10px' : '0px')};
`

const MaximizeIcon = styled(Maximize)`
  min-height: 14px;
  min-width: 14px;
`

const MinimizeIcon = styled(Minimize)`
  min-height: 14px;
  min-width: 14px;
`

const fullScreenStyle = {
  height: '100%',
  width: '100%',
  position: 'fixed',
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  background: '#000',
  zIndex: 9999999,
}

const PairChart = ({ address, color, base0, base1 }) => {
  const [chartFilter, setChartFilter] = useState(PAIR_CHART_VIEW_OPTIONS.LIQUIDITY)

  const [timeWindow, setTimeWindow] = useState(timeframeOptions.MONTH)

  const [isFullScreen, setIsFullScreen] = useState(false)

  const [chartVisible, setChartVisible] = useState(true)

  const [darkMode] = useDarkModeManager()
  const textColor = darkMode ? 'white' : 'black'

  // update the width on a window resize
  const ref = useRef()
  const isClient = typeof window === 'object'
  const [width, setWidth] = useState(ref?.current?.container?.clientWidth)
  const [height, setHeight] = useState(ref?.current?.container?.clientHeight)
  useEffect(() => {
    if (!isClient) {
      return false
    }
    function handleResize() {
      setWidth(ref?.current?.container?.clientWidth ?? width)
      setHeight(ref?.current?.container?.clientHeight ?? height)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [height, isClient, width]) // Empty array ensures that effect is only run on mount and unmount

  // get data for pair, and rates
  const pairData = usePairData(address)
  let chartData = usePairChartData(address)

  // formatted symbols for overflow
  const formattedSymbol0 =
    pairData?.token0?.symbol.length > SYMBOL_MAX_DISPLAY_LENGTH ? pairData?.token0?.symbol.slice(0, SYMBOL_MAX_DISPLAY_LENGTH - 1) + '...' : pairData?.token0?.symbol
  const formattedSymbol1 =
    pairData?.token1?.symbol.length > SYMBOL_MAX_DISPLAY_LENGTH ? pairData?.token1?.symbol.slice(0, SYMBOL_MAX_DISPLAY_LENGTH - 1) + '...' : pairData?.token1?.symbol

  const below1600 = useMedia('(max-width: 1600px)')
  const below1080 = useMedia('(max-width: 1080px)')
  const below600 = useMedia('(max-width: 600px)')

  let utcStartTime = getTimeframe(timeWindow)
  chartData = chartData?.filter((entry) => entry.date >= utcStartTime)

  if (chartData && chartData.length === 0) {
    return (
      <ChartWrapper>
        <EmptyCard height="300px">No historical data yet.</EmptyCard>{' '}
      </ChartWrapper>
    )
  }

  const aspect = below1080 ? 60 / 20 : below1600 ? 60 / 28 : 60 / 22

  return (
    <ChartWrapper style={isFullScreen ? fullScreenStyle : {}}>
      {below600 ? (
        <RowBetween mb={40}>
          <DropdownSelect
            options={PAIR_CHART_VIEW_OPTIONS}
            active={chartFilter}
            setActive={setChartFilter}
            color={color}
          />
          {(chartFilter === PAIR_CHART_VIEW_OPTIONS.VOLUME || chartFilter === PAIR_CHART_VIEW_OPTIONS.LIQUIDITY) && (
            <DropdownSelect options={timeframeOptions} active={timeWindow} setActive={setTimeWindow} color={color} />
          )}
        </RowBetween>
      ) : (
        <OptionsRow isFullScreen={isFullScreen}>
          <AutoRow gap="6px" style={{ flexWrap: 'nowrap' }}>
            {!isFullScreen && (
              <OptionButton
                active={chartFilter === PAIR_CHART_VIEW_OPTIONS.LIQUIDITY}
                onClick={() => {
                  setTimeWindow(timeframeOptions.ALL_TIME)
                  setChartFilter(PAIR_CHART_VIEW_OPTIONS.LIQUIDITY)
                }}
              >
                Liquidity
              </OptionButton>
            )}
            {!isFullScreen && (
              <OptionButton
                active={chartFilter === PAIR_CHART_VIEW_OPTIONS.VOLUME}
                onClick={() => {
                  setTimeWindow(timeframeOptions.ALL_TIME)
                  setChartFilter(PAIR_CHART_VIEW_OPTIONS.VOLUME)
                }}
              >
                Volume
              </OptionButton>
            )}
            <OptionButton
              active={chartFilter === PAIR_CHART_VIEW_OPTIONS.RATE0}
              onClick={() => {
                setTimeWindow(timeframeOptions.WEEK)
                setChartFilter(PAIR_CHART_VIEW_OPTIONS.RATE0)
              }}
            >
              {pairData.token0 ? formattedSymbol1 + '/' + formattedSymbol0 : '-'}
            </OptionButton>
            <OptionButton
              active={chartFilter === PAIR_CHART_VIEW_OPTIONS.RATE1}
              onClick={() => {
                setTimeWindow(timeframeOptions.WEEK)
                setChartFilter(PAIR_CHART_VIEW_OPTIONS.RATE1)
              }}
            >
              {pairData.token0 ? formattedSymbol0 + '/' + formattedSymbol1 : '-'}
            </OptionButton>
          </AutoRow>
          {(chartFilter === PAIR_CHART_VIEW_OPTIONS.VOLUME || chartFilter === PAIR_CHART_VIEW_OPTIONS.LIQUIDITY) && (
            <AutoRow justify="flex-end" gap="6px" style={{ width: 'auto' }}>
              <OptionButton
                active={timeWindow === timeframeOptions.WEEK}
                onClick={() => setTimeWindow(timeframeOptions.WEEK)}
              >
                1W
              </OptionButton>
              <OptionButton
                active={timeWindow === timeframeOptions.MONTH}
                onClick={() => setTimeWindow(timeframeOptions.MONTH)}
              >
                1M
              </OptionButton>
              <OptionButton
                active={timeWindow === timeframeOptions.ALL_TIME}
                onClick={() => setTimeWindow(timeframeOptions.ALL_TIME)}
              >
                All
              </OptionButton>
            </AutoRow>
          )}

          {(chartFilter === PAIR_CHART_VIEW_OPTIONS.RATE1 || chartFilter === PAIR_CHART_VIEW_OPTIONS.RATE0) && (
            <AutoRow justify="flex-end" gap="6px" style={{ width: 'auto' }}>
              <OptionButton
                onClick={() => {
                  if (isFullScreen) {
                    document.body.style.overflow = 'visible'
                  } else {
                    document.body.style.overflow = 'hidden'
                  }
                  setChartVisible(false)
                  setIsFullScreen(!isFullScreen)
                  // we are doing this because we want to reset chart on toggle fullscreen
                  setTimeout(() => {
                    setChartVisible(true)
                  }, 500)
                }}
              >
                {isFullScreen ? <MinimizeIcon size={16} /> : <MaximizeIcon size={16} />}
              </OptionButton>
            </AutoRow>
          )}
        </OptionsRow>
      )}
      {chartFilter === PAIR_CHART_VIEW_OPTIONS.LIQUIDITY && (
        <ResponsiveContainer aspect={aspect}>
          <AreaChart margin={{ top: 0, right: 10, bottom: 6, left: 0 }} barCategoryGap={1} data={chartData}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              tickLine={false}
              axisLine={false}
              interval="preserveEnd"
              tickMargin={14}
              minTickGap={80}
              tickFormatter={(tick) => toNiceDate(tick)}
              dataKey="date"
              tick={{ fill: textColor }}
              type={'number'}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              type="number"
              orientation="right"
              tickFormatter={(tick) => '$' + toK(tick)}
              axisLine={false}
              tickLine={false}
              interval="preserveEnd"
              minTickGap={80}
              yAxisId={0}
              tickMargin={16}
              tick={{ fill: textColor }}
            />
            <Tooltip
              cursor={true}
              formatter={(val) => formattedNum(val, true)}
              labelFormatter={(label) => toNiceDateYear(label)}
              labelStyle={{ paddingTop: 4 }}
              contentStyle={{
                padding: '10px 14px',
                borderRadius: 10,
                borderColor: color,
                color: 'black',
              }}
              wrapperStyle={{ top: -70, left: -10 }}
            />
            <Area
              strokeWidth={2}
              dot={false}
              type="monotone"
              name={' (USD)'}
              dataKey={'reserveUSD'}
              yAxisId={0}
              stroke={darken(0.12, color)}
              fill="url(#colorUv)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {chartFilter === PAIR_CHART_VIEW_OPTIONS.RATE1 &&
        (formattedSymbol0 && formattedSymbol1 && chartVisible ? (
          <div style={{ height: isFullScreen ? '100%' : '380px' }}>
            <AdvanceChart
              symbolName={formattedSymbol0 + '/' + formattedSymbol1}
              style={{ height: isFullScreen ? 'calc(100% - 60px)' : '100%' }}
              datafeed={datafeed(
                address,
                formattedSymbol0 + '/' + formattedSymbol1,
                base0,
                PAIR_CHART_VIEW_OPTIONS.RATE1
              )}
            />
          </div>
        ) : (
          <LocalLoader />
        ))}

      {chartFilter === PAIR_CHART_VIEW_OPTIONS.RATE0 &&
        (formattedSymbol0 && formattedSymbol1 && chartVisible ? (
          <div style={{ height: isFullScreen ? '100%' : '380px' }}>
            <AdvanceChart
              symbolName={formattedSymbol1 + '/' + formattedSymbol0}
              style={{ height: isFullScreen ? 'calc(100% - 60px)' : '100%' }}
              datafeed={datafeed(
                address,
                formattedSymbol1 + '/' + formattedSymbol0,
                base1,
                PAIR_CHART_VIEW_OPTIONS.RATE0
              )}
            />
          </div>
        ) : (
          <LocalLoader />
        ))}

      {chartFilter === PAIR_CHART_VIEW_OPTIONS.VOLUME && (
        <ResponsiveContainer aspect={aspect}>
          <BarChart
            margin={{ top: 0, right: 0, bottom: 6, left: below1080 ? 0 : 10 }}
            barCategoryGap={1}
            data={chartData}
          >
            <XAxis
              tickLine={false}
              axisLine={false}
              interval="preserveEnd"
              minTickGap={80}
              tickMargin={14}
              tickFormatter={(tick) => toNiceDate(tick)}
              dataKey="date"
              tick={{ fill: textColor }}
              type={'number'}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              type="number"
              axisLine={false}
              tickMargin={16}
              tickFormatter={(tick) => '$' + toK(tick)}
              tickLine={false}
              interval="preserveEnd"
              orientation="right"
              minTickGap={80}
              yAxisId={0}
              tick={{ fill: textColor }}
            />
            <Tooltip
              cursor={{ fill: color, opacity: 0.1 }}
              formatter={(val) => formattedNum(val, true)}
              labelFormatter={(label) => toNiceDateYear(label)}
              labelStyle={{ paddingTop: 4 }}
              contentStyle={{
                padding: '10px 14px',
                borderRadius: 10,
                borderColor: color,
                color: 'black',
              }}
              wrapperStyle={{ top: -70, left: -10 }}
            />
            <Bar
              type="monotone"
              name={'Volume'}
              dataKey={'dailyVolumeUSD'}
              fill={color}
              opacity={'0.4'}
              yAxisId={0}
              stroke={color}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartWrapper>
  )
}

export default PairChart
