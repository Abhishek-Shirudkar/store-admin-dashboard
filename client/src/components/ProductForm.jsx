import { useState } from 'react';

export default function ProductForm({ product, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    category: product?.category ?? categories[0],
    price: product?.price ?? '',
    stock: product?.stock ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{product ? 'Edit product' : 'Add product'}</h3>
        <label>
          Name
          <input value={form.name} onChange={set('name')} required autoFocus />
        </label>
        <label>
          Category
          <select value={form.category} onChange={set('category')}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="row">
          <label>
            Price ($)
            <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
          </label>
          <label>
            Stock
            <input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required />
          </label>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
