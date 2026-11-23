import type { Bill, DiscountType, Payment } from './types';

/** Calculs de l'encaissement. Ils reproduisent ceux du serveur (arrondi au demi supérieur) ; le serveur reste l'autorité. */

export interface Totals {
  subtotal: number; // somme des plats
  discount: number; // remise calculée
  net: number;      // après remise, TVA incluse
  tax: number;      // TVA incluse dans « net »
  tip: number;
  due: number;      // net + pourboire : ce que le client règle
}

export interface PayLine { method: Payment; amount: string }

/** Nombre saisi (virgule ou point, espaces ignorés) ; vide ou invalide = 0. */
export function parseAmount(s: string): number {
  const n = Number(s.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function roundTo(n: number, scale: number): number {
  const f = 10 ** scale;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function computeTotals(bill: Bill, type: DiscountType, discountValue: number, tip: number): Totals {
  const scale = bill.moneyScale;
  const subtotal = bill.total;
  let discount = 0;
  if (discountValue > 0) {
    discount = type === 'PERCENT'
      ? roundTo((subtotal * Math.min(discountValue, 100)) / 100, scale)
      : roundTo(discountValue, scale);
  }
  discount = Math.min(discount, subtotal);
  const net = roundTo(subtotal - discount, scale);
  const tax = bill.taxRate > 0 ? roundTo((net * bill.taxRate) / (100 + bill.taxRate), scale) : 0;
  const t = roundTo(tip, scale);
  return { subtotal, discount, net, tax, tip: t, due: roundTo(net + t, scale) };
}

/** Message d'erreur si la remise saisie est invalide, sinon null. */
export function discountError(bill: Bill, type: DiscountType, value: number): string | null {
  if (value <= 0) return null;
  if (type === 'PERCENT' && value > 100) return 'Une remise ne peut pas dépasser 100 %';
  if (type === 'AMOUNT' && value > bill.total) return "La remise dépasse le total de l'addition";
  return null;
}

/**
 * Montant de chaque ligne de paiement : toutes sont saisies, sauf la dernière qui prend « le reste »
 * (ainsi le total des paiements est toujours exactement le montant dû).
 */
export function effectiveAmounts(lines: PayLine[], due: number, scale: number): number[] {
  const out = lines.map((l) => roundTo(parseAmount(l.amount), scale));
  const last = lines.length - 1;
  if (last < 0) return out;
  const others = out.slice(0, last).reduce((s, a) => s + a, 0);
  out[last] = roundTo(due - others, scale);
  return out;
}

/** Paiements valides : rien à régler sans ligne, sinon chaque montant strictement positif. */
export function paymentsValid(amounts: number[], due: number): boolean {
  if (due <= 0) return amounts.length === 0;
  return amounts.length > 0 && amounts.every((a) => a > 0);
}
