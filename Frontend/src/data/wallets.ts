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
  "lm": { dbId: 10, name: "Lemon", initials: "LM", color: "#00D18F" },
  "bb": { dbId: 3, name: "Brubank", initials: "BB", color: "#6842FF" },
  "nx": { dbId: 4, name: "Naranja X", initials: "NX", color: "#FF5E00" },
  "pp": { dbId: 5, name: "Personal Pay", initials: "PP", color: "#00B4E6" },
  "rb": { dbId: 6, name: "Reba", initials: "RB", color: "#00D287" },
  "bl": { dbId: 7, name: "Belo", initials: "BL", color: "#6A2BFE" },
  "cd": { dbId: 8, name: "Cuenta DNI", initials: "CD", color: "#0055A6" },
  "md": { dbId: 9, name: "MODO", initials: "MD", color: "#2B1A66" }
};

const MOCK_BAL: Record<WalletKey, number> = { mp: 3200.5, ua: 1500.0, lm: 7749.75, bb: 0, nx: 0 };
const MOCK_TINT: Record<WalletKey, readonly [string, string]> = {
  mp: gradients.mpTint,
  ua: gradients.uaTint,
  lm: gradients.lmTint,
  bb: gradients.bbTint,
  nx: gradients.nxTint,
};

export const MOCK_WALLETS: Wallet[] = (['mp', 'ua', 'lm', 'bb', 'nx'] as WalletKey[]).map((key) => ({
  key,
  name: WALLET_CATALOG[key].name,
  short: WALLET_CATALOG[key].name,
  bal: MOCK_BAL[key],
  tint: MOCK_TINT[key],
}));

export const WALLETS = MOCK_WALLETS;

export const findWallet = (k: WalletKey, wallets: Wallet[] = MOCK_WALLETS) =>
  wallets.find(w => w.key === k)!;