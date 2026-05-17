import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected, metaMask } from 'wagmi/connectors'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
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
