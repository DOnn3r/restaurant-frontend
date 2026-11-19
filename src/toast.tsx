import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Severity = 'success' | 'error' | 'info';
const Ctx = createContext<(message: string, severity?: Severity) => void>(() => undefined);

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; severity: Severity } | null>(null);
  const notify = useCallback((message: string, severity: Severity = 'success') => setToast({ message, severity }), []);

  return (
    <Ctx.Provider value={notify}>
      {children}
      <Snackbar
        open={toast !== null}
        autoHideDuration={toast?.severity === 'error' ? 6000 : 3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  );
}
