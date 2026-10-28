import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from 'recharts';
import { api } from '../api.js';

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
};

const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.stats(), api.orders()])
      .then(([s, o]) => {
        setStats(s);
        setOrders(o);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!stats) return <p className="muted">Loading…</p>;

  const { totals } = stats;
  const cards = [
    ['Revenue', money(totals.revenue)],
    ['Orders', totals.orders],
    ['Products', totals.products],
    ['Low stock', totals.lowStock],
  ];

  return (
    <>
      <h2>Overview</h2>
      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div className="card stat" key={label}>
            <div className="muted small">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <section className="card">
          <h3>Revenue, last 6 months</h3>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted)' }} stroke="var(--border)" />
                <YAxis tickFormatter={(v) => `$${v}`} width={60} tick={{ fill: 'var(--muted)' }} stroke="var(--border)" />
                <Tooltip formatter={(v) => money(v)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card">
          <h3>Products by category</h3>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" tick={{ fill: 'var(--muted)' }} stroke="var(--border)" />
                <YAxis allowDecimals={false} width={40} tick={{ fill: 'var(--muted)' }} stroke="var(--border)" />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
                <Bar dataKey="products" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card">
        <h3>Recent orders</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{new Date(o.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`pill ${o.status.toLowerCase()}`}>{o.status}</span>
                  </td>
                  <td className="num">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
