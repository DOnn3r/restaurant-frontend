import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { errMsg } from '../api';
import { homeFor, useAuth } from '../auth';
import { APP_NAME } from '../config';
import { colors } from '../theme';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <Box sx={{
        display: { xs: 'none', md: 'flex' }, bgcolor: colors.black, color: '#fff', p: 8,
        flexDirection: 'column', justifyContent: 'space-between', borderRight: `6px solid ${colors.green}`,
      }}>
        <Typography sx={{ fontFamily: "'Fraunces Variable', serif", fontSize: '2rem', fontWeight: 600 }}>{APP_NAME}</Typography>
        <Box>
          <Typography variant="h3" component="p" sx={{ maxWidth: 440, lineHeight: 1.15 }}>
            Chaque commande à la bonne table, chaque centime au bon compte.
          </Typography>
          <Box sx={{ width: 56, height: 6, bgcolor: colors.cassis, mt: 4, borderRadius: 1 }} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#fff' }}>
        <Box component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 380 }} noValidate>
          <Typography sx={{ display: { md: 'none' }, fontFamily: "'Fraunces Variable', serif", fontSize: '1.8rem', fontWeight: 600, mb: 3 }}>
            {APP_NAME}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>Connexion</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Entrez l'identifiant donné par l'administrateur.</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField label="Identifiant" value={username} onChange={(e) => setUsername(e.target.value)}
                     autoComplete="username" autoFocus fullWidth required sx={{ mb: 2 }} />
          <TextField label="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
                     type={show ? 'text' : 'password'} autoComplete="current-password" fullWidth required sx={{ mb: 3 }}
                     InputProps={{
                       endAdornment: (
                         <InputAdornment position="end">
                           <IconButton onClick={() => setShow((s) => !s)} edge="end"
                                       aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                             {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
                           </IconButton>
                         </InputAdornment>
                       ),
                     }} />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={busy || !username || !password}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
