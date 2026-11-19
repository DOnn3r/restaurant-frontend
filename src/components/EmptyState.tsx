import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '../theme';

interface Props { title: string; text?: string; action?: ReactNode }

export default function EmptyState({ title, text, action }: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2, border: `1px dashed ${colors.line}`, borderRadius: 3, bgcolor: '#fff' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 1 }}>{title}</Typography>
      {text && <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 460, mx: 'auto' }}>{text}</Typography>}
      {action}
    </Box>
  );
}
