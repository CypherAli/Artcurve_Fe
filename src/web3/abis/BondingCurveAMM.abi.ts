// ABI for BondingCurveAMM contract
// Matches: artcurve-contract/contracts/BondingCurveAMM.sol
export const BondingCurveAMMAbi = [
  // ── Read ──────────────────────────────────────────────────────────
  {
    name: 'getCurrentPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getBuyPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'cost', type: 'uint256' }],
  },
  {
    name: 'getSellPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'proceeds', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ── Write ─────────────────────────────────────────────────────────
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'minTokens', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'sell',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'minEth',      type: 'uint256' },
    ],
    outputs: [],
  },
  // ── Events ─────────────────────────────────────────────────────────
  {
    name: 'Trade',
    type: 'event',
    inputs: [
      { name: 'trader',      type: 'address', indexed: true },
      { name: 'isBuy',       type: 'bool',    indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
      { name: 'ethAmount',   type: 'uint256', indexed: false },
      { name: 'price',       type: 'uint256', indexed: false },
    ],
  },
] as const
