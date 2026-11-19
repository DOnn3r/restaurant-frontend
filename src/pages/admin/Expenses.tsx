import { useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { errMsg, get, http } from '../../api';
import { money, shortDate, ymd } from '../../config';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { ErrorBanner, Loading } from '../../components/Loading';
import PageHeader from '../../components/PageHeader';
import { useFetch } from '../../hooks';
import { useToast } from '../../toast';
import { colors } from '../../theme';
import { Expense } from '../../types';

const CATEGORIES = ['Ingrédients', 'Salaires', 'Loyer', 'Énergie', 'Matériel', 'Entretien', 'Autre'];

function ExpenseDialog({ expense, categories, onClose, onSaved }: {
  expense: Expense | 'new'; categories: string[]; onClose: () => void; onSaved: () => void;
}) {
  const notify = useToast();
  const [label, setLabel] = useState(expense === 'new' ? '' : expense.label);
  const [category, setCategory] = useState(expense === 'new' ? '' : expense.category);
  const [amount, setAmount] = useState(expense === 'new' ? '' : String(expense.amount));
  const [date, setDate] = useState(expense === 'new' ? ymd(new Date()) : expense.date);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const value = parseFloat(amount.replace(',', '.'));
  const valid = label.trim() !== '' && category.trim() !== '' && Number.isFinite(value) && value > 0 && date !== '';

  const save = async () => {
    setBusy(true);
    try {
      const body = { label: label.trim(), category: category.trim(), amount: value, date };
      if (expense === 'new') await http.post('/expenses', body); else await http.put(`/expenses/${expense.id}`, body);
      notify(expense === 'new' ? 'Dépense enregistrée' : 'Dépense modifiée');
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{expense === 'new' ? 'Ajouter une dépense' : 'Modifier la dépense'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus required placeholder="Livraison légumes, facture électricité…" />
        <Autocomplete freeSolo options={categories} inputValue={category} onInputChange={(_, v) => setCategory(v)}
                      renderInput={(p) => <TextField {...p} label="Catégorie" required />} />
        <TextField label="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={save} disabled={!valid || busy}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Expenses() {
  const notify = useToast();
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return ymd(d); });
  const [to, setTo] = useState(() => ymd(new Date()));
  const { data, error, loading, reload } = useFetch(() => get<Expense[]>('/expenses', { from, to }), [from, to]);
  const [editing, setEditing] = useState<Expense | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const total = data?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const categories = Array.from(new Set([...CATEGORIES, ...(data ?? []).map((e) => e.category)]));

  const remove = async () => {
    if (!toDelete) return;
    try {
      await http.delete(`/expenses/${toDelete.id}`);
      notify('Dépense supprimée');
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
        title="Dépenses"
        subtitle="Achats, salaires, charges : elles sont déduites du chiffre d'affaires pour calculer le bénéfice."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Ajouter une dépense</Button>}
      />
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        <TextField type="date" label="Du" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="Au" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Typography sx={{ ml: { sm: 'auto' } }}>Total sur la période : <strong>{money(total)}</strong></Typography>
      </Box>
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : data && data.length === 0 ? (
        <EmptyState title="Aucune dépense sur cette période" text="Saisissez vos achats et charges pour obtenir un bénéfice fiable."
                    action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Ajouter une dépense</Button>} />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell><TableCell>Libellé</TableCell><TableCell>Catégorie</TableCell>
                  <TableCell align="right">Montant</TableCell><TableCell align="right"><span style={{ position: 'absolute', left: -9999 }}>Actions</span></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(e.date)}</TableCell>
                    <TableCell>{e.label}</TableCell>
                    <TableCell><Chip size="small" label={e.category} sx={{ bgcolor: colors.cassisSoft, color: colors.cassis }} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{money(e.amount)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <IconButton onClick={() => setEditing(e)} aria-label={`Modifier ${e.label}`}><EditIcon /></IconButton>
                      <IconButton onClick={() => setToDelete(e)} aria-label={`Supprimer ${e.label}`}><DeleteOutlineIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
      {editing && <ExpenseDialog expense={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(); }} />}
      <ConfirmDialog open={toDelete !== null} danger title="Supprimer cette dépense ?"
                     message={`« ${toDelete?.label ?? ''} » (${toDelete ? money(toDelete.amount) : ''}) sera retirée des comptes.`}
                     confirmLabel="Supprimer" onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
