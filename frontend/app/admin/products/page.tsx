'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import {
  fetchAdminProducts,
  fetchAdminCategories,
  updateProductStock,
  bulkUpdateProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type AdminProduct,
  type AdminCategory,
  type ProductFormData,
} from '@/app/lib/adminApi';

const BACKEND_URL = 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-');
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: '',
  images: [],
  isActive: true,
};

// ─── Product Modal ────────────────────────────────────────────────────────────

interface ProductModalProps {
  product: AdminProduct | null;
  categories: AdminCategory[];
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  saving: boolean;
  error: string | null;
}

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
  saving,
  error,
}: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(() =>
    product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category?._id ?? '',
          images: product.images,
          isActive: product.isActive,
        }
      : EMPTY_FORM,
  );
  const [imagesInput, setImagesInput] = useState(
    product ? product.images.join(', ') : '',
  );

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const images = imagesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await onSave({ ...form, images });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set('stock', parseInt(e.target.value) || 0)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (comma-separated URLs)
            </label>
            <input
              type="text"
              value={imagesInput}
              onChange={(e) => setImagesInput(e.target.value)}
              placeholder="/images/product-1.jpg, /images/product-2.jpg"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Inline Stock Editor ──────────────────────────────────────────────────────

function StockCell({
  product,
  onUpdate,
}: {
  product: AdminProduct;
  onUpdate: (id: string, stock: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.stock.toString());
  const [saving, setSaving] = useState(false);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setValue(product.stock.toString());
    setEditing(true);
  }

  async function confirm(e: React.MouseEvent) {
    e.stopPropagation();
    const n = parseInt(value);
    if (isNaN(n) || n < 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(product._id, n);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function cancel(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(false);
  }

  const stockClass =
    product.stock === 0
      ? 'text-red-600 font-semibold'
      : product.stock < 10
      ? 'text-amber-600 font-semibold'
      : 'text-gray-900';

  if (editing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-16 border border-indigo-400 rounded px-1.5 py-0.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        <button
          onClick={confirm}
          disabled={saving}
          className="text-green-600 hover:text-green-700"
        >
          <Check className="w-4 h-4" />
        </button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className={`hover:underline cursor-pointer ${stockClass}`}
      title="Click to edit stock"
    >
      {product.stock}
    </button>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-gray-500">Sure?</span>
      <button
        onClick={onConfirm}
        disabled={deleting}
        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-60"
      >
        {deleting ? '…' : 'Yes'}
      </button>
      <button
        onClick={onCancel}
        className="px-2 py-0.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
      >
        No
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAdminProducts(), fetchAdminCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtered products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchActive =
        filterActive === 'all' ||
        (filterActive === 'active' && p.isActive && p.stock > 0) ||
        (filterActive === 'inactive' && (!p.isActive || p.stock === 0));
      return matchSearch && matchActive;
    });
  }, [products, search, filterActive]);

  // Summary counts
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isActive && p.stock > 0).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // ── Selection helpers ──
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p._id)));
    }
  }

  async function handleBulkUpdate(isActive: boolean) {
    if (selected.size === 0) return;
    setBulkError(null);
    try {
      await bulkUpdateProducts([...selected], isActive);
      setProducts((prev) =>
        prev.map((p) => (selected.has(p._id) ? { ...p, isActive } : p)),
      );
      setSelected(new Set());
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk update failed');
    }
  }

  // ── Stock update ──
  async function handleStockUpdate(id: string, stock: number) {
    const updated = await updateProductStock(id, stock);
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, stock: updated.stock } : p)));
  }

  // ── Modal save ──
  async function handleModalSave(data: ProductFormData) {
    setModalSaving(true);
    setModalError(null);
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct._id, data);
        setProducts((prev) => prev.map((p) => (p._id === editingProduct._id ? updated : p)));
      } else {
        const created = await createProduct(data);
        setProducts((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setModalSaving(false);
    }
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function openAdd() {
    setEditingProduct(null);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingProduct(product);
    setModalError(null);
    setModalOpen(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Summary badges */}
      {!loading && (
        <div className="flex flex-wrap gap-3 mb-5">
          {[
            { label: 'Total', count: totalCount, color: 'bg-gray-100 text-gray-700' },
            { label: 'Active', count: activeCount, color: 'bg-green-100 text-green-700' },
            { label: 'Inactive', count: inactiveCount, color: 'bg-gray-100 text-gray-500' },
            { label: 'Out of Stock', count: outOfStockCount, color: 'bg-red-100 text-red-700' },
          ].map(({ label, count, color }) => (
            <span key={label} className={`text-sm font-medium px-3 py-1 rounded-full ${color}`}>
              {label}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64"
        />
        <select
          value={filterActive}
          onChange={(e) =>
            setFilterActive(e.target.value as 'all' | 'active' | 'inactive')
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive / Out of Stock</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} selected
          </span>
          <button
            onClick={() => handleBulkUpdate(true)}
            className="text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Activate
          </button>
          <button
            onClick={() => handleBulkUpdate(false)}
            className="text-sm px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Deactivate
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            Clear selection
          </button>
          {bulkError && (
            <span className="text-xs text-red-600">{bulkError}</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 && selected.size === filtered.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 w-12 text-left text-gray-500 font-medium">
                    Image
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Price</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Stock</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const imageSrc = product.images[0]
                      ? product.images[0].startsWith('http')
                        ? product.images[0]
                        : `${BACKEND_URL}${product.images[0]}`
                      : null;

                    const statusLabel = !product.isActive
                      ? 'Inactive'
                      : product.stock === 0
                      ? 'Out of Stock'
                      : 'Active';
                    const statusClass = !product.isActive
                      ? 'bg-gray-100 text-gray-500'
                      : product.stock === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700';

                    return (
                      <tr
                        key={product._id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(product._id)}
                            onChange={() => toggleSelect(product._id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px]">
                          <p className="truncate">{product.name}</p>
                          <p className="text-gray-400 text-xs truncate">
                            {product._id.slice(-8)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.category?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-3">
                          <StockCell product={product} onUpdate={handleStockUpdate} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {confirmDeleteId === product._id ? (
                            <DeleteConfirm
                              onConfirm={() => handleDelete(product._id)}
                              onCancel={() => setConfirmDeleteId(null)}
                              deleting={deletingId === product._id}
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEdit(product)}
                                className="flex items-center gap-1 border border-gray-300 text-gray-700 rounded-lg px-2.5 py-1 text-xs hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(product._id);
                                }}
                                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-2.5 py-1 text-xs transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleModalSave}
          saving={modalSaving}
          error={modalError}
        />
      )}
    </div>
  );
}
