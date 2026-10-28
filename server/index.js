import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { products, orders, CATEGORIES } from './data.js';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-change-me';

// Demo login so reviewers can try the app. Change these in a real project.
const DEMO_USER = { email: 'demo@store.test', password: 'demo1234', name: 'Demo Admin' };

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function validateProduct(body) {
  const name = String(body.name ?? '').trim();
  const category = body.category;
  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!name) return { error: 'Name is required' };
  if (!CATEGORIES.includes(category)) return { error: 'Invalid category' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be 0 or more' };
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number, 0 or more' };
  return { value: { name, category, price: Math.round(price * 100) / 100, stock } };
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  const token = jwt.sign({ email, name: DEMO_USER.name }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { email, name: DEMO_USER.name } });
});

app.get('/api/categories', auth, (_req, res) => res.json(CATEGORIES));

app.get('/api/products', auth, (req, res) => {
  const { search = '', category = '', sort = 'id', order = 'asc' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  let list = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(String(search).toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const allowed = ['id', 'name', 'category', 'price', 'stock'];
  const key = allowed.includes(sort) ? sort : 'id';
  const dir = order === 'desc' ? -1 : 1;
  list = [...list].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'string') return x.localeCompare(y) * dir;
    return (x - y) * dir;
  });

  const total = list.length;
  const items = list.slice((page - 1) * limit, page * limit);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

app.post('/api/products', auth, (req, res) => {
  const { value, error } = validateProduct(req.body || {});
  if (error) return res.status(400).json({ error });
  const product = { id: Math.max(0, ...products.map((p) => p.id)) + 1, ...value };
  products.push(product);
  res.status(201).json(product);
});

app.put('/api/products/:id', auth, (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const { value, error } = validateProduct(req.body || {});
  if (error) return res.status(400).json({ error });
  Object.assign(product, value);
  res.json(product);
});

app.delete('/api/products/:id', auth, (req, res) => {
  const index = products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(index, 1);
  res.status(204).end();
});

app.get('/api/orders', auth, (_req, res) => {
  const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  res.json(recent);
});

app.get('/api/stats', auth, (_req, res) => {
  const counted = orders.filter((o) => o.status !== 'Cancelled');
  const revenue = counted.reduce((sum, o) => sum + o.total, 0);

  // Revenue per month for the last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), revenue: 0 });
  }
  for (const o of counted) {
    const d = new Date(o.date);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.revenue += o.total;
  }

  const byCategory = CATEGORIES.map((category) => ({
    category,
    products: products.filter((p) => p.category === category).length,
  }));

  const byStatus = ['Delivered', 'Shipped', 'Processing', 'Cancelled'].map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  res.json({
    totals: {
      revenue: Math.round(revenue * 100) / 100,
      orders: orders.length,
      products: products.length,
      lowStock: products.filter((p) => p.stock < 10).length,
    },
    revenueByMonth: months.map(({ label, revenue }) => ({ label, revenue: Math.round(revenue) })),
    byCategory,
    byStatus,
  });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
