import React, { useState } from 'react'
import 'feather-icons'
import { withRouter } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import moment from 'moment'
import ReactHtmlParser from 'react-html-parser'
import Link from '../components/Link'
import Panel from '../components/Panel'
import TokenLogo from '../components/TokenLogo'
import PairList from '../components/PairList'
import Loader from '../components/LocalLoader'
import { AutoRow, RowBetween, RowFixed } from '../components/Row'
import Column, { AutoColumn } from '../components/Column'
import { ButtonLight, ButtonDark } from '../components/ButtonStyled'
import TxnList from '../components/TxnList'
import TokenChart from '../components/TokenChart'
import { BasicLink } from '../components/Link'
import Search from '../components/Search'
import { formattedNum, formattedPercent, getPoolLink, getSwapLink, localNumber, isAddress } from '../utils'
import { useTokenData, useTokenTransactions, useTokenPairs, useCoinGeckoTokenData } from '../contexts/TokenData'
import { TYPE, ThemedBackground } from '../Theme'
import { transparentize } from 'polished'
import { useColor } from '../hooks'
import CopyHelper from '../components/Copy'
import { useMedia } from 'react-use'
import { useDataForList } from '../contexts/PairData'
import { useEffect } from 'react'
import { ArbitraryWarning, MigrateWarning } from '../components/Warning'
import { usePathDismissed, useSavedTokens } from '../contexts/LocalStorage'
import { Hover, PageWrapper, ContentWrapper, StyledIcon } from '../components'
import { PlusCircle, Bookmark } from 'react-feather'
import FormattedName from '../components/FormattedName'
import { useListedTokens, useMigratedTokens } from '../contexts/Application'
import METAMASK_IMAGE from '../assets/MetaMask.png'

const DashboardWrapper = styled.div`
  width: 100%;
`

const PanelWrapper = styled.div`
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: max-content;
  gap: 6px;
  display: inline-grid;
  width: 100%;
  align-items: start;
  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: stretch;
    > * {
      grid-column: 1 / 4;
    }

    > * {
      &:first-child {
        width: 100%;
      }
    }
  }
`

const TokenDetailsLayout = styled.div`
  display: inline-grid;
  width: 100%;
  grid-template-columns: auto auto auto 1fr;
  column-gap: 30px;
  align-items: start;

  &:last-child {
    align-items: center;
    justify-items: end;
  }
  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: stretch;
    > * {
      grid-column: 1 / 4;
      margin-bottom: 1rem;
    }

    &:last-child {
      align-items: start;
      justify-items: start;
    }
  }
`

const MarketStatsLayout = styled.div`
  display: inline-grid;
  width: 100%;
  grid-template-columns: auto auto auto auto;
  column-gap: 30px;
  align-items: start;

  &:last-child {
    align-items: center;
    justify-items: start;
  }
  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: stretch;
    > * {
      grid-column: 1 / 4;
      margin-bottom: 1rem;
    }

    &:last-child {
      align-items: start;
      justify-items: start;
    }
  }
`

const TokenInfoLayout = styled.div`
  display: flex;
  width: 100%;
  grid-template-columns: auto auto auto auto;
  column-gap: 30px;
  align-items: start;

  &:last-child {
    align-items: center;
    justify-items: start;
  }
  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
    align-items: stretch;
    > * {
      grid-column: 1 / 4;
      margin-bottom: 1rem;
    }

    &:last-child {
      align-items: start;
      justify-items: start;
    }
  }
`

const DesktopMetaMask = styled.div`
  margin-left: 0.5rem;
`

const TokenDescription = styled.div`
  & > a {
    color: #2172e5 !important;
  }
`

const WarningGrouping = styled.div`
  opacity: ${({ disabled }) => disabled && '0.4'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
`

const Image = styled.img`
  width: 12px;
  height: 12px;
  margin-right: 8px;
`

