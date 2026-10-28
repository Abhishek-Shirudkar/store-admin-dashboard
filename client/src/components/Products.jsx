import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import ProductForm from './ProductForm.jsx';

const COLUMNS = [
  ['id', 'ID'],
  ['name', 'Name'],
  ['category', 'Category'],
  ['price', 'Price'],
  ['stock', 'Stock'],
];

export default function Products() {
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [deleting, setDeleting] = useState(null); // product waiting for delete confirmation
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch((e) => setError(e.message));
  }, []);

  // wait 300 ms after typing stops before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .products({ search: debounced, category, sort, order, page, limit: 10 })
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [debounced, category, sort, order, page]);

  useEffect(load, [load]);

  const toggleSort = (key) => {
    if (sort === key) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(key);
      setOrder('asc');
    }
    setPage(1);
  };

  const save = async (values) => {
    if (editing === 'new') await api.createProduct(values);
    else await api.updateProduct(editing.id, values);
    setEditing(null);
    load();
  };

  const remove = async (p) => {
    setDeleting(null);
    try {
      await api.deleteProduct(p.id);
      // step back a page if we just removed the last row of this one
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="head-row">
        <h2>Products</h2>
        <button className="btn primary" onClick={() => setEditing('new')} disabled={!categories.length}>
          + Add product
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="muted small">{data.total} products</span>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card table-wrap">
        <table className={loading ? 'loading' : ''}>
          <thead>
            <tr>
              {COLUMNS.map(([key, label]) => (
                <th
                  key={key}
                  className={key === 'price' || key === 'stock' ? 'num sortable' : 'sortable'}
                  onClick={() => toggleSort(key)}
                  aria-sort={sort === key ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {label} {sort === key ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td className="num">${p.price.toFixed(2)}</td>
                <td className="num">
                  <span className={p.stock < 10 ? 'low' : ''}>{p.stock}</span>
                </td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => setEditing(p)}>
                    Edit
                  </button>
                  <button className="btn small danger" onClick={() => setDeleting(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan="6" className="muted center">
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span className="muted small">
          Page {page} of {data.pages}
        </span>
        <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>

      {deleting && (
        <div className="overlay" role="alertdialog" aria-modal="true" onClick={() => setDeleting(null)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete product?</h3>
            <p className="muted">"{deleting.name}" will be removed permanently.</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="btn danger" onClick={() => remove(deleting)} autoFocus>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  );
}
