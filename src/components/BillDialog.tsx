import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { errMsg, get, http } from '../api';
import { dateTime, money } from '../config';
import { useToast } from '../toast';
import { Bill, PAYMENT_LABEL, Payment } from '../types';
import { Loading } from './Loading';

interface Props { orderId: number | null; open: boolean; onClose: () => void; onPaid: () => void }

export default function BillDialog({ orderId, open, onClose, onPaid }: Props) {
  const notify = useToast();
  const [bill, setBill] = useState<Bill | null>(null);
  const [method, setMethod] = useState<Payment>('CARD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || orderId === null) return;
    setBill(null);
    setError(null);
    get<Bill>(`/orders/${orderId}/bill`).then(setBill).catch((e) => setError(errMsg(e)));
  }, [open, orderId]);

  const pay = async () => {
    if (orderId === null) return;
    setBusy(true);
    try {
      await http.post(`/orders/${orderId}/pay`, { method });
      notify(`Addition encaissée (${PAYMENT_LABEL[method].toLowerCase()})`);
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
        {bill && (
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h5" component="p">{money(bill.total)}</Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }} id="pay-label">Mode de paiement</Typography>
            <ToggleButtonGroup exclusive fullWidth value={method} aria-labelledby="pay-label"
                               onChange={(_, v: Payment | null) => v && setMethod(v)} color="primary">
              {(Object.keys(PAYMENT_LABEL) as Payment[]).map((p) => (
                <ToggleButton key={p} value={p} sx={{ minHeight: 48, fontWeight: 700 }}>{PAYMENT_LABEL[p]}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
        <Button variant="contained" onClick={pay} disabled={!bill || busy}>
          Encaisser {bill ? money(bill.total) : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
