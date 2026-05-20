import { createPublicClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
};

const USDC_ADDRESS = process.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const agentKey = process.env.AGENT_WALLET_PRIVATE_KEY;
  if (!agentKey) {
    return res.status(200).json({ configured: false });
  }

  try {
    const account = privateKeyToAccount(agentKey.startsWith('0x') ? agentKey : `0x${agentKey}`);
    const publicClient = createPublicClient({ chain: ARC_TESTNET, transport: http() });

    const [erc20Balance, nativeBalance] = await Promise.all([
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      }),
      publicClient.getBalance({ address: account.address }),
    ]);

    return res.status(200).json({
      configured: true,
      address: account.address,
      balanceUSDC: (Number(erc20Balance) / 1e6).toFixed(2),
      nativeBalance: parseFloat(formatUnits(nativeBalance, 18)).toFixed(4),
      network: 'Arc Testnet',
    });
  } catch (err) {
    return res.status(500).json({ configured: true, error: err.message });
  }
}
