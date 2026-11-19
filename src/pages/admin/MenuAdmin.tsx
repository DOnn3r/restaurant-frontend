import { useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, Switch, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { errMsg, get, http } from '../../api';
import { money } from '../../config';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { ErrorBanner, Loading } from '../../components/Loading';
import PageHeader from '../../components/PageHeader';
import { useFetch } from '../../hooks';
import { useToast } from '../../toast';
import { colors } from '../../theme';
import { Dish } from '../../types';

/** Catégories proposées à la création d'un plat (liste fermée). */
export const DISH_CATEGORIES = ['Snacks', 'Grillade', 'Soupes', 'Mine sao', 'Boissons'];

interface FormState { name: string; price: string; category: string; description: string; ingredients: string[]; available: boolean }
const empty: FormState = { name: '', price: '', category: '', description: '', ingredients: [], available: true };

const parsePrice = (s: string) => parseFloat(s.replace(',', '.'));

function DishDialog({ dish, onClose, onSaved }: {
  dish: Dish | 'new'; onClose: () => void; onSaved: () => void;
}) {
  const notify = useToast();
  const [f, setF] = useState<FormState>(dish === 'new' ? empty : {
    name: dish.name, price: String(dish.price), category: dish.category,
    description: dish.description ?? '', ingredients: dish.ingredients, available: dish.available,
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = parsePrice(f.price);
  const errors = {
    name: f.name.trim() ? '' : 'Donnez un nom au plat',
    price: Number.isFinite(price) && price >= 0 ? '' : 'Entrez un prix, par exemple 12,50',
    category: f.category.trim() ? '' : 'Choisissez une catégorie',
  };
  const valid = !errors.name && !errors.price && !errors.category;

  const save = async () => {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    const body = {
      name: f.name.trim(), price, category: f.category.trim(),
      description: f.description.trim() || null, ingredients: f.ingredients, available: f.available,
    };
    try {
      if (dish === 'new') await http.post('/dishes', body);
      else await http.put(`/dishes/${dish.id}`, body);
      notify(dish === 'new' ? 'Plat ajouté à la carte' : 'Plat modifié');
      onSaved();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  // Un plat existant dont la catégorie n'est plus dans la liste (ancienne carte) la garde jusqu'à ce qu'on en choisisse une autre.
  const legacy = f.category && !DISH_CATEGORIES.includes(f.category) ? f.category : null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dish === 'new' ? 'Ajouter un plat' : 'Modifier le plat'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nom du plat" value={f.name} onChange={(e) => set('name', e.target.value)} required autoFocus
                   error={touched && !!errors.name} helperText={touched ? errors.name : ' '} inputProps={{ maxLength: 120 }} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <TextField label="Prix" value={f.price} onChange={(e) => set('price', e.target.value)} required
                     inputMode="decimal" error={touched && !!errors.price} helperText={touched ? errors.price : ' '}
                     InputProps={{ endAdornment: <InputAdornment position="end">{money(0).replace(/[\d\s,.\u00a0]/g, '')}</InputAdornment> }} />
          <TextField select label="Catégorie" value={f.category} onChange={(e) => set('category', e.target.value)} required
                     error={touched && !!errors.category} helperText={touched ? errors.category : ' '}>
            {DISH_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            {legacy && <MenuItem value={legacy}>{legacy} (ancienne catégorie)</MenuItem>}
          </TextField>
        </Box>
        <TextField label="Description (facultatif)" value={f.description} onChange={(e) => set('description', e.target.value)}
                   multiline minRows={2} inputProps={{ maxLength: 500 }} />
        <Autocomplete multiple freeSolo autoSelect options={[] as string[]} value={f.ingredients}
                      onChange={(_, v) => set('ingredients', v.map((s) => s.trim()).filter(Boolean))}
                      renderTags={(value, getTagProps) => value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} label={option} size="small" {...tagProps} />;
                      })}
                      renderInput={(p) => <TextField {...p} label="Ingrédients"
                                                     helperText="Saisissez un ingrédient puis appuyez sur Entrée" />} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }} id="avail-label">Disponible à la commande</Typography>
            <Typography variant="body2" color="text.secondary">Désactivez pour masquer le plat (rupture, saison).</Typography>
          </Box>
          <Switch checked={f.available} onChange={(e) => set('available', e.target.checked)} inputProps={{ 'aria-labelledby': 'avail-label' }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={save} disabled={busy}>{dish === 'new' ? 'Ajouter le plat' : 'Enregistrer'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MenuAdmin() {
  const notify = useToast();
  const { data, error, loading, reload } = useFetch(() => get<Dish[]>('/dishes'), []);
  const [editing, setEditing] = useState<Dish | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Dish | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, Dish[]>();
    (data ?? []).forEach((d) => m.set(d.category, [...(m.get(d.category) ?? []), d]));
    return Array.from(m.entries());
  }, [data]);

  const toggle = async (d: Dish) => {
    try {
      await http.put(`/dishes/${d.id}`, {
        name: d.name, description: d.description, price: d.price, category: d.category,
        ingredients: d.ingredients, available: !d.available,
      });
      notify(d.available ? `« ${d.name} » masqué de la carte` : `« ${d.name} » de nouveau disponible`);
      await reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await http.delete(`/dishes/${toDelete.id}`);
      notify('Plat supprimé');
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
        title="Carte"
        subtitle="Les plats que vos serveurs peuvent commander."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Ajouter un plat</Button>}
      />
      <ErrorBanner message={error} />
      {loading && !data ? <Loading /> : groups.length === 0 ? (
        <EmptyState
          title="Votre carte est vide"
          text="Ajoutez votre premier plat avec son nom, son prix et ses ingrédients. Les serveurs pourront alors le commander."
          action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')}>Ajouter un premier plat</Button>}
        />
      ) : (
        groups.map(([cat, dishes]) => (
          <Box key={cat} component="section" sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>{cat}</Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {dishes.map((d) => (
                <Card key={d.id} sx={{ p: 1.5, pl: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', opacity: d.available ? 1 : 0.7 }}>
                  <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 800 }}>{d.name}</Typography>
                      {!d.available && <Chip size="small" label="Masqué" sx={{ bgcolor: colors.cassisSoft, color: colors.cassis }} />}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {d.ingredients.length > 0 ? d.ingredients.join(', ') : 'Aucun ingrédient renseigné'}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, minWidth: 80, textAlign: 'right' }}>{money(d.price)}</Typography>
                  <Switch checked={d.available} onChange={() => toggle(d)} inputProps={{ 'aria-label': `${d.name} disponible` }} />
                  <IconButton onClick={() => setEditing(d)} aria-label={`Modifier ${d.name}`}><EditIcon /></IconButton>
                  <IconButton onClick={() => setToDelete(d)} aria-label={`Supprimer ${d.name}`}><DeleteOutlineIcon /></IconButton>
                </Card>
              ))}
            </Box>
          </Box>
        ))
      )}

      {editing && (
        <DishDialog dish={editing} onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); void reload(); }} />
      )}
      <ConfirmDialog open={toDelete !== null} danger title="Supprimer ce plat ?"
                     message={`« ${toDelete?.name ?? ''} » sera retiré de la carte. S'il a déjà été commandé, masquez-le plutôt.`}
                     confirmLabel="Supprimer" onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}