import { useState } from 'react';
import { Box, Card, Chip, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get } from '../../api';
import { money, moneyCompact, shortDate, ymd } from '../../config';
import EmptyState from '../../components/EmptyState';
import { ErrorBanner, Loading } from '../../components/Loading';
import PageHeader from '../../components/PageHeader';
import { useFetch } from '../../hooks';
import { colors } from '../../theme';
import { PAYMENT_LABEL, Stats } from '../../types';

type Preset = 'today' | '7d' | 'month' | 'custom';

function rangeFor(p: Exclude<Preset, 'custom'>): [string, string] {
  const end = new Date();
  const start = new Date();
  if (p === '7d') start.setDate(end.getDate() - 6);
  if (p === 'month') start.setDate(1);
  return [ymd(start), ymd(end)];
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: 'green' | 'black' | 'white' }) {
  const dark = tone !== 'white';
  return (
    <Card sx={{
      p: 2.5, bgcolor: tone === 'green' ? colors.green : tone === 'black' ? colors.black : '#fff',
      color: dark ? '#fff' : 'text.primary', borderColor: dark ? 'transparent' : colors.line,
    }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: dark ? 'rgba(255,255,255,.8)' : 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontFamily: "'Fraunces Variable', serif", fontWeight: 600, fontSize: '2rem', lineHeight: 1.2, mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="body2" sx={{ mt: 0.5, color: dark ? 'rgba(255,255,255,.8)' : 'text.secondary' }}>{hint}</Typography>}
    </Card>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; display: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      {rows.map((r) => (
        <Box key={r.label}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{r.label}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{r.display}</Typography>
          </Box>
          <Box sx={{ height: 8, bgcolor: colors.greenSoft, borderRadius: 4 }}>
            <Box sx={{ height: 8, width: `${(r.value / max) * 100}%`, bgcolor: colors.green, borderRadius: 4 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function Dashboard() {
  const [preset, setPreset] = useState<Preset>('today');
  const [[from, to], setRange] = useState<[string, string]>(rangeFor('today'));
  const { data, error, loading } = useFetch(() => get<Stats>('/stats', { from, to }), [from, to], 30000);

  const choose = (p: Preset | null) => {
    if (!p) return;
    setPreset(p);
    if (p !== 'custom') setRange(rangeFor(p));
  };

  const chartData = data?.days.map((d) => ({ label: shortDate(d.date), Ventes: d.revenue, Dépenses: d.expenses })) ?? [];

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Chiffre d'affaires, dépenses et bénéfice sur la période choisie." />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <ToggleButtonGroup exclusive value={preset} onChange={(_, v: Preset | null) => choose(v)} color="primary" aria-label="Période">
          <ToggleButton value="today" sx={{ minHeight: 44 }}>Aujourd'hui</ToggleButton>
          <ToggleButton value="7d" sx={{ minHeight: 44 }}>7 jours</ToggleButton>
          <ToggleButton value="month" sx={{ minHeight: 44 }}>Ce mois</ToggleButton>
          <ToggleButton value="custom" sx={{ minHeight: 44 }}>Personnalisé</ToggleButton>
        </ToggleButtonGroup>
        </Box>
        {preset === 'custom' && (
          <>
            <TextField type="date" label="Du" value={from} onChange={(e) => setRange([e.target.value, to])} InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="Au" value={to} onChange={(e) => setRange([from, e.target.value])} InputLabelProps={{ shrink: true }} />
          </>
        )}
      </Box>

      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : data && (
        <>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, mb: 3 }}>
            <Kpi tone="green" label="Chiffre d'affaires" value={money(data.revenue)} />
            <Kpi tone="white" label="Dépenses" value={money(data.expenses)} />
            <Kpi tone="black" label="Bénéfice" value={money(data.profit)} hint={data.profit < 0 ? 'Les dépenses dépassent les ventes' : 'Ventes moins dépenses'} />
            <Kpi tone="white" label="Commandes encaissées" value={String(data.orders)} hint={data.orders > 0 ? `Ticket moyen : ${money(data.averageTicket)}` : undefined} />
          </Box>

          {data.orders === 0 && data.expenses === 0 ? (
            <EmptyState title="Rien à afficher sur cette période" text="Les chiffres apparaîtront dès qu'une commande sera encaissée ou qu'une dépense sera saisie." />
          ) : (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'start' }}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Ventes et dépenses par jour</Typography>
                <Box sx={{ width: '100%', height: 300 }} role="img" aria-label="Graphique des ventes et des dépenses par jour">
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.line} />
                      <XAxis dataKey="label" tick={{ fill: colors.muted, fontSize: 12 }} />
                      <YAxis tick={{ fill: colors.muted, fontSize: 12 }} width={52} tickFormatter={(v: number) => moneyCompact(v)} />
                      <Tooltip formatter={(v: number) => money(v)} />
                      <Legend />
                      <Bar dataKey="Ventes" fill={colors.green} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Dépenses" fill={colors.cassis} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>

              <Box sx={{ display: 'grid', gap: 3 }}>
                <Card sx={{ p: 2.5 }}>
                  <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Plats les plus vendus</Typography>
                  {data.topDishes.length === 0 ? <Typography color="text.secondary">Aucune vente.</Typography> : (
                    <Bars rows={data.topDishes.map((d) => ({ label: d.name, value: d.quantity, display: `${d.quantity} · ${money(d.revenue)}` }))} />
                  )}
                </Card>
                <Card sx={{ p: 2.5 }}>
                  <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Encaissements</Typography>
                  {data.payments.length === 0 ? <Typography color="text.secondary">Aucun encaissement.</Typography> : (
                    data.payments.map((p) => (
                      <Box key={p.method} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography>{PAYMENT_LABEL[p.method]}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{money(p.amount)}</Typography>
                      </Box>
                    ))
                  )}
                </Card>
                <Card sx={{ p: 2.5 }}>
                  <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Dépenses par catégorie</Typography>
                  {data.expensesByCategory.length === 0 ? <Typography color="text.secondary">Aucune dépense.</Typography> : (
                    data.expensesByCategory.map((c) => (
                      <Box key={c.category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Chip size="small" label={c.category} sx={{ bgcolor: colors.cassisSoft, color: colors.cassis }} />
                        <Typography sx={{ fontWeight: 700 }}>{money(c.amount)}</Typography>
                      </Box>
                    ))
                  )}
                </Card>
              </Box>
            </Box>
          )}
        </>
      )}
    </>
  );
}
