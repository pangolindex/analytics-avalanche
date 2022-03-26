interface BasicData {
  token0?: {
    id: string
    name: string
    symbol: string
  }
  token1?: {
    id: string
    name: string
    symbol: string
  }
}

// Override data return from graph - usually because proxy token has changed
// names since entity was created in subgraph
// keys are lowercase token addresses <--------
const TOKEN_OVERRIDES: { [address: string]: { name: string; symbol: string } } = {
  '0x4ec58f9d205f9c919920313932cc71ec68d123c7': {
    name: 'Splash Token',
    symbol: 'SPLASH',
  },
  '0xbc6f589171d6d66eb44ebcc92dffb570db4208da': {
    name: 'Wave Token',
    symbol: 'WAVE',
  },
}
const TOKEN_SET: Set<string> = new Set(Object.keys(TOKEN_OVERRIDES))

// override tokens with incorrect symbol or names
export function updateNameData(data: BasicData): BasicData | undefined {
  if (data?.token0?.id && TOKEN_SET.has(data.token0.id)) {
    data.token0.name = TOKEN_OVERRIDES[data.token0.id].name
    data.token0.symbol = TOKEN_OVERRIDES[data.token0.id].symbol
  }

  if (data?.token1?.id && TOKEN_SET.has(data.token1.id)) {
    data.token1.name = TOKEN_OVERRIDES[data.token1.id].name
    data.token1.symbol = TOKEN_OVERRIDES[data.token1.id].symbol
  }

  return data
}
