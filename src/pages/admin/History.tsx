import { Fragment, useState } from 'react';
import {
  Box, Card, Chip, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { get } from '../../api';
import { dateTime, money, ymd } from '../../config';
import EmptyState from '../../components/EmptyState';
import { ErrorBanner, Loading } from '../../components/Loading';
import PageHeader from '../../components/PageHeader';
import { useFetch } from '../../hooks';
import { colors } from '../../theme';
import { Order, PAYMENT_LABEL } from '../../types';

export default function History() {
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return ymd(d); });
  const [to, setTo] = useState(() => ymd(new Date()));
  const { data, error, loading } = useFetch(() => get<Order[]>('/orders/history', { from, to }), [from, to]);
  const [open, setOpen] = useState<number | null>(null);
  const total = data?.reduce((s, o) => s + o.netTotal, 0) ?? 0;

  return (
    <>
      <PageHeader title="Historique" subtitle="Toutes les commandes encaissées, avec le détail des plats." />
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        <TextField type="date" label="Du" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="Au" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        {data && <Typography sx={{ ml: { sm: 'auto' } }}>{data.length} commande{data.length > 1 ? 's' : ''} · <strong>{money(total)}</strong></Typography>}
      </Box>
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : data && data.length === 0 ? (
        <EmptyState title="Aucune commande encaissée" text="Changez la période ou encaissez une première addition." />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Encaissée le</TableCell><TableCell>Table</TableCell><TableCell>Serveur</TableCell>
                  <TableCell>Paiement</TableCell><TableCell align="right">Total</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((o) => (
                  <Fragment key={o.id}>
                    <TableRow hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{o.paidAt ? dateTime(o.paidAt) : ''}</TableCell>
                      <TableCell>{o.tableLabel}</TableCell>
                      <TableCell>{o.serverName}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {o.payments.map((p, k) => (
                            <Chip key={k} size="small" sx={{ bgcolor: colors.greenSoft, color: colors.greenDark }}
                                  label={o.payments.length > 1 ? `${PAYMENT_LABEL[p.method]} ${money(p.amount)}` : PAYMENT_LABEL[p.method]} />
                          ))}
                          {o.payments.length === 0 && <Chip size="small" label="Offerte" />}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {money(o.netTotal)}
                        {o.tipAmount > 0 && <Typography variant="caption" component="div" color="text.secondary">+ {money(o.tipAmount)} pourboire</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}
                                    aria-label={`Détail de la commande ${o.tableLabel}`}>
                          <ExpandMoreIcon sx={{ transform: open === o.id ? 'rotate(180deg)' : 'none' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: open === o.id ? undefined : 0 }}>
                        <Collapse in={open === o.id} unmountOnExit>
                          <Box sx={{ py: 1.5 }}>
                            {o.items.map((i) => (
                              <Box key={i.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                                <Typography>{i.quantity} × {i.dishName}{i.note ? ` (${i.note})` : ''}</Typography>
                                <Typography>{money(i.lineTotal)}</Typography>
                              </Box>
                            ))}
                            {o.discountAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                                <Typography color="text.secondary">Remise{o.discountReason ? ` (${o.discountReason})` : ''}</Typography>
                                <Typography color="text.secondary">− {money(o.discountAmount)}</Typography>
                              </Box>
                            )}
                            {o.taxAmount > 0 && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                                <Typography color="text.secondary">dont TVA {o.taxRate} %</Typography>
                                <Typography color="text.secondary">{money(o.taxAmount)}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  );
}
