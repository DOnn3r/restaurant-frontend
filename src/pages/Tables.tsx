import { Link as RouterLink } from 'react-router-dom';
import { Box, ButtonBase, Button, Chip, Typography } from '@mui/material';
import { get } from '../api';
import { useAuth } from '../auth';
import { money } from '../config';
import EmptyState from '../components/EmptyState';
import { ErrorBanner, Loading } from '../components/Loading';
import PageHeader from '../components/PageHeader';
import { useFetch } from '../hooks';
import { colors } from '../theme';
import { TableView } from '../types';

export default function Tables() {
  const { user } = useAuth();
  const { data, error, loading } = useFetch(() => get<TableView[]>('/tables'), [], 5000);
  const occupied = data?.filter((t) => t.occupied).length ?? 0;

  return (
    <>
      <PageHeader
        title="Service en salle"
        subtitle={data && data.length > 0 ? `${occupied} table${occupied > 1 ? 's' : ''} occupée${occupied > 1 ? 's' : ''} sur ${data.length}` : undefined}
      />
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : data && data.length === 0 ? (
        <EmptyState
          title="Aucune table pour l'instant"
          text={user?.role === 'ADMIN'
            ? 'Créez les tables de votre salle pour pouvoir prendre des commandes.'
            : "L'administrateur doit d'abord créer les tables de la salle."}
          action={user?.role === 'ADMIN' ? <Button variant="contained" component={RouterLink} to="/admin/tables">Créer les tables</Button> : undefined}
        />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
          {data?.map((t) => (
            <ButtonBase
              key={t.id} component={RouterLink} to={`/tables/${t.id}`}
              aria-label={`${t.label}, ${t.occupied ? `occupée, ${money(t.total)}` : 'libre'}${t.readyCount ? `, ${t.readyCount} plat(s) prêt(s)` : ''}`}
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
                textAlign: 'left', minHeight: 140, p: 2, borderRadius: 3, gap: 1,
                bgcolor: t.occupied ? colors.black : '#fff', color: t.occupied ? '#fff' : 'text.primary',
                border: `1px solid ${t.occupied ? colors.black : colors.line}`,
                '&:hover': { borderColor: colors.green },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontFamily: "'Fraunces Variable', serif", fontWeight: 600, fontSize: '1.35rem' }}>{t.label}</Typography>
                <Typography variant="body2" sx={{ color: t.occupied ? 'rgba(255,255,255,.72)' : 'text.secondary' }}>
                  {t.seats} couvert{t.seats > 1 ? 's' : ''}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                {t.occupied ? (
                  <Typography sx={{ fontWeight: 800 }}>{money(t.total)}</Typography>
                ) : (
                  <Chip size="small" label="Libre" sx={{ bgcolor: colors.greenSoft, color: colors.greenDark }} />
                )}
                {t.readyCount > 0 && <Chip size="small" label={`${t.readyCount} à servir`} sx={{ bgcolor: colors.cassis, color: '#fff' }} />}
              </Box>
            </ButtonBase>
          ))}
        </Box>
      )}
    </>
  );
}
