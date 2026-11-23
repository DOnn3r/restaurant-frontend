import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  InputAdornment, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { errMsg, get, http } from '../api';
import { useAuth } from '../auth';
import {
  PayLine, computeTotals, discountError, effectiveAmounts, parseAmount, paymentsValid, roundTo,
} from '../checkout';
import { dateTime, money } from '../config';
import { getPaperWidth, PaperWidth, printBill, setPaperWidth } from '../print';
import { useToast } from '../toast';
import { Bill, DiscountType, PAYMENT_LABEL, Payment } from '../types';
import { Loading } from './Loading';

interface Props { orderId: number | null; open: boolean; onClose: () => void; onPaid: () => void }

const METHODS = Object.keys(PAYMENT_LABEL) as Payment[];

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.25 }}>
      <Typography color={muted ? 'text.secondary' : undefined} variant={muted ? 'body2' : 'body1'}
                  sx={{ fontWeight: bold ? 700 : undefined }}>{label}</Typography>
      <Typography color={muted ? 'text.secondary' : undefined} variant={muted ? 'body2' : 'body1'}
                  sx={{ fontWeight: bold ? 700 : undefined, whiteSpace: 'nowrap' }}>{value}</Typography>
    </Box>
  );
}

export default function BillDialog({ orderId, open, onClose, onPaid }: Props) {
  const notify = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [bill, setBill] = useState<Bill | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<PaperWidth>(getPaperWidth());

  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT');
  const [discountText, setDiscountText] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [tipText, setTipText] = useState('');
  const [lines, setLines] = useState<PayLine[]>([{ method: 'CASH', amount: '' }]);
  const [receivedText, setReceivedText] = useState('');

  useEffect(() => {
    if (!open || orderId === null) return;
    setBill(null);
    setError(null);
    setDiscountType('PERCENT');
    setDiscountText('');
    setDiscountReason('');
    setTipText('');
    setLines([{ method: 'CASH', amount: '' }]);
    setReceivedText('');
    get<Bill>(`/orders/${orderId}/bill`).then(setBill).catch((e) => setError(errMsg(e)));
  }, [open, orderId]);

  const discountValue = parseAmount(discountText);
  const dError = bill ? discountError(bill, discountType, discountValue) : null;
  const totals = useMemo(
    () => (bill ? computeTotals(bill, discountType, dError ? 0 : discountValue, parseAmount(tipText)) : null),
    [bill, discountType, discountValue, dError, tipText],
  );
  const amounts = useMemo(
    () => (bill && totals ? effectiveAmounts(totals.due > 0 ? lines : [], totals.due, bill.moneyScale) : []),
    [bill, totals, lines],
  );
  const valid = !!totals && !dError && paymentsValid(amounts, totals.due);
  const overflow = !!totals && totals.due > 0 && amounts.length > 0 && amounts[amounts.length - 1] <= 0;

  const cashTotal = lines.reduce((s, l, i) => (l.method === 'CASH' ? s + (amounts[i] ?? 0) : s), 0);
  const received = parseAmount(receivedText);
  const change = bill && received > 0 ? roundTo(received - cashTotal, bill.moneyScale) : 0;

  const setLine = (i: number, patch: Partial<PayLine>) =>
    setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const addLine = () => {
    if (!totals || !bill) return;
    // La ligne qui était « le reste » devient une ligne saisie, pré-remplie avec son montant actuel.
    setLines((ls) => {
      const current = effectiveAmounts(ls, totals.due, bill.moneyScale);
      const last = ls.length - 1;
      const next = ls.map((l, k) => (k === last ? { ...l, amount: String(current[last]) } : l));
      return [...next, { method: 'CARD', amount: '' }];
    });
  };

  const pay = async () => {
    if (orderId === null || !totals || !valid) return;
    setBusy(true);
    try {
      await http.post(`/orders/${orderId}/pay`, {
        discount: isAdmin && discountValue > 0
          ? { type: discountType, value: discountValue, reason: discountReason.trim() || null }
          : null,
        tip: totals.tip > 0 ? totals.tip : null,
        payments: totals.due > 0 ? lines.map((l, i) => ({ method: l.method, amount: amounts[i] })) : [],
      });
      const used = [...new Set(lines.map((l) => PAYMENT_LABEL[l.method].toLowerCase()))].join(' + ');
      notify(totals.due > 0 ? `Addition encaissée (${used})` : 'Addition clôturée (offerte)');
      onPaid();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Addition{bill ? ` · ${bill.tableLabel}` : ''}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!bill && !error && <Loading />}
        {bill && totals && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ouverte le {dateTime(bill.createdAt)} · Serveur : {bill.serverName}
            </Typography>
            {bill.unservedCount > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {bill.unservedCount} plat{bill.unservedCount > 1 ? 's' : ''} pas encore servi{bill.unservedCount > 1 ? 's' : ''}.
              </Alert>
            )}
            {bill.lines.map((l) => (
              <Box key={`${l.name}-${l.unitPrice}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
                <Typography>{l.quantity} × {l.name}</Typography>
                <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{money(l.total)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />

            {isAdmin && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }} id="discount-label">Remise (facultatif)</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <ToggleButtonGroup exclusive size="small" value={discountType} aria-labelledby="discount-label"
                                     onChange={(_, v: DiscountType | null) => v && setDiscountType(v)}>
                    <ToggleButton value="PERCENT" sx={{ px: 1.5, minHeight: 40 }}>%</ToggleButton>
                    <ToggleButton value="AMOUNT" sx={{ px: 1.5, minHeight: 40 }}>Montant</ToggleButton>
                  </ToggleButtonGroup>
                  <TextField size="small" value={discountText} onChange={(e) => setDiscountText(e.target.value)}
                             inputProps={{ inputMode: 'decimal', 'aria-label': 'Valeur de la remise' }}
                             error={!!dError} helperText={dError ?? undefined} sx={{ flexGrow: 1 }}
                             InputProps={discountType === 'PERCENT' ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : undefined} />
                </Box>
                {discountValue > 0 && (
                  <TextField size="small" fullWidth label="Motif (facultatif)" value={discountReason}
                             onChange={(e) => setDiscountReason(e.target.value)} inputProps={{ maxLength: 120 }} sx={{ mt: 1 }} />
                )}
              </Box>
            )}

            <TextField size="small" fullWidth label="Pourboire (facultatif)" value={tipText}
                       onChange={(e) => setTipText(e.target.value)} inputProps={{ inputMode: 'decimal' }} sx={{ mb: 2 }} />

            {(totals.discount > 0 || totals.tip > 0 || totals.tax > 0) && (
              <Box sx={{ mb: 1 }}>
                {totals.discount > 0 && <Row label="Sous-total" value={money(totals.subtotal)} muted />}
                {totals.discount > 0 && <Row label="Remise" value={`− ${money(totals.discount)}`} muted />}
                {totals.tax > 0 && <Row label={`dont TVA ${bill.taxRate} %`} value={money(totals.tax)} muted />}
                {totals.tip > 0 && <Row label="Pourboire" value={`+ ${money(totals.tip)}`} muted />}
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3 }}>
              <Typography variant="h6">À payer</Typography>
              <Typography variant="h5" component="p">{money(totals.due)}</Typography>
            </Box>

            {totals.due > 0 ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  {lines.length > 1 ? 'Paiements' : 'Mode de paiement'}
                </Typography>
                {lines.map((l, i) => {
                  const isLast = i === lines.length - 1;
                  return (
                    <Box key={i} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }} role="group"
                           aria-label={`Moyen de paiement ${i + 1}`}>
                        {METHODS.map((m) => (
                          <ToggleButton key={m} value={m} selected={l.method === m} size="small" color="primary"
                                        onChange={() => setLine(i, { method: m })}
                                        sx={{ minHeight: 44, fontWeight: 700, px: 0.5, lineHeight: 1.1 }}>
                            {PAYMENT_LABEL[m]}
                          </ToggleButton>
                        ))}
                      </Box>
                      {lines.length > 1 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          {isLast ? (
                            <Typography sx={{ flexGrow: 1 }}>
                              Reste : <strong>{money(Math.max(amounts[i] ?? 0, 0))}</strong>
                            </Typography>
                          ) : (
                            <TextField size="small" label="Montant" value={l.amount} sx={{ flexGrow: 1 }}
                                       onChange={(e) => setLine(i, { amount: e.target.value })}
                                       inputProps={{ inputMode: 'decimal' }} />
                          )}
                          <IconButton aria-label={`Retirer le paiement ${i + 1}`}
                                      onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  );
                })}
                {overflow && <Alert severity="warning" sx={{ mb: 2 }}>Les montants saisis dépassent le total à payer.</Alert>}
                {lines.length < METHODS.length && (
                  <Button size="small" startIcon={<AddIcon />} onClick={addLine} sx={{ mb: 2 }}>
                    Payer avec un autre moyen
                  </Button>
                )}
                {cashTotal > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <TextField size="small" fullWidth label="Espèces reçues (facultatif)" value={receivedText}
                               onChange={(e) => setReceivedText(e.target.value)} inputProps={{ inputMode: 'decimal' }} />
                    {received > 0 && (
                      <Typography sx={{ mt: 1, fontWeight: 700 }} color={change < 0 ? 'error' : undefined}>
                        {change < 0 ? `Il manque ${money(-change)}` : `À rendre : ${money(change)}`}
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>Rien à payer : l'addition sera clôturée comme offerte.</Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => printBill(bill, paper, totals)}>
                Imprimer l'addition
              </Button>
              <ToggleButtonGroup exclusive size="small" value={paper} aria-label="Largeur du papier"
                                 onChange={(_, v: PaperWidth | null) => { if (v) { setPaper(v); setPaperWidth(v); } }}>
                <ToggleButton value={58} sx={{ px: 1.5 }}>58 mm</ToggleButton>
                <ToggleButton value={80} sx={{ px: 1.5 }}>80 mm</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
        <Button variant="contained" onClick={pay} disabled={!bill || !valid || busy}>
          {totals && totals.due === 0 ? 'Clôturer' : `Encaisser ${totals ? money(totals.due) : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