function TokenPage({ address, history }) {
  const {
    id,
    name,
    symbol,
    decimals,
    priceUSD,
    oneDayVolumeUSD,
    totalLiquidityUSD,
    volumeChangeUSD,
    oneDayVolumeUT,
    volumeChangeUT,
    priceChangeUSD,
    liquidityChangeUSD,
    oneDayTxns,
    txnChange,
  } = useTokenData(address)

  const {
    marketCapUSD,
    totalValueLockedUSD,
    allTimeHigh,
    allTimeHighDate,
    allTimeLow,
    allTimeLowDate,
    fullyDilutedValuation,
    totalSupply,
    maxSupply,
    circulatingSupply,
    homePage,
    description,
    chatURL,
    announcementChannel,
    twitter,
    telegram,
    coinId,
  } = useCoinGeckoTokenData(address)

  useEffect(() => {
    document.querySelector('body').scrollTo(0, 0)
  }, [])

  // detect color from token
  const backgroundColor = useColor(id, symbol)

  const allPairs = useTokenPairs(address)

  // pairs to show in pair list
  const fetchedPairsList = useDataForList(allPairs)

  // all transactions with this token
  const transactions = useTokenTransactions(address)

  // price
  const price = priceUSD ? formattedNum(priceUSD, true) : ''
  const priceChange = priceChangeUSD ? formattedPercent(priceChangeUSD) : ''

  // volume
  const volume =
    oneDayVolumeUSD || oneDayVolumeUSD === 0
      ? formattedNum(oneDayVolumeUSD === 0 ? oneDayVolumeUT : oneDayVolumeUSD, true)
      : oneDayVolumeUSD === 0
      ? '$0'
      : '-'

  // mark if using untracked volume
  const [usingUtVolume, setUsingUtVolume] = useState(false)
  useEffect(() => {
    setUsingUtVolume(oneDayVolumeUSD === 0 ? true : false)
  }, [oneDayVolumeUSD])

  const volumeChange = formattedPercent(!usingUtVolume ? volumeChangeUSD : volumeChangeUT)

  // liquidity
  const liquidity = totalLiquidityUSD ? formattedNum(totalLiquidityUSD, true) : totalLiquidityUSD === 0 ? '$0' : '-'
  const liquidityChange = formattedPercent(liquidityChangeUSD)

  // transactions
  const txnChangeFormatted = formattedPercent(txnChange)

  const below1080 = useMedia('(max-width: 1080px)')
  const below800 = useMedia('(max-width: 800px)')
  const below600 = useMedia('(max-width: 600px)')
  const below500 = useMedia('(max-width: 500px)')

  // format for long symbol
  const LENGTH = below1080 ? 10 : 16
  const formattedSymbol = symbol?.length > LENGTH ? symbol.slice(0, LENGTH) + '...' : symbol

  const formattedMarketCapUSD = marketCapUSD ? formattedNum(marketCapUSD, true) : marketCapUSD === 0 ? '$0' : '-'
  const formattedFullyDilutedValuation = fullyDilutedValuation
    ? formattedNum(fullyDilutedValuation, true)
    : fullyDilutedValuation === 0
    ? '$0'
    : '-'
  const formattedTotalValueLockedUSD = totalValueLockedUSD
    ? formattedNum(totalValueLockedUSD, true)
    : totalValueLockedUSD === 0
    ? '$0'
    : '-'
  const formattedCirculatingSupply = circulatingSupply
    ? formattedNum(circulatingSupply, false)
    : circulatingSupply === 0
    ? '0'
    : '-'
  const formattedTotalSupply = totalSupply ? formattedNum(totalSupply, false) : totalSupply === 0 ? '0' : '-'
  const formattedMaxSupply = maxSupply ? formattedNum(maxSupply, false) : maxSupply === 0 ? '0' : '-'
  const formattedAllTimeHigh = allTimeHigh ? formattedNum(allTimeHigh, true) : allTimeHigh === 0 ? '$0' : '-'
  const formattedAllTimeLow = allTimeLow ? formattedNum(allTimeLow, true) : allTimeLow === 0 ? '$0' : '-'
  const formattedAllTimeHighDate = allTimeHighDate ? moment(allTimeHighDate).format('lll') : '-'
  const formattedAllTimeLowDate = allTimeLowDate ? moment(allTimeLowDate).format('lll') : '-'

  const [dismissed, markAsDismissed] = usePathDismissed(history.location.pathname)
  const [savedTokens, addToken] = useSavedTokens()
  const listedTokens = useListedTokens()
  const migratedTokens = useMigratedTokens()

  useEffect(() => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }, [])

  const addMetamask = async () => {
    const image = `https://raw.githubusercontent.com/pangolindex/tokens/main/assets/${isAddress(address)}/logo.png`
    const provider = window.ethereum
    if (provider) {
      try {
        await provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address,
              symbol,
              decimals,
              image,
            },
          },
        })
      } catch (error) {
        console.log('Error => addMetamask')
      }
    }
  }

  const MetaMaskButton = () => {
    return (
      <ButtonDark mr={below1080 && '.5rem'} color={backgroundColor} onClick={addMetamask}>
        <Image alt="metamask" src={METAMASK_IMAGE} />
        Add to Metamask
      </ButtonDark>
    )
  }

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={transparentize(0.6, backgroundColor)} />

      <ArbitraryWarning
        type={'token'}
        show={!dismissed && listedTokens && !listedTokens.includes(address)}
        setShow={markAsDismissed}
        address={address}
      />
      <MigrateWarning show={migratedTokens && migratedTokens.includes(address)} />

      <ContentWrapper>
        <RowBetween style={{ flexWrap: 'wrap', alingItems: 'start' }}>
          <AutoRow align="flex-end" style={{ width: 'fit-content' }}>
            <TYPE.body>
              <BasicLink to="/tokens">{'Tokens '}</BasicLink>→ {symbol}
              {'  '}
            </TYPE.body>
            <Link
              style={{ width: 'fit-content' }}
              color={backgroundColor}
              external
              href={'https://snowtrace.io/address/' + address}
            >
              <Text style={{ marginLeft: '.15rem' }} fontSize={'14px'} fontWeight={400}>
                ({address.slice(0, 8) + '...' + address.slice(36, 42)})
              </Text>
            </Link>
          </AutoRow>
          {!below600 && <Search small={true} />}
        </RowBetween>

        <WarningGrouping disabled={!dismissed && listedTokens && !listedTokens.includes(address)}>
          <DashboardWrapper style={{ marginTop: below1080 ? '0' : '1rem' }}>
            <RowBetween
              style={{
                flexWrap: 'wrap',
                marginBottom: '2rem',
                alignItems: 'flex-start',
              }}
            >
              <RowFixed style={{ flexWrap: 'wrap' }}>
                <RowFixed style={{ alignItems: 'baseline' }}>
                  <TokenLogo address={address} size="32px" style={{ alignSelf: 'center' }} />
                  <TYPE.main fontSize={below1080 ? '1.5rem' : '2rem'} fontWeight={500} style={{ margin: '0 1rem' }}>
                    <RowFixed gap="6px">
                      <FormattedName text={name ? name + ' ' : ''} maxCharacters={16} style={{ marginRight: '6px' }} />{' '}
                      {formattedSymbol ? `(${formattedSymbol})` : ''}
                    </RowFixed>
                  </TYPE.main>{' '}
                  {!below1080 && (
                    <>
                      <TYPE.main fontSize={'1.5rem'} fontWeight={500} style={{ marginRight: '1rem' }}>
                        {price}
                      </TYPE.main>
                      {priceChange}
                    </>
                  )}
                  {!below800 && (
                    <DesktopMetaMask>
                      <MetaMaskButton />
                    </DesktopMetaMask>
                  )}
                </RowFixed>
                {below800 && (
                  <RowFixed style={{ alignItems: 'baseline', marginTop: '.5rem' }}>
                    <MetaMaskButton />
                  </RowFixed>
                )}
              </RowFixed>
              <span>
                <RowFixed ml={below500 ? '0' : '2.5rem'} mt={below500 ? '1rem' : '0'}>
                  {!!!savedTokens[address] && !below800 ? (
                    <Hover onClick={() => addToken(address, symbol)}>
                      <StyledIcon>
                        <PlusCircle style={{ marginRight: '0.5rem' }} />
                      </StyledIcon>
                    </Hover>
                  ) : !below1080 ? (
                    <StyledIcon>
                      <Bookmark style={{ marginRight: '0.5rem', opacity: 0.4 }} />
                    </StyledIcon>
                  ) : (
                    <></>
                  )}
                  <Link href={getPoolLink(address)} target="_blank">
                    <ButtonLight color={backgroundColor}>+ Add Liquidity</ButtonLight>
                  </Link>
                  <Link href={getSwapLink(address)} target="_blank">
                    <ButtonDark ml={'.5rem'} mr={below1080 && '.5rem'} color={backgroundColor}>
                      Trade
                    </ButtonDark>
                  </Link>
                </RowFixed>
              </span>
            </RowBetween>

            <>
              <PanelWrapper style={{ marginTop: below1080 ? '0' : '1rem' }}>
                {below1080 && price && (
                  <Panel>
                    <AutoColumn gap="20px">
                      <RowBetween>
                        <TYPE.main>Price</TYPE.main>
                        <div />
                      </RowBetween>
                      <RowBetween align="flex-end">
                        {' '}
                        <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>
                          {price}
                        </TYPE.main>
                        <TYPE.main>{priceChange}</TYPE.main>
                      </RowBetween>
                    </AutoColumn>
                  </Panel>
                )}
                <Panel>
                  <AutoColumn gap="20px">
                    <RowBetween>
                      <TYPE.main>Total Liquidity</TYPE.main>
                      <div />
                    </RowBetween>
                    <RowBetween align="flex-end">
                      <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>
                        {liquidity}
                      </TYPE.main>
                      <TYPE.main>{liquidityChange}</TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </Panel>
                <Panel>
                  <AutoColumn gap="20px">
                    <RowBetween>
                      <TYPE.main>Volume (24hrs) {usingUtVolume && '(Untracked)'}</TYPE.main>
                      <div />
                    </RowBetween>
                    <RowBetween align="flex-end">
                      <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>
                        {volume}
                      </TYPE.main>
                      <TYPE.main>{volumeChange}</TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </Panel>

                <Panel>
                  <AutoColumn gap="20px">
                    <RowBetween>
                      <TYPE.main>Transactions (24hrs)</TYPE.main>
                      <div />
                    </RowBetween>
                    <RowBetween align="flex-end">
                      <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={500}>
                        {oneDayTxns ? localNumber(oneDayTxns) : oneDayTxns === 0 ? 0 : '-'}
                      </TYPE.main>
                      <TYPE.main>{txnChangeFormatted}</TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </Panel>
              </PanelWrapper>

              <Panel
                style={{
                  marginTop: '1.5rem',
                  padding: '1.125rem',
                }}
              >
                <TokenChart address={address} color={backgroundColor} base={priceUSD} symbol={symbol} />
              </Panel>
            </>
            {coinId && (
              <>
                <RowBetween style={{ marginTop: '3rem' }}>
                  <TYPE.main fontSize={'1.125rem'}>Market Stats</TYPE.main>{' '}
                </RowBetween>
                <Panel
                  rounded
                  style={{
                    marginTop: '1.5rem',
                    paddingBottom: '0',
                  }}
                  p={20}
                >
                  <MarketStatsLayout>
                    <Column>
                      <TYPE.main>Market Cap</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedMarketCapUSD}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>Fully Diluted Valuation</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedFullyDilutedValuation}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>Total Value Locked</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedTotalValueLockedUSD}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>Circulating Supply</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedCirculatingSupply}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>Total Supply</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedTotalSupply}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>Max Supply</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedMaxSupply}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>All-Time High</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedAllTimeHigh}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>All-Time Low</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedAllTimeLow}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>All-Time High Date</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedAllTimeHighDate}
                      </TYPE.main>
                    </Column>
                    <Column>
                      <TYPE.main>All-Time Low Date</TYPE.main>
                      <TYPE.main style={{ marginTop: '.5rem', marginBottom: '2rem' }} fontSize={18} fontWeight="500">
                        {formattedAllTimeLowDate}
                      </TYPE.main>
                    </Column>
                  </MarketStatsLayout>
                </Panel>
              </>
            )}
            <span>
              <TYPE.main fontSize={'1.125rem'} style={{ marginTop: '3rem' }}>
                Top Pairs
              </TYPE.main>
            </span>
            <Panel
              rounded
              style={{
                marginTop: '1.5rem',
                padding: '1.125rem 0 ',
              }}
            >
              {address && fetchedPairsList ? (
                <PairList color={backgroundColor} address={address} pairs={fetchedPairsList} />
              ) : (
                <Loader />
              )}
            </Panel>
            <RowBetween mt={40} mb={'1rem'}>
              <TYPE.main fontSize={'1.125rem'}>Transactions</TYPE.main> <div />
            </RowBetween>
            <Panel rounded>
              {transactions ? <TxnList color={backgroundColor} transactions={transactions} /> : <Loader />}
            </Panel>
            <>
              <RowBetween style={{ marginTop: '3rem' }}>
                <TYPE.main fontSize={'1.125rem'}>Token Information</TYPE.main>{' '}
              </RowBetween>
              <Panel
                rounded
                style={{
                  marginTop: '1.5rem',
                }}
                p={20}
              >
                <TokenDetailsLayout>
                  <Column>
                    <TYPE.main>Symbol</TYPE.main>
                    <Text style={{ marginTop: '.5rem' }} fontSize={24} fontWeight="500">
                      <FormattedName text={symbol} maxCharacters={12} />
                    </Text>
                  </Column>
                  <Column>
                    <TYPE.main>Name</TYPE.main>
                    <TYPE.main style={{ marginTop: '.5rem' }} fontSize={24} fontWeight="500">
                      <FormattedName text={name} maxCharacters={16} />
                    </TYPE.main>
                  </Column>
                  <Column>
                    <TYPE.main>Address</TYPE.main>
                    <AutoRow align="flex-end">
                      <TYPE.main style={{ marginTop: '.5rem' }} fontSize={24} fontWeight="500">
                        {address.slice(0, 8) + '...' + address.slice(36, 42)}
                      </TYPE.main>
                      <CopyHelper toCopy={address} />
                    </AutoRow>
                  </Column>
                  <ButtonLight color={backgroundColor}>
                    <Link
                      color={backgroundColor}
                      external
                      href={'https://snowtrace.io/address/' + address}
                    >
                      View on the Snowtrace Explorer ↗
                    </Link>
                  </ButtonLight>
                </TokenDetailsLayout>
              </Panel>
              {coinId && (
                <Panel
                  rounded
                  style={{
                    marginTop: '1.5rem',
                  }}
                  p={20}
                >
                  {description !== '' && (
                    <Column>
                      <TYPE.main fontSize={16}>
                        What is <strong>{name}</strong>?
                      </TYPE.main>
                      <TYPE.main
                        style={{ marginTop: '.5rem', marginBottom: '2rem' }}
                        fontSize={13}
                        fontWeight="400"
                        lineHeight="20px"
                      >
                        <TokenDescription>{ReactHtmlParser(description)}</TokenDescription>
                      </TYPE.main>
                    </Column>
                  )}
                  <TokenInfoLayout>
                    <Column>
                      <ButtonLight color={backgroundColor}>
                        <Link color={backgroundColor} external href={homePage}>
                          Homepage ↗
                        </Link>
                      </ButtonLight>
                    </Column>
                    {chatURL !== '' && (
                      <Column>
                        <ButtonLight color={backgroundColor}>
                          <Link color={backgroundColor} external href={chatURL}>
                            Discord ↗
                          </Link>
                        </ButtonLight>
                      </Column>
                    )}
                    {announcementChannel !== '' && (
                      <Column>
                        <ButtonLight color={backgroundColor}>
                          <Link color={backgroundColor} external href={announcementChannel}>
                            Announcement Channel ↗
                          </Link>
                        </ButtonLight>
                      </Column>
                    )}
                    {twitter !== '' && (
                      <Column>
                        <ButtonLight color={backgroundColor}>
                          <Link color={backgroundColor} external href={`https://twitter.com/${twitter}`}>
                            Twitter ↗
                          </Link>
                        </ButtonLight>
                      </Column>
                    )}
                    {telegram !== '' && (
                      <Column>
                        <ButtonLight color={backgroundColor}>
                          <Link color={backgroundColor} external href={`https://t.me/${telegram}`}>
                            Telegram ↗
                          </Link>
                        </ButtonLight>
                      </Column>
                    )}
                  </TokenInfoLayout>
                </Panel>
              )}
            </>
          </DashboardWrapper>
        </WarningGrouping>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default withRouter(TokenPage)
