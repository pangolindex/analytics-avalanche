import React from 'react'
import styled from 'styled-components'
import { MenuOptions, SocialOptions } from '../SideNav'
import Title from '../Title'

const MenuWrapper = styled.div`
  height: fit-content;
  min-height: 100vh;
  width: 100%;
  padding: 1.5rem 2rem;
  position: fixed;
  top: 0px;
  z-index: 10000;
  opacity: 1;
  box-sizing: border-box;
  background: linear-gradient(193.68deg, #1b1c22 0.68%, #000000 100.48%);
  color: ${({ theme }) => theme.text1};
`

const OptionsWrapper = styled.div`
  height: calc(100vh - 80px);
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
`

const MobileMenu = ({ isMobileMenuActive, setIsMobileMenuActive }) => {
  return (
    <MenuWrapper>
      <Title isMobileMenuActive={isMobileMenuActive} setIsMobileMenuActive={setIsMobileMenuActive} />
      <OptionsWrapper>
        <MenuOptions isMobileMenuActive={isMobileMenuActive} setIsMobileMenuActive={setIsMobileMenuActive} />
        <SocialOptions showToggle={false} />
      </OptionsWrapper>
    </MenuWrapper>
  )
}

export default MobileMenu
