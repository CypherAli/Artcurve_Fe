// Contract addresses per chain
export const CONTRACT_ADDRESSES = {
  base: {
    ArtFactory:      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    BondingCurveAMM: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  baseSepolia: {
    ArtFactory:      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    BondingCurveAMM: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
} as const

export type SupportedChain = keyof typeof CONTRACT_ADDRESSES
