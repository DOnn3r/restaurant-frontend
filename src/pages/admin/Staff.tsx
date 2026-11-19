import { useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Switch,
  TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { errMsg, get, http } from '../../api';
import { useAuth } from '../../auth';
import { ErrorBanner, Loading } from '../../components/Loading';
import PageHeader from '../../components/PageHeader';
import { useFetch } from '../../hooks';
import { useToast } from '../../toast';
import { colors } from '../../theme';
import { ROLE_LABEL, Role, User } from '../../types';

function StaffDialog({ user, onClose, onSaved }: { user: User | 'new'; onClose: () => void; onSaved: () => void }) {
  const notify = useToast();
  const [username, setUsername] = useState(user === 'new' ? '' : user.username);
  const [fullName, setFullName] = useState(user === 'new' ? '' : user.fullName);
  const [role, setRole] = useState<Role>(user === 'new' ? 'SERVEUR' : user.role);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = user === 'new';
  const valid = fullName.trim() !== '' && (isNew ? username.trim() !== '' && password.length >= 6 : password === '' || password.length >= 6);

  const save = async () => {
    setBusy(true);
    try {
      if (user === 'new') {
        await http.post('/users', { username: username.trim(), password, fullName: fullName.trim(), role });
      } else {
        await http.put(`/users/${user.id}`, { fullName: fullName.trim(), role, password: password || null });
      }
      notify(isNew ? 'Compte créé' : 'Compte modifié');
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isNew ? 'Ajouter un membre' : 'Modifier le compte'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus required />
        <TextField label="Identifiant de connexion" value={username} onChange={(e) => setUsername(e.target.value)}
                   disabled={!isNew} required autoComplete="off" />
        <TextField select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <MenuItem key={r} value={r}>{ROLE_LABEL[r]}</MenuItem>)}
        </TextField>
        <TextField label={isNew ? 'Mot de passe' : 'Nouveau mot de passe'} type="password" value={password}
                   onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required={isNew}
                   helperText={isNew ? '6 caractères minimum' : 'Laissez vide pour conserver le mot de passe actuel'} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={save} disabled={!valid || busy}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Staff() {
  const notify = useToast();
  const { user: me } = useAuth();
  const { data, error, loading, reload } = useFetch(() => get<User[]>('/users'), []);
  const [editing, setEditing] = useState<User | 'new' | null>(null);

  const toggle = async (u: User) => {
    try {
      await http.put(`/users/${u.id}`, { active: !u.active });
      notify(u.active ? `${u.fullName} ne peut plus se connecter` : `${u.fullName} peut de nouveau se connecter`);
      await reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Équipe"
        subtitle="Les comptes des serveurs, cuisiniers et administrateurs."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Ajouter un membre</Button>}
      />
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {data?.map((u) => (
            <Card key={u.id} sx={{ p: 1.5, pl: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', opacity: u.active ? 1 : 0.65 }}>
              <Box sx={{ flexGrow: 1, minWidth: 180 }}>
                <Typography sx={{ fontWeight: 800 }}>{u.fullName}{u.id === me?.id ? ' (vous)' : ''}</Typography>
                <Typography variant="body2" color="text.secondary">@{u.username}</Typography>
              </Box>
              <Chip size="small" label={ROLE_LABEL[u.role]}
                    sx={u.role === 'ADMIN' ? { bgcolor: colors.black, color: '#fff' } : u.role === 'CUISINIER' ? { bgcolor: colors.cassisSoft, color: colors.cassis } : { bgcolor: colors.greenSoft, color: colors.greenDark }} />
              <Switch checked={u.active} onChange={() => toggle(u)} disabled={u.id === me?.id} inputProps={{ 'aria-label': `${u.fullName} actif` }} />
              <IconButton onClick={() => setEditing(u)} aria-label={`Modifier ${u.fullName}`}><EditIcon /></IconButton>
            </Card>
          ))}
        </Box>
      )}
      {editing && <StaffDialog user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(); }} />}
    </>
  );
}
