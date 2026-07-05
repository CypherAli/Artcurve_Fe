// ─────────────────────────────────────────────────────────────────
//  Địa chỉ contract theo chain.
//
//  - baseSepolia: đã deploy bằng Artcurve_Be/contracts/deploy.ps1
//  - base:        điền sau khi deploy mainnet
//  - foundry:     Anvil sandbox local (chain 31337) — địa chỉ DETERMINISTIC:
//                 sandbox.ps1 deploy bằng key Anvil #0 trên chain sạch nên
//                 nonce 0/1/2 luôn cho ra đúng bộ địa chỉ này, không cần đổi.
//
//  Lưu ý: mỗi artwork có BondingCurveAMM clone riêng — địa chỉ đó lấy từ
//  API backend (artwork detail), không nằm ở đây. Đây chỉ là Factory + impl.
// ─────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  base: {
    ArtFactory:      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    BondingCurveAMM: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  baseSepolia: {
    ArtFactory:      '0xBe1F8a192eD168fed99E7F5d479F1A314200F1bF' as `0x${string}`,
    BondingCurveAMM: '0xF8F4233DA0Cc3f6968a239b36010a864c6E9bFb6' as `0x${string}`,
  },
  // Anvil local sandbox — xem Artcurve_Be/docs/SANDBOX.md
  foundry: {
    ArtFactory:      '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
    BondingCurveAMM: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
  },
} as const

export type SupportedChain = keyof typeof CONTRACT_ADDRESSES
