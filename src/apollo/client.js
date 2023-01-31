import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import { SUBGRAPH_HOST, SUBGRAPH_NAME } from '../constants'

export const client = new ApolloClient({
  link: new HttpLink({
    uri: `${SUBGRAPH_HOST}/subgraphs/name/${SUBGRAPH_NAME}`,
  }),
  cache: new InMemoryCache(),
  shouldBatch: true,
})

export const healthClient = new ApolloClient({
  link: new HttpLink({
    uri: `${SUBGRAPH_HOST}:8030/graphql`,
  }),
  cache: new InMemoryCache(),
  shouldBatch: true,
})

export const blockClient = new ApolloClient({
  link: new HttpLink({
    uri: `${SUBGRAPH_HOST}/subgraphs/name/blocks`,
  }),
  cache: new InMemoryCache(),
})
