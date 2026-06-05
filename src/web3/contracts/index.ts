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
    ArtFactory:      '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: địa chỉ mainnet sau khi deploy
    BondingCurveAMM: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: địa chỉ mainnet sau khi deploy
  },
  baseSepolia: {
    ArtFactory:      '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: địa chỉ testnet sau khi deploy
    BondingCurveAMM: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: địa chỉ testnet sau khi deploy
  },
} as const

export type SupportedChain = keyof typeof CONTRACT_ADDRESSES
