import { APP_NAME, dateTime, money } from './config';
import type { Totals } from './checkout';
import type { Bill, Ticket } from './types';

/** Largeur du papier des tickets (rouleaux thermiques courants). */
export type PaperWidth = 58 | 80;

const STORAGE_KEY = 'ticketWidth';

export function getPaperWidth(): PaperWidth {
  try {
    return localStorage.getItem(STORAGE_KEY) === '58' ? 58 : 80;
  } catch {
    return 80;
  }
}

export function setPaperWidth(w: PaperWidth): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(w));
  } catch {
    // stockage indisponible : on garde la valeur par défaut
  }
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function styles(width: PaperWidth): string {
  return `
    @page { size: ${width}mm auto; margin: 2mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { width: ${width - 4}mm; font-family: 'Courier New', ui-monospace, monospace; font-size: ${width === 58 ? 11 : 13}px;
           line-height: 1.35; color: #000; }
    h1 { font-size: ${width === 58 ? 15 : 18}px; text-align: center; margin: 0 0 2px; }
    .center { text-align: center; }
    .muted { font-size: ${width === 58 ? 10 : 11}px; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 6px; }
    .row .name { flex: 1; min-width: 0; word-break: break-word; }
    .row .amount { white-space: nowrap; }
    .total { font-weight: 700; font-size: ${width === 58 ? 14 : 16}px; }
    .big { font-weight: 700; font-size: ${width === 58 ? 14 : 17}px; }
    .note { font-style: italic; padding-left: 12px; }
  `;
}

/** Imprime un document HTML via un iframe caché (boîte d'impression du navigateur). */
function printHtml(body: string, width: PaperWidth): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const cleanup = () => window.setTimeout(() => iframe.remove(), 1000);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Ticket</title><style>${styles(width)}</style></head><body>${body}</body></html>`);
  doc.close();

  win.addEventListener('afterprint', cleanup);
  // Laisse le temps au navigateur de mettre en page avant d'ouvrir la boîte d'impression.
  window.setTimeout(() => {
    win.focus();
    win.print();
    // Sécurité si « afterprint » n'est jamais déclenché.
    window.setTimeout(() => iframe.remove(), 60_000);
  }, 150);
}

function totalsHtml(bill: Bill, t?: Totals): string {
  const row = (label: string, value: string, cls = '') =>
    `<div class="row ${cls}"><span>${esc(label)}</span><span class="amount">${esc(value)}</span></div>`;
  if (!t || (t.discount === 0 && t.tip === 0 && t.tax === 0)) {
    return row('TOTAL', money(t ? t.due : bill.total), 'total');
  }
  return [
    t.discount > 0 ? row('Sous-total', money(t.subtotal)) : '',
    t.discount > 0 ? row('Remise', `- ${money(t.discount)}`) : '',
    t.tax > 0 ? row(`dont TVA ${bill.taxRate} %`, money(t.tax), 'muted') : '',
    t.tip > 0 ? row('Pourboire', money(t.tip)) : '',
    row('TOTAL À PAYER', money(t.due), 'total'),
  ].join('');
}

/** Addition client. `totals` (remise, TVA, pourboire) est affiché quand il est fourni. */
export function printBill(bill: Bill, width: PaperWidth = getPaperWidth(), totals?: Totals): void {
  const lines = bill.lines
    .map(
      (l) => `<div class="row"><span class="name">${l.quantity} x ${esc(l.name)}</span><span class="amount">${esc(money(l.total))}</span></div>` +
        (l.quantity > 1 ? `<div class="muted note">${esc(money(l.unitPrice))} l'unité</div>` : ''),
    )
    .join('');
  const body = `
    <h1>${esc(APP_NAME)}</h1>
    <div class="center muted">ADDITION</div>
    <div class="sep"></div>
    <div>${esc(bill.tableLabel)}</div>
    <div class="muted">${esc(dateTime(bill.createdAt))} · Serveur : ${esc(bill.serverName)}</div>
    <div class="muted">Commande n° ${bill.orderId}</div>
    <div class="sep"></div>
    ${lines}
    <div class="sep"></div>
    ${totalsHtml(bill, totals)}
    <div class="sep"></div>
    <div class="center muted">Merci de votre visite !</div>
    <div class="center muted">&nbsp;</div>`;
  printHtml(body, width);
}

/** Bon de préparation (plats non encore prêts) pour la cuisine. */
export function printKitchenTicket(ticket: Ticket, width: PaperWidth = getPaperWidth()): void {
  const todo = ticket.items.filter((i) => i.status !== 'READY');
  const items = todo.length > 0 ? todo : ticket.items;
  const lines = items
    .map(
      (i) => `<div class="big">${i.quantity} x ${esc(i.dishName)}</div>` +
        (i.note ? `<div class="note">** ${esc(i.note)} **</div>` : ''),
    )
    .join('<div style="height:4px"></div>');
  const body = `
    <div class="center muted">BON CUISINE</div>
    <h1>${esc(ticket.tableLabel)}</h1>
    <div class="center muted">${esc(dateTime(ticket.createdAt))} · ${esc(ticket.serverName)}</div>
    <div class="sep"></div>
    ${lines}
    <div class="sep"></div>
    <div class="center muted">&nbsp;</div>`;
  printHtml(body, width);
}
