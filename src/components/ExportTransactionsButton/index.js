import React, { useState } from 'react'
import { writeToString } from '@fast-csv/format'
import { Download, Loader } from 'react-feather'

import { updateNameData } from '../../utils/data'

import { ButtonDark } from '../ButtonStyled'
import { StyledIcon } from '../index.js'

function prepareTransactionsForExport(transactions) {
  const mints = transactions.mints.map((mint) => ({
    date: parseInt(mint.transaction.timestamp, 10) * 1000,
    hash: mint.transaction.id,
    fiat_amount: mint.amountUSD,
    fiat_currency: 'USD',
    token1_amount: mint.amount0,
    token1_currency: updateNameData(mint.pair).token0.symbol,
    token2_amount: mint.amount1,
    token2_currency: updateNameData(mint.pair).token1.symbol,
    type: 'add',
  }))

  const burns = transactions.burns.map((burn) => ({
    date: parseInt(burn.transaction.timestamp, 10) * 1000,
    hash: burn.transaction.id,
    fiat_amount: burn.amountUSD,
    fiat_currency: 'USD',
    token1_amount: burn.amount0,
    token1_currency: updateNameData(burn.pair).token0.symbol,
    token2_amount: burn.amount1,
    token2_currency: updateNameData(burn.pair).token1.symbol,
    type: 'remove',
  }))

  const swaps = transactions.swaps.map((swap) => {
    const newSwap = { ...swap }

    const netToken0 = swap.amount0In - swap.amount0Out
    const netToken1 = swap.amount1In - swap.amount1Out
    if (netToken0 < 0) {
      newSwap.token0Symbol = updateNameData(swap.pair).token0.symbol
      newSwap.token1Symbol = updateNameData(swap.pair).token1.symbol
      newSwap.token0Amount = Math.abs(netToken0)
      newSwap.token1Amount = Math.abs(netToken1)
    } else if (netToken1 < 0) {
      newSwap.token0Symbol = updateNameData(swap.pair).token1.symbol
      newSwap.token1Symbol = updateNameData(swap.pair).token0.symbol
      newSwap.token0Amount = Math.abs(netToken1)
      newSwap.token1Amount = Math.abs(netToken0)
    }

    return {
      date: parseInt(newSwap.transaction.timestamp, 10) * 1000,
      hash: newSwap.transaction.id,
      fiat_amount: newSwap.amountUSD,
      fiat_currency: 'USD',
      token1_amount: newSwap.token0Amount,
      token1_currency: newSwap.token0Symbol,
      token2_amount: newSwap.token1Amount,
      token2_currency: newSwap.token1Symbol,
      type: 'swap',
    }
  })

  const aa = [...mints, ...burns, ...swaps]
    .sort((a, b) => a.date - b.date)
    .map(({ date, ...rest }) => ({ date: new Date(date).toISOString(), ...rest }))

  return aa
}

function createTransactionExport(transactions) {
  const rows = [Object.keys(transactions[0]), ...transactions.map(Object.values)]
  return writeToString(rows)
}

const PrepareDownloadButton = ({ onClick }) => (
  <ButtonDark
    color={'rgba(255, 255, 255, 0.2)'}
    style={{
      padding: '4px 11px',
      borderRadius: '100px',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onClick={onClick}
  >
    <StyledIcon>
      <Download style={{ opacity: 0.4 }} size="18" />
    </StyledIcon>
  </ButtonDark>
)

const PreparingDownloadButton = () => (
  <ButtonDark
    color={'rgba(255, 255, 255, 0.2)'}
    style={{
      padding: '4px 11px',
      borderRadius: '100px',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <StyledIcon>
      <Loader style={{ opacity: 0.4 }} size="18" />
    </StyledIcon>
  </ButtonDark>
)

const PreparedDownloadButton = ({ url }) => (
  <a download="transactions.csv" href={url}>
    <ButtonDark
      color={'rgba(255, 255, 255, 0.2)'}
      style={{
        padding: '4px 11px',
        borderRadius: '100px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StyledIcon>
        <Download style={{ opacity: 0.4 }} size="18" color="#27AE60" />
      </StyledIcon>
    </ButtonDark>
  </a>
)

export const ExportTransactionsButton = ({ transactions }) => {
  const [transactionsPreparing, setTransactionsPreparing] = useState(false)
  const [transactionsBlob, setTransactionsBlob] = useState(undefined)

  const prepareTransactions = () => {
    setTransactionsPreparing(true)
    const preparedTransactions = prepareTransactionsForExport(transactions)
    createTransactionExport(preparedTransactions)
      .then((csv) => {
        const blob = new Blob([csv], { type: 'text/plain' })
        setTransactionsBlob(window.URL.createObjectURL(blob))
        setTransactionsPreparing(false)
      })
      .catch((err) => {
        console.error('Failed to create transaction export', err.stack || err)
        setTransactionsBlob(undefined)
        setTransactionsPreparing(false)
      })
  }

  if (transactionsPreparing) {
    return <PreparingDownloadButton />
  }

  if (transactionsBlob) {
    return <PreparedDownloadButton url={transactionsBlob} />
  }

  return <PrepareDownloadButton onClick={prepareTransactions} />
}
