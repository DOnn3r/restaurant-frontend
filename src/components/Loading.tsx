import { Alert, Box, CircularProgress } from '@mui/material';

export function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }} role="status" aria-label="Chargement">
      <CircularProgress />
    </Box>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  return message ? <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert> : null;
}
