export const ArtFactoryAbi = [
  {
    name: 'createArtwork',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [
      { name: 'metadataCID', type: 'string' },
      { name: 'targetCap', type: 'uint256' },
      { name: 'creatorFeeRate', type: 'uint256' },
    ],
    outputs: [
      { name: 'ammClone', type: 'address' },
      { name: 'tokenClone', type: 'address' },
    ],
  },
  {
    name: 'getTotalArtworks',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getArtworkInfo',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'artworkId', type: 'uint256' }],
    outputs: [
      { name: 'amm', type: 'address' },
      { name: 'token', type: 'address' },
    ],
  },
  {
    name: 'getCreatorArtworks',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getDeployedArtworks',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [{ name: 'result', type: 'address[]' }],
  },
  {
    name: 'isArtworkAMM',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'candidate', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // ── Events ─────────────────────────────────────────────────────────
  {
    name: 'ArtworkCreated',
    type: 'event' as const,
    inputs: [
      { name: 'artworkAmm', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'metadataCID', type: 'string', indexed: false },
      { name: 'artworkId', type: 'uint256', indexed: true },
      { name: 'targetCap', type: 'uint256', indexed: false },
    ],
  },
] as const
