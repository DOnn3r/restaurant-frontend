import { Chip } from '@mui/material';
import { colors } from '../theme';
import { ItemStatus } from '../types';

const MAP: Record<ItemStatus, { label: string; sx: object }> = {
  PENDING: { label: 'En attente', sx: { bgcolor: '#fff', border: `1px solid ${colors.line}`, color: colors.muted } },
  PREPARING: { label: 'En préparation', sx: { bgcolor: colors.greenSoft, color: colors.greenDark } },
  READY: { label: 'Prêt', sx: { bgcolor: colors.cassis, color: '#fff' } },
  SERVED: { label: 'Servi', sx: { bgcolor: '#ECEEEC', color: colors.muted } },
};

export default function StatusChip({ status }: { status: ItemStatus }) {
  const { label, sx } = MAP[status];
  return <Chip size="small" label={label} sx={sx} />;
}
