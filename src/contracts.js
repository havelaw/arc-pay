import { parseUnits, formatUnits, keccak256, toBytes, toHex } from 'viem'
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

export function generateSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toHex(bytes)
}

export function hashSecret(secret) {
  return keccak256(toBytes(secret))
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

  const createSplit = (title, totalAmountUSDC, memberCount, secretHash) => {
    const amount = parseUnits(String(totalAmountUSDC), USDC_DECIMALS)
    writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'createSplit',
      args: [title, amount, memberCount, secretHash],
    })
  }

  return { createSplit, hash, isPending, isConfirming, isSuccess, error }
}

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = (amountUSDC) => {
    const amount = parseUnits(String(amountUSDC), USDC_DECIMALS)
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ARCSPLIT_ADDRESS, amount],
    })
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error }
}

export function usePayShare() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const payShare = (splitId, secret) => {
    writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'payShare',
      args: [BigInt(splitId), secret],
    })
  }

  return { payShare, hash, isPending, isConfirming, isSuccess, error }
}

export function useClaim() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = (splitId) => {
    writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'claim',
      args: [BigInt(splitId)],
    })
  }

  return { claim, hash, isPending, isConfirming, isSuccess, error }
}

export function useCancelSplit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancelSplit = (splitId) => {
    writeContract({
      address: ARCSPLIT_ADDRESS,
      abi: arcSplitAbi,
      functionName: 'cancelSplit',
      args: [BigInt(splitId)],
    })
  }

  return { cancelSplit, hash, isPending, isConfirming, isSuccess, error }
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

export function useHasPaid(splitId, userAddress) {
  return useReadContract({
    address: ARCSPLIT_ADDRESS,
    abi: arcSplitAbi,
    functionName: 'hasPaid',
    args: splitId !== undefined && splitId !== null && userAddress
      ? [BigInt(splitId), userAddress] : undefined,
    query: {
      enabled: splitId !== undefined && splitId !== null && !!userAddress && isContractDeployed(),
    },
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
        const [creator, title, totalAmount, perPerson, memberCount, paidCount, settled, createdAt, secretHash, claimable, claimed] = r.result
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
          claimableUSDC: parseFloat(formatUnits(claimable, USDC_DECIMALS)),
          claimedUSDC: parseFloat(formatUnits(claimed, USDC_DECIMALS)),
        }
      })
      .filter(Boolean)
      .reverse()
  }, [results, userAddress])

  const refetch = () => { refetchCount(); refetchSplits(); }

  return { splits, count, refetch }
}
