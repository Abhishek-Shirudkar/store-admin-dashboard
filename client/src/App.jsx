import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import Login from './components/Login.jsx';
import Overview from './components/Overview.jsx';
import Products from './components/Products.jsx';

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const onExpired = () => setAuthed(false);
    window.addEventListener('auth-expired', onExpired);
    return () => window.removeEventListener('auth-expired', onExpired);
  }, []);

  const handleLogin = async (email, password) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
    setAuthed(true);
  };

  const logout = () => {
    setToken(null);
    setAuthed(false);
  };

  if (!authed) return <Login onLogin={handleLogin} />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Store Admin</h1>
        <nav>
          <button className={tab === 'overview' ? 'nav active' : 'nav'} onClick={() => setTab('overview')}>
            Overview
          </button>
          <button className={tab === 'products' ? 'nav active' : 'nav'} onClick={() => setTab('products')}>
            Products
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="muted small">{user?.name ?? 'Demo Admin'}</div>
          <button className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">{tab === 'overview' ? <Overview /> : <Products />}</main>
    </div>
  );
}
