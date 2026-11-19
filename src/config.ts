import type { Role } from './types';

/** Nom affiché par défaut (connexion, serveurs, cuisiniers). */
export const APP_NAME = "Ô'Délice";
/** Nom affiché pour l'administrateur. */
export const APP_NAME_ADMIN = "Ô'Délice gestion";

export const appNameFor = (role?: Role | null): string => (role === 'ADMIN' ? APP_NAME_ADMIN : APP_NAME);

// Devise : définie à la construction via VITE_CURRENCY (voir CURRENCY dans .env)
export const CURRENCY: string = import.meta.env.VITE_CURRENCY || 'MGA';

const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: CURRENCY });
const plain = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/** Ariary : pas de centimes, symbole « Ar » (Intl afficherait « MGA »). */
export const money = (n: number): string => (CURRENCY === 'MGA' ? `${plain.format(Math.round(n))} Ar` : formatter.format(n));
export const moneyCompact = (n: number): string => compact.format(n);

export const dateTime = (iso: string): string =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const shortDate = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

/** yyyy-mm-dd en heure locale (et non UTC). */
export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;