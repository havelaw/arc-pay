import { parseUnits, formatUnits } from 'viem'
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useMemo } from 'react'
import arcSplitAbi from './abi/ArcSplit.json'

const ARCSPLIT_ADDRESS = import.meta.env.VITE_ARCSPLIT_ADDRESS
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000'
const USDC_DECIMALS = 6

export const ERC20_ABI = [
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
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export function isContractDeployed() {
  return !!ARCSPLIT_ADDRESS
}

export function useUSDCBalance(address) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isContractDeployed() },
  })
}

export function useCreateSplit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createSplit = (title, totalAmountUSDC, memberCount) => {
    const amount = parseUnits(String(totalAmountUSDC), USDC_DECIMALS)
    writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'createSplit',
      args: [title, amount, memberCount],
    })
  }

  return { createSplit, hash, isPending, isConfirming, isSuccess, error }
}

export function usePayShare() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approveAndPay = async (splitId, amountUSDC) => {
    const amount = parseUnits(String(amountUSDC), USDC_DECIMALS)
    // Step 1: Approve
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ARCSPLIT_ADDRESS, amount],
    })
  }

  const payShare = (splitId) => {
    writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'payShare',
      args: [BigInt(splitId)],
    })
  }

  return { approveAndPay, payShare, hash, isPending, isConfirming, isSuccess, error }
}

export function useGetSplit(splitId) {
  return useReadContract({
    address: ARCSPLIT_ADDRESS,
    abi: arcSplitAbi,
    functionName: 'getSplit',
    args: splitId !== undefined && splitId !== null ? [BigInt(splitId)] : undefined,
    query: { enabled: splitId !== undefined && splitId !== null && isContractDeployed() },
  })
}

export function useSplitCount() {
  return useReadContract({
    address: ARCSPLIT_ADDRESS,
    abi: arcSplitAbi,
    functionName: 'splitCount',
    query: { enabled: isContractDeployed() },
  })
}

export function useAllSplits(userAddress) {
  const { data: countRaw, refetch: refetchCount } = useSplitCount()
  const count = countRaw !== undefined ? Number(countRaw) : 0

  const contracts = useMemo(() => {
    if (!count) return []
    return Array.from({ length: count }, (_, i) => ({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'getSplit',
      args: [BigInt(i)],
    }))
  }, [count])

  const { data: results, refetch: refetchSplits } = useReadContracts({
    contracts,
    query: { enabled: count > 0 && isContractDeployed() },
  })

  const splits = useMemo(() => {
    if (!results) return []
    return results
      .map((r, i) => {
        if (r.status !== 'success') return null
        const [creator, title, totalAmount, perPerson, memberCount, paidCount, settled, createdAt] = r.result
        return {
          id: i,
          creator,
          title,
          totalUSDC: parseFloat(formatUnits(totalAmount, USDC_DECIMALS)),
          perPersonUSDC: parseFloat(formatUnits(perPerson, USDC_DECIMALS)),
          memberCount,
          paidCount,
          settled,
          createdAt: Number(createdAt),
          isMine: userAddress && creator.toLowerCase() === userAddress.toLowerCase(),
        }
      })
      .filter(Boolean)
      .reverse()
  }, [results, userAddress])

  const refetch = () => { refetchCount(); refetchSplits(); }

  return { splits, count, refetch }
}
