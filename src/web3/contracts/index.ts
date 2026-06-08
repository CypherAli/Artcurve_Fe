// ⚠️  TODO SAU KHI DEPLOY:
//   1. Deploy ArtFactory contract lên Base Sepolia testnet (dùng Hardhat/Foundry)
//   2. Deploy BondingCurveAMM contract lên Base Sepolia testnet
//   3. Copy địa chỉ contract vào baseSepolia bên dưới
//   4. Sau khi ra mainnet, copy địa chỉ vào base
//
//   Lệnh deploy mẫu (Hardhat):
//     npx hardhat run scripts/deploy.ts --network baseSepolia
//
//   Sau khi deploy cũng cần cập nhật src/web3/abis/ArtFactory.abi.ts
//   với ABI từ artifacts/contracts/ArtFactory.sol/ArtFactory.json

export const CONTRACT_ADDRESSES = {
  base: {
    ArtFactory:      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    BondingCurveAMM: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  baseSepolia: {
    ArtFactory:      '0xBe1F8a192eD168fed99E7F5d479F1A314200F1bF' as `0x${string}`,
    BondingCurveAMM: '0xF8F4233DA0Cc3f6968a239b36010a864c6E9bFb6' as `0x${string}`,
  },
} as const

export type SupportedChain = keyof typeof CONTRACT_ADDRESSES
