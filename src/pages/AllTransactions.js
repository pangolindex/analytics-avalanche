import React, { useEffect } from 'react'
import 'feather-icons'

import { TYPE } from '../Theme'
import Panel from '../components/Panel'
import { useGlobalData, useGlobalTransactions } from '../contexts/GlobalData'
import TxnList from '../components/TxnList'
import { PageWrapper, FullWrapper } from '../components'
import { RowBetween } from '../components/Row'
import Search from '../components/Search'
import { useMedia } from 'react-use'

function AllTransactionPage() {

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const transactions = useGlobalTransactions()
  const below800 = useMedia('(max-width: 800px)')

  return (
    <PageWrapper>
      <FullWrapper>
        <RowBetween>
          <TYPE.largeHeader>Transactions</TYPE.largeHeader>
          {!below800 && <Search small={true} />}
        </RowBetween>
        <Panel style={{ padding: below800 && '1rem 0 0 0 ' }}>
          <TxnList transactions={transactions}/>
        </Panel>
      </FullWrapper>
    </PageWrapper>
  )
}

export default AllTransactionPage
