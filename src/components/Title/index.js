import React from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { Flex } from 'rebass'
import { RowFixed } from '../Row'
import LogoAndTitle from '../../assets/logo_and_title.png'
import { Menu, X } from 'react-feather'

const TitleWrapper = styled.div`
  text-decoration: none;
  width: 100%;
  z-index: 10;
`
const RowElement = styled(RowFixed)`
  &:hover {
    cursor: pointer;
  }
  & svg:hover {
    opacity: 0.8;
  }
`

const HamburgerElement = styled(RowFixed)`
  display: none;
  padding: 0.4rem;
  background-color: ${({ theme }) => theme.philippineYellow};
  border-radius: 50%;
  :hover {
    cursor: pointer;
  }
  svg:hover {
    opacity: 0.8;
  }

  @media screen and (max-width: 1080px) {
    display: flex;
  }
`

export default function Title({ isMobileMenuActive, setIsMobileMenuActive }) {
  const history = useHistory()

  return (
    <TitleWrapper>
      <Flex justifyContent="space-between" alignItems="center">
        <RowElement onClick={() => history.push('/')}>
          <img width={'145px'} src={LogoAndTitle} alt="logo" />
        </RowElement>
        {isMobileMenuActive ? (
          <RowElement
            onClick={() => {
              setIsMobileMenuActive(!isMobileMenuActive)
            }}
          >
            <X width="24px" height="24px" stroke="white" />
          </RowElement>
        ) : (
          <HamburgerElement
            onClick={() => {
              setIsMobileMenuActive(!isMobileMenuActive)
            }}
          >
            <Menu strokeWidth="0.18rem" width="20px" height="20px" stroke="black" />
          </HamburgerElement>
        )}
      </Flex>
    </TitleWrapper>
  )
}
