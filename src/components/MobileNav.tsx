import { ReactNode, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, ButtonBase, Chip, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import { colors } from '../theme';
import { ROLE_LABEL, Role } from '../types';

export interface MobileTab { to: string; label: string; icon: ReactNode }
export interface MobileMoreItem { to: string; label: string; icon: ReactNode }

interface Props {
  /** Onglets à gauche du bouton central. */
  left: MobileTab[];
  /** Onglets entre le bouton central et « Profil ». */
  right?: MobileTab[];
  /** Action principale (bouton rond central). Absent = pas de bouton. */
  action?: { to: string; label: string };
  /** Entrées secondaires affichées dans la feuille « Profil ». */
  more: MobileMoreItem[];
  user: { fullName: string; role: Role } | null;
  onLogout: () => void;
}

export const NAV_HEIGHT = 72;
export const NAV_OFFSET = 12;
/** Espace à réserver en bas de page pour que la barre flottante ne masque rien. */
export const NAV_SPACE = `calc(${NAV_HEIGHT + NAV_OFFSET * 2}px + env(safe-area-inset-bottom))`;

const isActive = (pathname: string, to: string) => pathname === to || pathname.startsWith(to + '/');

function Tab({ active, label, icon, to, onClick }: { active: boolean; label: string; icon: ReactNode; to?: string; onClick?: () => void }) {
  const link = to ? { component: RouterLink, to } : {};
  return (
    <ButtonBase
      {...link}
      onClick={onClick}
      aria-current={active && to ? 'page' : undefined}
      aria-label={label}
      sx={{
        flex: 1, minWidth: 0, minHeight: 56, borderRadius: 3, flexDirection: 'column', gap: '2px',
        color: active ? colors.green : colors.muted,
        transition: 'color .15s',
        '& svg': { fontSize: 28 },
        '&:hover': { bgcolor: colors.greenSoft },
      }}
    >
      {icon}
      <Typography component="span" sx={{ fontSize: '0.72rem', lineHeight: 1.2, fontWeight: active ? 800 : 600, color: 'inherit' }}>
        {label}
      </Typography>
    </ButtonBase>
  );
}

export default function MobileNav({ left, right = [], action, more, user, onLogout }: Props) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const profileActive = open || more.some((m) => isActive(pathname, m.to));

  return (
    <>
      <Box
        component="nav" aria-label="Navigation principale"
        sx={{
          position: 'fixed', zIndex: (t) => t.zIndex.appBar,
          left: NAV_OFFSET, right: NAV_OFFSET,
          bottom: `calc(${NAV_OFFSET}px + env(safe-area-inset-bottom))`,
          mx: 'auto', maxWidth: 480, height: NAV_HEIGHT,
          display: 'flex', alignItems: 'center', gap: 0.5, px: 1,
          bgcolor: colors.white, border: `1px solid ${colors.line}`, borderRadius: '28px',
          boxShadow: '0 12px 32px rgba(17,17,17,.16)',
        }}
      >
        {left.map((t) => <Tab key={t.to} to={t.to} label={t.label} icon={t.icon} active={isActive(pathname, t.to)} />)}

        {action && (
          <ButtonBase
            component={RouterLink} to={action.to} aria-label={action.label}
            sx={{
              flex: '0 0 auto', width: 56, height: 56, mx: 1, borderRadius: '50%',
              bgcolor: colors.green, color: '#fff',
              boxShadow: '0 8px 18px rgba(53,96,74,.45)',
              transition: 'background-color .15s, transform .15s',
              '&:hover': { bgcolor: colors.greenDark },
              '&:active': { transform: 'scale(.94)' },
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 34 }} />
          </ButtonBase>
        )}

        {right.map((t) => <Tab key={t.to} to={t.to} label={t.label} icon={t.icon} active={isActive(pathname, t.to)} />)}

        <Tab label="Profil" icon={<PersonOutlineRoundedIcon />} active={profileActive} onClick={() => setOpen(true)} />
      </Box>

      <Drawer
        anchor="bottom" open={open} onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px 24px 0 0', maxHeight: '85vh', pb: 'env(safe-area-inset-bottom)' } }}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: colors.line, mx: 'auto', mt: 1.5 }} aria-hidden />
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{user?.fullName}</Typography>
          {user && <Chip size="small" label={ROLE_LABEL[user.role]} sx={{ mt: 0.5, bgcolor: colors.cassis, color: '#fff' }} />}
        </Box>
        {more.length > 0 && (
          <List sx={{ px: 1.5 }}>
            {more.map((m) => {
              const selected = isActive(pathname, m.to);
              return (
                <ListItemButton
                  key={m.to} component={RouterLink} to={m.to} selected={selected} onClick={() => setOpen(false)}
                  aria-current={selected ? 'page' : undefined}
                  sx={{
                    borderRadius: 2, minHeight: 52, mb: 0.5,
                    '&.Mui-selected, &.Mui-selected:hover': { bgcolor: colors.greenSoft, color: colors.green },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{m.icon}</ListItemIcon>
                  <ListItemText primary={m.label} primaryTypographyProps={{ fontWeight: 700 }} />
                </ListItemButton>
              );
            })}
          </List>
        )}
        <Box sx={{ p: 2, pt: 1 }}>
          <ListItemButton
            onClick={() => { setOpen(false); onLogout(); }}
            sx={{ borderRadius: 2, minHeight: 52, border: `1px solid ${colors.line}`, color: colors.cassis }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Se déconnecter" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
}
