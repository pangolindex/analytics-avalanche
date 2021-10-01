import { writeToString } from '@fast-csv/format'
import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
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

    // TODO: We should really be using a number library because JS is bad at maths.
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

  return [...mints, ...burns, ...swaps]
    .sort((a, b) => a.date - b.date)
    .map(({ date, ...rest }) => ({ date: new Date(date).toISOString(), ...rest }))
}

function createTransactionExport(transactions) {
  const rows = [Object.keys(transactions[0]), ...transactions.map(Object.values)]
  return writeToString(rows)
}

function downloadTransactionExport(fileString) {
  const file = new File([fileString], 'transactions.csv', { type: 'text/plain' })
  const fileUrl = window.URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = fileUrl
  a.download = 'transactions.csv'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    window.URL.revokeObjectURL(fileUrl)
    a.remove()
  }, 0)
}

const DownloadButton = ({ onClick }) => (
  <ButtonDark
    color={'rgba(255, 255, 255, 0.2)'}
    style={{
      // TODO: Replace developer styling with actual designs
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

DownloadButton.propTypes = {
  onClick: PropTypes.func,
}

const LoadingButton = () => (
  <ButtonDark
    color={'rgba(255, 255, 255, 0.2)'}
    style={{
      // TODO: Replace developer styling with actual designs
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
        // TODO: Replace developer styling with actual designs
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

PreparedDownloadButton.propTypes = {
  url: PropTypes.string,
}

const ExportTransactionsButton = ({ transactions }) => {
  const [transactionsPreparing, setTransactionsPreparing] = useState(false)
  const { mints, burns, swaps } = transactions

  const prepareTransactions = () => {
    setTransactionsPreparing(true)
    const preparedTransactions = prepareTransactionsForExport(transactions)
    createTransactionExport(preparedTransactions)
      .then((fileString) => {
        downloadTransactionExport(fileString)
        setTransactionsPreparing(false)
      })
      .catch((err) => {
        console.error('Failed to create transaction export', err.stack || err)
        setTransactionsPreparing(false)
      })
  }

  if (!mints?.length && !burns?.length && !swaps?.length) {
    return null
  }

  if (transactionsPreparing) {
    return <LoadingButton />
  }

  return <DownloadButton onClick={prepareTransactions} />
}

const transactionShape = PropTypes.shape({
  __typename: PropTypes.oneOf(['Burn', 'Mint', 'Swap']),
  amount0: PropTypes.string,
  amount1: PropTypes.string,
  amountUSD: PropTypes.string,
  id: PropTypes.string,
  liquidity: PropTypes.string,
  pair: PropTypes.shape({
    __typename: PropTypes.oneOf(['Pair']),
    id: PropTypes.string,
    token0: PropTypes.shape({
      __typename: PropTypes.oneOf(['Token']),
      symbol: PropTypes.string,
    }),
    token1: PropTypes.shape({
      __typename: PropTypes.oneOf(['Token']),
      symbol: PropTypes.string,
    }),
  }),
  sender: PropTypes.string,
  to: PropTypes.string,
  transaction: PropTypes.shape({
    __typename: PropTypes.oneOf(['Transaction']),
    id: PropTypes.string,
    timestamp: PropTypes.string,
  }),
})

ExportTransactionsButton.propTypes = {
  transactions: PropTypes.shape({
    burns: PropTypes.arrayOf(transactionShape),
    mints: PropTypes.arrayOf(transactionShape),
    swaps: PropTypes.arrayOf(transactionShape),
  }).isRequired,
}

export { ExportTransactionsButton }
