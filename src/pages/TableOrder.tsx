import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Badge, Box, Button, Card, Chip, IconButton, InputAdornment, Tab, Tabs, TextField, Typography,
  ButtonBase, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { errMsg, get, http } from '../api';
import { useAuth } from '../auth';
import { money } from '../config';
import BillDialog from '../components/BillDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { ErrorBanner, Loading } from '../components/Loading';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import { useFetch } from '../hooks';
import { useToast } from '../toast';
import { colors } from '../theme';
import { CartLine, Dish, Order, TableView } from '../types';
import { NAV_SPACE } from '../components/MobileNav';

export default function TableOrder() {
  const tableId = Number(useParams().id);
  const navigate = useNavigate();
  const notify = useToast();
  const { user } = useAuth();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));

  const tableQ = useFetch(() => get<TableView>(`/tables/${tableId}`), [tableId]);
  const dishesQ = useFetch(() => get<Dish[]>('/dishes'), []);
  const orderQ = useFetch<Order | null>(
    () => http.get<Order>(`/tables/${tableId}/order`).then((r) => (r.status === 204 ? null : r.data)),
    [tableId], 4000,
  );

  const [cart, setCart] = useState<CartLine[]>([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [sending, setSending] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const order = orderQ.data;
  const dishes = useMemo(() => (dishesQ.data ?? []).filter((d) => d.available), [dishesQ.data]);
  const categories = useMemo(() => ['Tous', ...Array.from(new Set(dishes.map((d) => d.category)))], [dishes]);
  const visible = dishes.filter((d) =>
    (category === 'Tous' || d.category === category) &&
    d.name.toLowerCase().includes(search.trim().toLowerCase()));

  const cartCount = cart.reduce((n, l) => n + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.quantity * l.dish.price, 0);
  const inCart = (id: number) => cart.find((l) => l.dish.id === id)?.quantity ?? 0;

  const add = (dish: Dish) =>
    setCart((c) => c.some((l) => l.dish.id === dish.id)
      ? c.map((l) => (l.dish.id === dish.id ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l))
      : [...c, { dish, quantity: 1, note: '' }]);
  const change = (id: number, delta: number) =>
    setCart((c) => c.map((l) => (l.dish.id === id ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0));
  const setNote = (id: number, note: string) =>
    setCart((c) => c.map((l) => (l.dish.id === id ? { ...l, note } : l)));

  const send = async () => {
    setSending(true);
    try {
      await http.post(`/tables/${tableId}/order`, {
        items: cart.map((l) => ({ dishId: l.dish.id, quantity: l.quantity, note: l.note.trim() || null })),
      });
      setCart([]);
      notify('Commande envoyée en cuisine');
      await orderQ.reload();
      setTab(1);
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setSending(false);
    }
  };

  const markServed = async (itemId: number) => {
    try {
      await http.patch(`/kitchen/items/${itemId}/status`, { status: 'SERVED' });
      await orderQ.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  };

  const removeItem = async (itemId: number) => {
    if (!order) return;
    try {
      const { data } = await http.delete<Order>(`/orders/${order.id}/items/${itemId}`);
      if (data.status === 'CANCELLED') {
        notify('Plus aucun plat : la commande est annulée');
        navigate('/tables');
      } else {
        await orderQ.reload();
      }
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    try {
      await http.post(`/orders/${order.id}/cancel`);
      notify('Commande annulée');
      navigate('/tables');
    } catch (e) {
      notify(errMsg(e), 'error');
      setCancelOpen(false);
    }
  };

  // ---------- Panneau « Carte »
  const menuPanel = (
    <Box>
      <TextField
        value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un plat" fullWidth
        inputProps={{ 'aria-label': 'Rechercher un plat' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        sx={{ mb: 1.5, bgcolor: '#fff' }}
      />
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 1 }} role="group" aria-label="Catégories">
        {categories.map((c) => (
          <Chip key={c} label={c} onClick={() => setCategory(c)} clickable
                sx={{ minHeight: 36, px: 0.5, ...(category === c ? { bgcolor: colors.green, color: '#fff', '&:hover': { bgcolor: colors.greenDark } } : { bgcolor: '#fff', border: `1px solid ${colors.line}` }) }} />
        ))}
      </Box>
      {dishesQ.loading && !dishesQ.data ? <Loading /> : dishes.length === 0 ? (
        <EmptyState
          title="La carte est vide"
          text="Aucun plat n'a encore été ajouté au menu."
          action={user?.role === 'ADMIN' ? <Button variant="contained" component={RouterLink} to="/admin/menu">Ajouter des plats</Button> : undefined}
        />
      ) : visible.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aucun plat ne correspond.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {visible.map((d) => (
            <ButtonBase key={d.id} onClick={() => add(d)} aria-label={`Ajouter ${d.name}, ${money(d.price)}`}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, textAlign: 'left',
                              p: 1.5, minHeight: 64, bgcolor: '#fff', border: `1px solid ${colors.line}`, borderRadius: 2,
                              '&:hover': { borderColor: colors.green } }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }}>{d.name}</Typography>
                {d.ingredients.length > 0 && (
                  <Typography variant="body2" color="text.secondary" noWrap>{d.ingredients.join(', ')}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 800 }}>{money(d.price)}</Typography>
                <Badge badgeContent={inCart(d.id)} color="secondary">
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: colors.green, color: '#fff', display: 'grid', placeItems: 'center' }}>
                    <AddIcon fontSize="small" />
                  </Box>
                </Badge>
              </Box>
            </ButtonBase>
          ))}
        </Box>
      )}
    </Box>
  );

  // ---------- Panneau « Commande »
  const orderPanel = (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Nouvelle commande</Typography>
        {cart.length === 0 ? (
          <Typography color="text.secondary">Touchez un plat de la carte pour l'ajouter.</Typography>
        ) : (
          <>
            {cart.map((l) => (
              <Box key={l.dish.id} sx={{ py: 1.25, borderBottom: `1px solid ${colors.line}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{l.dish.name}</Typography>
                  <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{money(l.dish.price * l.quantity)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <IconButton size="small" onClick={() => change(l.dish.id, -1)} aria-label={`Retirer un ${l.dish.name}`}
                              sx={{ border: `1px solid ${colors.line}` }}><RemoveIcon fontSize="small" /></IconButton>
                  <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 800 }} aria-live="polite">{l.quantity}</Typography>
                  <IconButton size="small" onClick={() => change(l.dish.id, 1)} aria-label={`Ajouter un ${l.dish.name}`}
                              sx={{ border: `1px solid ${colors.line}` }}><AddIcon fontSize="small" /></IconButton>
                  <TextField value={l.note} onChange={(e) => setNote(l.dish.id, e.target.value)} variant="standard"
                             placeholder="Précision (sans oignon, bien cuit…)" fullWidth size="small"
                             inputProps={{ maxLength: 300, 'aria-label': `Précision pour ${l.dish.name}` }} />
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', my: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>{cartCount} plat{cartCount > 1 ? 's' : ''}</Typography>
              <Typography variant="h6">{money(cartTotal)}</Typography>
            </Box>
            <Button variant="contained" fullWidth size="large" startIcon={<SendIcon />} onClick={send} disabled={sending}>
              {order ? 'Ajouter à la commande' : 'Envoyer en cuisine'}
            </Button>
          </>
        )}
      </Card>

      <Card sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Déjà commandé</Typography>
        {orderQ.loading && !order ? <Loading /> : !order ? (
          <Typography color="text.secondary">Rien pour le moment : la table est libre.</Typography>
        ) : (
          <>
            {order.items.map((i) => (
              <Box key={i.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: `1px solid ${colors.line}` }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{i.quantity} × {i.dishName}</Typography>
                  {i.note && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>{i.note}</Typography>}
                  <Box sx={{ mt: 0.5 }}><StatusChip status={i.status} /></Box>
                </Box>
                <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{money(i.lineTotal)}</Typography>
                {i.status === 'READY' && <Button size="small" variant="contained" color="secondary" onClick={() => markServed(i.id)}>Servi</Button>}
                {(i.status === 'PENDING' || user?.role === 'ADMIN') && i.status !== 'SERVED' && (
                  <IconButton onClick={() => removeItem(i.id)} aria-label={`Retirer ${i.dishName} de la commande`}><DeleteOutlineIcon /></IconButton>
                )}
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', my: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h5" component="p">{money(order.total)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<ReceiptIcon />} onClick={() => setBillOpen(true)} sx={{ flexGrow: 1 }}>
                Voir l'addition
              </Button>
              <Button color="error" onClick={() => setCancelOpen(true)}>Annuler la commande</Button>
            </Box>
          </>
        )}
      </Card>
    </Box>
  );

  const table = tableQ.data;
  return (
    <>
      <Button component={RouterLink} to="/tables" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>Toutes les tables</Button>
      <PageHeader
        title={table?.label ?? 'Table'}
        subtitle={table ? `${table.seats} couvert${table.seats > 1 ? 's' : ''}${order ? ` · Serveur : ${order.serverName}` : ''}` : undefined}
      />
      <ErrorBanner message={tableQ.error ?? dishesQ.error} />

      {wide ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 3, alignItems: 'start' }}>
          {menuPanel}
          <Box sx={{ position: 'sticky', top: 16 }}>{orderPanel}</Box>
        </Box>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="fullWidth" sx={{ mb: 2, borderBottom: `1px solid ${colors.line}` }}>
            <Tab label="Carte" />
            <Tab label={<Badge badgeContent={cartCount} color="secondary" sx={{ '& .MuiBadge-badge': { right: -14 } }}>Commande</Badge>} />
          </Tabs>
          {tab === 0 ? menuPanel : orderPanel}
          {tab === 0 && cartCount > 0 && <Box sx={{ height: 72 }} aria-hidden />}
          {tab === 0 && cartCount > 0 && (
            <Box sx={{ position: 'fixed', left: 16, right: 16, bottom: `calc(${NAV_SPACE} + 4px)`, zIndex: 10 }}>
              <Button variant="contained" size="large" fullWidth onClick={() => setTab(1)} sx={{ boxShadow: 4 }}>
                Voir la commande · {cartCount} plat{cartCount > 1 ? 's' : ''} · {money(cartTotal)}
              </Button>
            </Box>
          )}
        </>
      )}

      <BillDialog
        orderId={order?.id ?? null} open={billOpen} onClose={() => setBillOpen(false)}
        onPaid={() => { setBillOpen(false); navigate('/tables'); }}
      />
      <ConfirmDialog
        open={cancelOpen} danger title="Annuler cette commande ?"
        message="Tous les plats seront retirés de la cuisine. Cette action est définitive."
        confirmLabel="Annuler la commande" onConfirm={cancelOrder} onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
