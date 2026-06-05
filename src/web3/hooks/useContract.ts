'use client'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { BondingCurveAMMAbi } from '@/web3/abis'

/** Buy tokens on the bonding curve */
export function useBuyTokens(artworkContract: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  function buy(ethAmount: bigint, minTokens = 0n) {
    if (!artworkContract) return
    writeContract({
      address:      artworkContract,
      abi:          BondingCurveAMMAbi,
      functionName: 'buy',
      args:         [minTokens],
      value:        ethAmount,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  return { buy, isPending, isConfirming, isSuccess, hash, error }
}

/** Sell tokens on the bonding curve */
export function useSellTokens(artworkContract: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  function sell(tokenAmount: bigint, minEth = 0n) {
    if (!artworkContract) return
    writeContract({
      address:      artworkContract,
      abi:          BondingCurveAMMAbi,
      functionName: 'sell',
      args:         [tokenAmount, minEth],
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  return { sell, isPending, isConfirming, isSuccess, hash, error }
}

/** Get current token price from bonding curve */
export function useTokenPrice(artworkContract: `0x${string}` | undefined) {
  return useReadContract({
    address:      artworkContract,
    abi:          BondingCurveAMMAbi,
    functionName: 'getCurrentPrice',
    query:        { enabled: !!artworkContract, refetchInterval: 5000 },
  })
}

/** Get user's token balance for this artwork */
export function useTokenBalance(artworkContract: `0x${string}` | undefined) {
  const { address } = useAccount()
  const result = useReadContract({
    address:      artworkContract,
    abi:          BondingCurveAMMAbi,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    query:        { enabled: !!artworkContract && !!address, refetchInterval: 10000 },
  })
  const raw = result.data as bigint | undefined
  return {
    ...result,
    formatted: raw !== undefined ? parseFloat(formatEther(raw)) : 0,
  }
}

/** Get user's ETH balance */
export function useEthBalance() {
  const { address } = useAccount()
  const result = useBalance({ address, query: { enabled: !!address, refetchInterval: 10000 } })
  return {
    ...result,
    formatted: result.data ? parseFloat(result.data.formatted) : 0,
  }
}

/** Helper: ETH string → bigint wei */
export const toWei = (eth: string) => {
  try { return parseEther(eth) } catch { return 0n }
}
