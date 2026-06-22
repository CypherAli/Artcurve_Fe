export const BondingCurveAMAbi = [
  // ── Read ──────────────────────────────────────────────────────────
  {
    name: 'getCurrentPrice',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getBuyPrice',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'amountOut', type: 'uint256' }],
    outputs: [{ name: 'cost', type: 'uint256' }],
  },
  {
    name: 'getSellPrice',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'amountIn', type: 'uint256' }],
    outputs: [{ name: 'proceeds', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ── Write ─────────────────────────────────────────────────────────
  {
    name: 'buyShares',
    type: 'function' as const,
    stateMutability: 'payable' as const,
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'maxEthIn', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'sellShares',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'minEthOut', type: 'uint256' },
    ],
    outputs: [],
  },
  // ── Events ─────────────────────────────────────────────────────────
  {
    name: 'Trade',
    type: 'event' as const,
    inputs: [
      { name: 'user',        type: 'address', indexed: true },
      { name: 'artworkId_',  type: 'uint256', indexed: true },
      { name: 'isBuy',       type: 'bool',    indexed: false },
      { name: 'shareAmount', type: 'uint256', indexed: false },
      { name: 'ethAmount',   type: 'uint256', indexed: false },
      { name: 'price',       type: 'uint256', indexed: false },
    ],
  },
] as const

export const BondingCurveAMMAbi = BondingCurveAMAbi
