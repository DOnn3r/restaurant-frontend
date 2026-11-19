import { useState } from 'react';
import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { errMsg, get, http } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { ErrorBanner, Loading } from '../../components/Loading';
import PageHeader from '../../components/PageHeader';
import { useFetch } from '../../hooks';
import { useToast } from '../../toast';
import { TableView } from '../../types';

function TableDialog({ table, onClose, onSaved }: { table: TableView | 'new'; onClose: () => void; onSaved: () => void }) {
  const notify = useToast();
  const [label, setLabel] = useState(table === 'new' ? '' : table.label);
  const [seats, setSeats] = useState(table === 'new' ? '4' : String(table.seats));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const n = parseInt(seats, 10);
  const valid = label.trim() !== '' && n >= 1 && n <= 100;

  const save = async () => {
    setBusy(true);
    try {
      const body = { label: label.trim(), seats: n };
      if (table === 'new') await http.post('/tables', body); else await http.put(`/tables/${table.id}`, body);
      notify(table === 'new' ? 'Table ajoutée' : 'Table modifiée');
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{table === 'new' ? 'Ajouter une table' : 'Modifier la table'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nom" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus required placeholder="Table 1, Terrasse 2…" />
        <TextField label="Nombre de couverts" value={seats} onChange={(e) => setSeats(e.target.value)} type="number" inputProps={{ min: 1, max: 100 }} required />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={save} disabled={!valid || busy}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}

function BulkDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const notify = useToast();
  const [count, setCount] = useState('10');
  const [seats, setSeats] = useState('4');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const c = parseInt(count, 10);
  const s = parseInt(seats, 10);
  const valid = c >= 1 && c <= 100 && s >= 1 && s <= 100;

  const save = async () => {
    setBusy(true);
    try {
      await http.post('/tables/bulk', { count: c, seats: s });
      notify(`${c} table${c > 1 ? 's' : ''} créée${c > 1 ? 's' : ''}`);
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Créer plusieurs tables</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography color="text.secondary">Les tables seront nommées « Table 1 », « Table 2 »… à la suite de celles existantes.</Typography>
        <TextField label="Nombre de tables" value={count} onChange={(e) => setCount(e.target.value)} type="number" inputProps={{ min: 1, max: 100 }} autoFocus />
        <TextField label="Couverts par table" value={seats} onChange={(e) => setSeats(e.target.value)} type="number" inputProps={{ min: 1, max: 100 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={save} disabled={!valid || busy}>Créer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TablesAdmin() {
  const notify = useToast();
  const { data, error, loading, reload } = useFetch(() => get<TableView[]>('/tables'), []);
  const [editing, setEditing] = useState<TableView | 'new' | null>(null);
  const [bulk, setBulk] = useState(false);
  const [toDelete, setToDelete] = useState<TableView | null>(null);

  const remove = async () => {
    if (!toDelete) return;
    try {
      await http.delete(`/tables/${toDelete.id}`);
      notify('Table supprimée');
      await reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Tables"
        subtitle="Le plan de votre salle."
        actions={<>
          <Button variant="outlined" onClick={() => setBulk(true)}>Créer plusieurs tables</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Ajouter une table</Button>
        </>}
      />
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : data && data.length === 0 ? (
        <EmptyState title="Aucune table" text="Créez vos tables pour que les serveurs puissent prendre des commandes."
                    action={<Button variant="contained" onClick={() => setBulk(true)}>Créer plusieurs tables</Button>} />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {data?.map((t) => (
            <Card key={t.id} sx={{ p: 2 }}>
              <Typography variant="h5" component="h2">{t.label}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>{t.seats} couvert{t.seats > 1 ? 's' : ''}{t.occupied ? ' · occupée' : ''}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={() => setEditing(t)} aria-label={`Modifier ${t.label}`}><EditIcon /></IconButton>
                <IconButton onClick={() => setToDelete(t)} aria-label={`Supprimer ${t.label}`} disabled={t.occupied}><DeleteOutlineIcon /></IconButton>
              </Box>
            </Card>
          ))}
        </Box>
      )}
      {editing && <TableDialog table={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(); }} />}
      {bulk && <BulkDialog onClose={() => setBulk(false)} onSaved={() => { setBulk(false); void reload(); }} />}
      <ConfirmDialog open={toDelete !== null} danger title="Supprimer cette table ?"
                     message={`« ${toDelete?.label ?? ''} » sera retirée du plan de salle. Impossible si elle a déjà eu des commandes.`}
                     confirmLabel="Supprimer" onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
