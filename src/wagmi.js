import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected, metaMask } from 'wagmi/connectors'

export const arcTestnet = defineChain({
  id: 40404,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.arc.circle.com'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer-testnet.arc.circle.com' },
  },
  testnet: true,
})

export const walletOptions = [
  { id: 'metaMask', name: 'MetaMask', icon: '🦊' },
  { id: 'rabby', name: 'Rabby', icon: '🐰' },
  { id: 'okx', name: 'OKX Wallet', icon: '⭕' },
]

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask(),
    injected({
      target: () => ({
        id: 'rabby',
        name: 'Rabby Wallet',
        provider: typeof window !== 'undefined' ? window.rabby : undefined,
      }),
    }),
    injected({
      target: () => ({
        id: 'okx',
        name: 'OKX Wallet',
        provider: typeof window !== 'undefined' ? window.okxwallet : undefined,
      }),
    }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
})
