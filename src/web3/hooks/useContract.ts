'use client'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { BondingCurveAMMAbi } from '@/web3/abis'

/** Buy tokens on the bonding curve */
export function useBuyTokens(artworkContract: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending } = useWriteContract()

  function buy(ethAmount: bigint) {
    if (!artworkContract) return
    writeContract({
      address: artworkContract,
      abi:     BondingCurveAMMAbi,
      functionName: 'buy',
      value:   ethAmount,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  return { buy, isPending, isConfirming, isSuccess, hash }
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
