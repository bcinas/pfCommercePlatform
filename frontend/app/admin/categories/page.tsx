'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
  type CategoryFormData,
} from '@/app/lib/adminApi';

const BACKEND_URL = 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-');
}

// ─── Category Modal ───────────────────────────────────────────────────────────

interface CategoryModalProps {
  category: AdminCategory | null;
  onClose: () => void;
  onSave: (data: CategoryFormData) => Promise<void>;
  saving: boolean;
  error: string | null;
}

function CategoryModal({
  category,
  onClose,
  onSave,
  saving,
  error,
}: CategoryModalProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [image, setImage] = useState(category?.image ?? '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({ name: name.trim(), slug: slug.trim(), image: image.trim() });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {category ? 'Edit Category' : 'Add Category'}
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
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
              <span className="text-gray-400 text-xs ml-1">(auto-generated)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setSlug(e.target.value);
              }}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
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
              {category ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">Delete?</span>
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminCategories()
      .then(setCategories)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleModalSave(data: CategoryFormData) {
    setModalSaving(true);
    setModalError(null);
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory._id, data);
        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? updated : c)),
        );
      } else {
        const created = await createCategory(data);
        setCategories((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setModalSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function openAdd() {
    setEditingCategory(null);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditingCategory(category);
    setModalError(null);
    setModalOpen(true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Slug</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Image</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const imgSrc = category.image
                    ? category.image.startsWith('http')
                      ? category.image
                      : `${BACKEND_URL}${category.image}`
                    : null;

                  return (
                    <tr
                      key={category._id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={category.name}
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
                      <td className="px-6 py-4">
                        {confirmDeleteId === category._id ? (
                          <DeleteConfirm
                            onConfirm={() => handleDelete(category._id)}
                            onCancel={() => setConfirmDeleteId(null)}
                            deleting={deletingId === category._id}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(category)}
                              className="flex items-center gap-1 border border-gray-300 text-gray-700 rounded-lg px-2.5 py-1 text-xs hover:bg-gray-50 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(category._id)}
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
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleModalSave}
          saving={modalSaving}
          error={modalError}
        />
      )}
    </div>
  );
}
