import { ReactNode } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Button, Chip, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import TableBarIcon from '@mui/icons-material/TableBar';
import GroupsIcon from '@mui/icons-material/Groups';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import TableRestaurantOutlinedIcon from '@mui/icons-material/TableRestaurantOutlined';
import SoupKitchenOutlinedIcon from '@mui/icons-material/SoupKitchenOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TableBarOutlinedIcon from '@mui/icons-material/TableBarOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { useAuth } from '../auth';
import { appNameFor } from '../config';
import { colors } from '../theme';
import { ROLE_LABEL, Role } from '../types';
import MobileNav, { NAV_SPACE } from './MobileNav';

interface NavItem { to: string; label: string; short?: string; icon: ReactNode; mobileIcon: ReactNode; roles: Role[] }

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Tableau de bord', short: 'Accueil', icon: <SpaceDashboardIcon />, mobileIcon: <SpaceDashboardOutlinedIcon />, roles: ['ADMIN'] },
  { to: '/tables', label: 'Service en salle', short: 'Salle', icon: <TableRestaurantIcon />, mobileIcon: <TableRestaurantOutlinedIcon />, roles: ['SERVEUR', 'ADMIN'] },
  { to: '/kitchen', label: 'Cuisine', icon: <SoupKitchenIcon />, mobileIcon: <SoupKitchenOutlinedIcon />, roles: ['CUISINIER', 'ADMIN'] },
  { to: '/admin/menu', label: 'Carte', icon: <MenuBookIcon />, mobileIcon: <MenuBookOutlinedIcon />, roles: ['ADMIN'] },
  { to: '/admin/history', label: 'Historique', icon: <ReceiptLongIcon />, mobileIcon: <ReceiptLongOutlinedIcon />, roles: ['ADMIN'] },
  { to: '/admin/expenses', label: 'Dépenses', icon: <PaymentsIcon />, mobileIcon: <PaymentsOutlinedIcon />, roles: ['ADMIN'] },
  { to: '/admin/tables', label: 'Gérer les tables', icon: <TableBarIcon />, mobileIcon: <TableBarOutlinedIcon />, roles: ['ADMIN'] },
  { to: '/admin/staff', label: 'Équipe', icon: <GroupsIcon />, mobileIcon: <GroupsOutlinedIcon />, roles: ['ADMIN'] },
];

/** Barre mobile : onglets de gauche / de droite (le reste va dans la feuille « Profil »). */
const MOBILE_TABS: Record<Role, { left: string[]; right: string[] }> = {
  ADMIN: { left: ['/dashboard', '/kitchen'], right: ['/admin/menu'] },
  SERVEUR: { left: ['/tables'], right: [] },
  CUISINIER: { left: ['/kitchen'], right: [] },
};
/** Rôles qui voient le bouton « + » (nouvelle commande → choisir une table). */
const CAN_ORDER: Role[] = ['SERVEUR', 'ADMIN'];

const WIDTH = 260;

export default function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const appName = appNameFor(user?.role);
  const items = NAV.filter((n) => user && n.roles.includes(user.role));
  const tabPaths = user ? [...MOBILE_TABS[user.role].left, ...MOBILE_TABS[user.role].right] : [];
  const tabsFor = (paths: string[]) =>
    paths.flatMap((p) => items.filter((n) => n.to === p)).map((n) => ({ to: n.to, label: n.short ?? n.label, icon: n.mobileIcon }));

  const panel = (
    <Box component="nav" aria-label="Navigation principale"
         sx={{ width: WIDTH, height: '100%', bgcolor: colors.black, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography sx={{ fontFamily: "'Fraunces Variable', serif", fontWeight: 600, fontSize: '1.6rem' }}>
          {appName}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.7)' }}>Gestion de restaurant</Typography>
      </Box>
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {items.map((n) => {
          const selected = pathname === n.to || pathname.startsWith(n.to + '/');
          return (
            <ListItemButton
              key={n.to} component={RouterLink} to={n.to} selected={selected}
              aria-current={selected ? 'page' : undefined}
              sx={{
                borderRadius: 1, mb: 0.5, minHeight: 48, color: 'rgba(255,255,255,.88)',
                '&.Mui-selected': { bgcolor: colors.green, color: '#fff', boxShadow: `inset 4px 0 0 ${colors.cassis}` },
                '&.Mui-selected:hover, &:hover': { bgcolor: colors.greenDark },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{n.icon}</ListItemIcon>
              <ListItemText primary={n.label} primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,.14)' }}>
        <Typography sx={{ fontWeight: 700 }}>{user?.fullName}</Typography>
        <Chip size="small" label={user ? ROLE_LABEL[user.role] : ''}
              sx={{ mt: 0.5, mb: 1.5, bgcolor: colors.cassis, color: '#fff' }} />
        <Button fullWidth startIcon={<LogoutIcon />} onClick={logout}
                sx={{ color: '#fff', justifyContent: 'flex-start', border: '1px solid rgba(255,255,255,.3)' }}>
          Se déconnecter
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="a" href="#contenu"
           sx={{ position: 'absolute', left: -999, top: 8, zIndex: 2000, bgcolor: '#fff', p: 1.5, borderRadius: 1,
                 '&:focus': { left: 8 } }}>
        Aller au contenu
      </Box>

      {desktop ? (
        <Drawer variant="permanent" sx={{ width: WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: WIDTH, border: 0 } }}>
          {panel}
        </Drawer>
      ) : (
        <>
          <AppBar position="fixed" sx={{ bgcolor: colors.black }} elevation={0}>
            <Toolbar>
              <Typography sx={{ fontFamily: "'Fraunces Variable', serif", fontWeight: 600, fontSize: '1.3rem' }}>
                {appName}
              </Typography>
            </Toolbar>
          </AppBar>
          {user && (
            <MobileNav
              left={tabsFor(MOBILE_TABS[user.role].left)}
              right={tabsFor(MOBILE_TABS[user.role].right)}
              action={CAN_ORDER.includes(user.role) ? { to: '/tables', label: 'Nouvelle commande' } : undefined}
              more={items.filter((n) => !tabPaths.includes(n.to)).map((n) => ({ to: n.to, label: n.label, icon: n.mobileIcon }))}
              user={user}
              onLogout={logout}
            />
          )}
        </>
      )}

      <Box component="main" id="contenu" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 }, pb: { xs: NAV_SPACE, md: 4 } }}>
        {!desktop && <Toolbar />}
        <Outlet />
      </Box>
    </Box>
  );
}