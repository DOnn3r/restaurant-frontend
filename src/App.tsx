import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './auth';
import { Role } from './types';
import { Loading } from './components/Loading';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Tables from './pages/Tables';
import TableOrder from './pages/TableOrder';
import Kitchen from './pages/Kitchen';
import Dashboard from './pages/admin/Dashboard';
import MenuAdmin from './pages/admin/MenuAdmin';
import TablesAdmin from './pages/admin/TablesAdmin';
import Expenses from './pages/admin/Expenses';
import History from './pages/admin/History';
import Staff from './pages/admin/Staff';

function Guard({ roles, children }: { roles: Role[]; children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

const ADMIN: Role[] = ['ADMIN'];
const SERVICE: Role[] = ['SERVEUR', 'ADMIN'];
const KITCHEN: Role[] = ['CUISINIER', 'ADMIN'];
const ALL: Role[] = ['ADMIN', 'SERVEUR', 'CUISINIER'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard roles={ALL}><AppShell /></Guard>}>
        <Route path="/" element={<Home />} />
        <Route path="/tables" element={<Guard roles={SERVICE}><Tables /></Guard>} />
        <Route path="/tables/:id" element={<Guard roles={SERVICE}><TableOrder /></Guard>} />
        <Route path="/kitchen" element={<Guard roles={KITCHEN}><Kitchen /></Guard>} />
        <Route path="/dashboard" element={<Guard roles={ADMIN}><Dashboard /></Guard>} />
        <Route path="/admin/menu" element={<Guard roles={ADMIN}><MenuAdmin /></Guard>} />
        <Route path="/admin/tables" element={<Guard roles={ADMIN}><TablesAdmin /></Guard>} />
        <Route path="/admin/expenses" element={<Guard roles={ADMIN}><Expenses /></Guard>} />
        <Route path="/admin/history" element={<Guard roles={ADMIN}><History /></Guard>} />
        <Route path="/admin/staff" element={<Guard roles={ADMIN}><Staff /></Guard>} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
