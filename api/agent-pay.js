import { createPublicClient, createWalletClient, http, parseUnits, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
};

const ARCSPLIT_ADDRESS = process.env.VITE_ARCSPLIT_ADDRESS;
const USDC_ADDRESS = process.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000';

const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const ARCSPLIT_ABI = [
  {
    inputs: [{ name: '_splitId', type: 'uint256' }, { name: '_secret', type: 'bytes32' }],
    name: 'payShare',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_splitId', type: 'uint256' }],
    name: 'getSplit',
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'title', type: 'string' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'perPerson', type: 'uint256' },
      { name: 'memberCount', type: 'uint8' },
      { name: 'paidCount', type: 'uint8' },
      { name: 'settled', type: 'bool' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'secretHash', type: 'bytes32' },
      { name: 'claimable', type: 'uint256' },
      { name: 'claimed', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }],
    name: 'hasPaid',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const MAX_AUTOPAY_USDC = 50;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestLog = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entries = requestLog.get(ip) || [];
  const recent = entries.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every(t => now - t > RATE_LIMIT_WINDOW)) requestLog.delete(key);
    }
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'ArcSplit Agent Auto-Pay',
      description: 'AI Agent automatically pays your share in a split using a server-side wallet',
      how: 'POST with splitId and secret. The agent wallet will approve USDC and call payShare.',
      maxAutoPayUSDC: MAX_AUTOPAY_USDC,
      network: 'Arc Testnet (5042002)',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  const agentKey = process.env.AGENT_WALLET_PRIVATE_KEY;
  if (!agentKey) {
    return res.status(500).json({ error: 'Agent wallet not configured' });
  }

  const { splitId, secret } = req.body || {};
  if (splitId === undefined || splitId === null || !secret) {
    return res.status(400).json({ error: 'splitId and secret are required' });
  }

  try {
    const account = privateKeyToAccount(agentKey.startsWith('0x') ? agentKey : `0x${agentKey}`);
    const publicClient = createPublicClient({ chain: ARC_TESTNET, transport: http() });
    const walletClient = createWalletClient({ account, chain: ARC_TESTNET, transport: http() });

    const splitData = await publicClient.readContract({
      address: ARCSPLIT_ADDRESS,
      abi: ARCSPLIT_ABI,
      functionName: 'getSplit',
      args: [BigInt(splitId)],
    });

    const [creator, title, , perPerson, memberCount, paidCount, settled] = splitData;

    if (settled) {
      return res.status(400).json({ error: 'Split is already settled' });
    }

    if (creator.toLowerCase() === account.address.toLowerCase()) {
      return res.status(400).json({ error: 'Agent wallet is the creator of this split' });
    }

    const alreadyPaid = await publicClient.readContract({
      address: ARCSPLIT_ADDRESS,
      abi: ARCSPLIT_ABI,
      functionName: 'hasPaid',
      args: [BigInt(splitId), account.address],
    });

    if (alreadyPaid) {
      return res.status(400).json({ error: 'Agent wallet already paid this split' });
    }

    const perPersonUSDC = Number(perPerson) / 1e6;
    if (perPersonUSDC > MAX_AUTOPAY_USDC) {
      return res.status(400).json({
        error: `Amount $${perPersonUSDC.toFixed(2)} exceeds auto-pay limit of $${MAX_AUTOPAY_USDC}`,
        perPersonUSDC,
        limit: MAX_AUTOPAY_USDC,
      });
    }

    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    if (balance < perPerson) {
      return res.status(400).json({
        error: 'Insufficient agent wallet balance',
        balance: (Number(balance) / 1e6).toFixed(2),
        required: perPersonUSDC.toFixed(2),
      });
    }

    const approveTx = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ARCSPLIT_ADDRESS, perPerson],
    });

    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    const payTx = await walletClient.writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: ARCSPLIT_ABI,
      functionName: 'payShare',
      args: [BigInt(splitId), secret],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: payTx });

    return res.status(200).json({
      success: true,
      splitId: Number(splitId),
      title,
      amountUSDC: perPersonUSDC.toFixed(2),
      agentWallet: account.address,
      approveTx,
      payTx,
      blockNumber: Number(receipt.blockNumber),
      paidCount: paidCount + 1,
      memberCount,
    });
  } catch (err) {
    console.error('Agent pay error:', err);
    return res.status(500).json({ error: `Agent payment failed: ${err.message}` });
  }
}
