import React from 'react'
import 'feather-icons'
import styled from 'styled-components'
import { Text } from 'rebass'
import { AlertTriangle } from 'react-feather'
import { RowBetween, RowFixed } from '../Row'
import { ButtonDark } from '../ButtonStyled'
import { AutoColumn } from '../Column'
import { Hover } from '..'
import Link from '../Link'
import { useMedia } from 'react-use'

const WarningWrapper = styled.div`
  border-radius: 20px;
  border: 1px solid #f82d3a;
  background: rgba(248, 45, 58, 0.05);
  padding: 1rem;
  color: #f82d3a;
  display: ${({ show }) => !show && 'none'};
  margin: 0 2rem 2rem 2rem;
  position: relative;

  @media screen and (max-width: 800px) {
    width: 80% !important;
    margin-left: 5%;
  }
`

const StyledWarningIcon = styled(AlertTriangle)`
  min-height: 20px;
  min-width: 20px;
  stroke: red;
`

export function ArbitraryWarning({ type, show, setShow, address }) {
  const below800 = useMedia('(max-width: 800px)')

  const textContent = below800 ? (
    <div>
      <Text fontWeight={500} lineHeight={'145.23%'} mt={'10px'}>
        Anyone can create and name any ERC-20 token on Avalanche, including creating fake versions of existing tokens and
        tokens that claim to represent projects that do not have a token.
      </Text>
      <Text fontWeight={500} lineHeight={'145.23%'} mt={'10px'}>
        Similar to Snowtrace, this site automatically tracks analytics for all ERC-20 tokens independent of token
        integrity. Please do your own research before interacting with any ERC-20 token.
      </Text>
    </div>
  ) : (
    <Text fontWeight={500} lineHeight={'145.23%'} mt={'10px'}>
      Anyone can create and name any ERC-20 token on Avalanche, including creating fake versions of existing tokens and
      tokens that claim to represent projects that do not have a token. Similar to Snowtrace, this site automatically
      tracks analytics for all ERC-20 tokens independent of token integrity. Please do your own research before
      interacting with any ERC-20 token.
    </Text>
  )

  return (
    <WarningWrapper show={show}>
      <AutoColumn gap="4px">
        <RowFixed>
          <StyledWarningIcon />
          <Text fontWeight={600} lineHeight={'145.23%'} ml={'10px'}>
            Token Safety Alert
          </Text>
        </RowFixed>
        {textContent}
        {below800 ? (
          <div>
            <Hover style={{ marginTop: '10px' }}>
              <Link
                fontWeight={500}
                lineHeight={'145.23%'}
                color={'#2172E5'}
                href={'https://snowtrace.io/address/' + address}
                target="_blank"
              >
                View {type === 'token' ? 'token' : 'pair'} contract on Snowtrace
              </Link>
            </Hover>
            <RowBetween style={{ marginTop: '20px' }}>
              <div />
              <ButtonDark color={'#f82d3a'} style={{ minWidth: '140px' }} onClick={() => setShow(false)}>
                I understand
              </ButtonDark>
            </RowBetween>
          </div>
        ) : (
          <RowBetween style={{ marginTop: '10px' }}>
            <Hover>
              <Link
                fontWeight={500}
                lineHeight={'145.23%'}
                color={'#2172E5'}
                href={'https://snowtrace.io/address/' + address}
                target="_blank"
              >
                View {type === 'token' ? 'token' : 'pair'} contract on Snowtrace
              </Link>
            </Hover>
            <ButtonDark color={'#f82d3a'} style={{ minWidth: '140px' }} onClick={() => setShow(false)}>
              I understand
            </ButtonDark>
          </RowBetween>
        )}
      </AutoColumn>
    </WarningWrapper>
  )
}

export function MigrateWarning({ show }) {
  return (
    <WarningWrapper show={show}>
      <AutoColumn gap="4px">
        <RowFixed>
          <StyledWarningIcon />
          <Text fontWeight={600} lineHeight={'145.23%'} ml={'10px'}>
            Token Migration Alert
          </Text>
        </RowFixed>
        <Text fontWeight={500} lineHeight={'145.23%'} mt={'10px'}>
          Due to the introduction of the faster, cheaper, and safer AB bridge, assets bridged via the old AEB bridge are
          being migrated 1:1 to their new equivalent token. These tokens are still being traded, but should be migrated
          for ease of integration with Avalanche dapps.
        </Text>
        <RowBetween style={{ marginTop: '10px' }}>
          <div />
          <Link href={'https://bridge.avax.network/convert'} target="_blank">
            <ButtonDark color={'#f82d3a'} style={{ minWidth: '140px' }}>
              Migrate
            </ButtonDark>
          </Link>
        </RowBetween>
      </AutoColumn>
    </WarningWrapper>
  )
}
