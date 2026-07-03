import { gradients } from '@/theme/tokens';

export type WalletKey = 'mp' | 'ua' | 'lm' | 'bb' | 'nx';

export type Wallet = {
  key: WalletKey;
  name: string;
  short: string;
  bal: number;
  tint: readonly [string, string];
  cuentaId?: number;
};

// Catálogo indexado por la sigla que envía Fabri desde la lista
export const WALLET_CATALOG: Record<string, { dbId: number; name: string; initials: string; color: string }> = {
  "mp": { dbId: 1, name: "Mercado Pago", initials: "MP", color: "#009EE3" },
  "ua": { dbId: 2, name: "Ualá", initials: "UA", color: "#FF3366" },
  "bb": { dbId: 3, name: "Brubank", initials: "BB", color: "#6842FF" },
  "nx": { dbId: 4, name: "Naranja X", initials: "NX", color: "#FF5E00" },
  "pp": { dbId: 5, name: "Personal Pay", initials: "PP", color: "#00B4E6" },
  "rb": { dbId: 6, name: "Reba", initials: "RB", color: "#00D287" },
  "bl": { dbId: 7, name: "Belo", initials: "BL", color: "#6A2BFE" },
  "cd": { dbId: 8, name: "Cuenta DNI", initials: "CD", color: "#0055A6" },
  "md": { dbId: 9, name: "MODO", initials: "MD", color: "#2B1A66" }
};

export const MOCK_WALLETS: Wallet[] = [
  { key: 'mp', name: 'Mercado Pago', short: 'Mercado Pago', bal: 3200.5, tint: gradients.mpTint },
  { key: 'ua', name: 'Ualá', short: 'Ualá', bal: 1500.0, tint: gradients.uaTint },
  { key: 'lm', name: 'Lemon', short: 'Lemon', bal: 7749.75, tint: gradients.lmTint },
];

export const WALLETS = MOCK_WALLETS;

export const findWallet = (k: WalletKey, wallets: Wallet[] = MOCK_WALLETS) =>
  wallets.find(w => w.key === k)!;