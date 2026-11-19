import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Card, Chip, IconButton, Typography } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { errMsg, get, http } from '../api';
import EmptyState from '../components/EmptyState';
import { ErrorBanner, Loading } from '../components/Loading';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import { useFetch } from '../hooks';
import { useToast } from '../toast';
import { colors } from '../theme';
import { ItemStatus, Ticket } from '../types';

const LATE_MINUTES = 15;

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // audio indisponible : on ignore
  }
}

export default function Kitchen() {
  const notify = useToast();
  const { data, error, loading, reload } = useFetch(() => get<Ticket[]>('/kitchen/tickets'), [], 5000);
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(true);
  const known = useRef<Set<number> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Bip quand un nouveau plat en attente apparaît (pas au premier chargement).
  useEffect(() => {
    if (!data) return;
    const pending = new Set(data.flatMap((t) => t.items.filter((i) => i.status === 'PENDING').map((i) => i.id)));
    if (known.current && sound && [...pending].some((id) => !known.current!.has(id))) beep();
    known.current = pending;
  }, [data, sound]);

  const setStatus = async (ids: number[], status: ItemStatus) => {
    try {
      await Promise.all(ids.map((id) => http.patch(`/kitchen/items/${id}/status`, { status })));
      await reload();
    } catch (e) {
      notify(errMsg(e), 'error');
      await reload();
    }
  };

  const tickets = useMemo(() => {
    const active = (t: Ticket) => t.items.some((i) => i.status !== 'READY');
    return [...(data ?? [])].sort((a, b) => Number(active(b)) - Number(active(a)) || a.createdAt.localeCompare(b.createdAt));
  }, [data]);

  const inProgress = tickets.filter((t) => t.items.some((i) => i.status !== 'READY')).length;

  return (
    <>
      <PageHeader
        title="Cuisine"
        subtitle={data ? `${inProgress} bon${inProgress > 1 ? 's' : ''} en cours` : undefined}
        actions={
          <IconButton onClick={() => setSound((s) => !s)} aria-pressed={sound}
                      aria-label={sound ? 'Désactiver le bip des nouvelles commandes' : 'Activer le bip des nouvelles commandes'}
                      sx={{ border: `1px solid ${colors.line}`, bgcolor: '#fff' }}>
            {sound ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        }
      />
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : tickets.length === 0 ? (
        <EmptyState title="Aucune commande en cours" text="Les nouvelles commandes apparaissent ici automatiquement." />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', alignItems: 'start' }}>
          {tickets.map((t) => {
            const open = t.items.filter((i) => i.status !== 'READY');
            const allReady = open.length === 0;
            const oldest = Math.min(...(open.length ? open : t.items).map((i) => new Date(i.createdAt).getTime()));
            const minutes = Math.max(0, Math.floor((now - oldest) / 60000));
            const late = !allReady && minutes >= LATE_MINUTES;
            const pendingIds = t.items.filter((i) => i.status === 'PENDING').map((i) => i.id);
            const preparingIds = t.items.filter((i) => i.status === 'PREPARING').map((i) => i.id);
            return (
              <Card key={t.orderId} sx={{ p: 2, borderTop: `6px solid ${allReady ? colors.line : late ? colors.cassis : colors.green}`, opacity: allReady ? 0.75 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="h5" component="h2">{t.tableLabel}</Typography>
                    <Typography variant="body2" color="text.secondary">Serveur : {t.serverName}</Typography>
                  </Box>
                  <Chip label={allReady ? 'À servir' : `${minutes} min`}
                        sx={late ? { bgcolor: colors.cassis, color: '#fff' } : allReady ? { bgcolor: colors.cassisSoft, color: colors.cassis } : { bgcolor: colors.greenSoft, color: colors.greenDark }} />
                </Box>

                {t.items.map((i) => (
                  <Box key={i.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderTop: `1px solid ${colors.line}` }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>{i.quantity} × {i.dishName}</Typography>
                      {i.note && <Typography variant="body2" sx={{ fontStyle: 'italic', color: colors.cassis, fontWeight: 600 }}>{i.note}</Typography>}
                    </Box>
                    {i.status === 'PENDING' && (
                      <Button variant="outlined" onClick={() => setStatus([i.id], 'PREPARING')} aria-label={`Lancer ${i.dishName}`}>Lancer</Button>
                    )}
                    {i.status === 'PREPARING' && (
                      <Button variant="contained" onClick={() => setStatus([i.id], 'READY')} aria-label={`${i.dishName} est prêt`}>Prêt</Button>
                    )}
                    {i.status === 'READY' && <StatusChip status="READY" />}
                  </Box>
                ))}

                {(pendingIds.length > 1 || (pendingIds.length === 0 && preparingIds.length > 1) || (pendingIds.length > 0 && preparingIds.length > 0)) && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {pendingIds.length > 0 && (
                      <Button variant="outlined" fullWidth onClick={() => setStatus(pendingIds, 'PREPARING')}>Tout lancer</Button>
                    )}
                    {preparingIds.length > 0 && (
                      <Button variant="contained" fullWidth onClick={() => setStatus(preparingIds, 'READY')}>Tout est prêt</Button>
                    )}
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}
    </>
  );
}
