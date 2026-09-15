import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Utensils,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import api from '../api/client';
import { Product, Category, InventoryItem } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const MenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');

  // Add / Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    unit: 'porsiya',
    description: '',
    imageUrl: '',
    inventoryId: '',
    isAvailable: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, iRes] = await Promise.all([
        api.get('/products', {
          params: {
            categoryId: selectedCategory,
            search: search || undefined,
            isAvailable: availabilityFilter,
          },
        }),
        api.get('/categories'),
        api.get('/inventory').catch(() => ({ data: { inventory: [] } })),
      ]);

      if (pRes.data.success) setProducts(pRes.data.products);
      if (cRes.data.success) setCategories(cRes.data.categories);
      if (iRes.data.success) setInventoryList(iRes.data.inventory || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, search, availabilityFilter]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id.toString() || '',
      price: '',
      unit: 'porsiya',
      description: '',
      imageUrl: '',
      inventoryId: '',
      isAvailable: true,
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      categoryId: prod.categoryId.toString(),
      price: prod.price.toString(),
      unit: prod.unit,
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      inventoryId: prod.inventoryId ? prod.inventoryId.toString() : '',
      isAvailable: prod.isAvailable,
    });
    setShowProductModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price) {
      alert('Nomi, kategoriya va narx kiritilishi shart.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowProductModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      await api.patch(`/products/${prod.id}/toggle-availability`);
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isAvailable: !p.isAvailable } : p))
      );
    } catch (err) {
      console.error('Failed to toggle availability', err);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${productToDelete.id}`);
      setProductToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'O\'chirishda xatolik yuz berdi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center space-x-1.5 p-1 bg-[#121B2B] border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Barcha taomlar ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id.toString())}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat.id.toString()
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mahsulot nomi bo'yicha qidiruv..."
              className="w-full pl-9 pr-4 py-2 bg-[#121B2B] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Barchasi</option>
            <option value="true">Faqat mavjudlar</option>
            <option value="false">Tugaganlar</option>
          </select>
        </div>

        {hasRole('ADMINISTRATOR') && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yangi mahsulot qo'shish</span>
          </button>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-[#121B2B] rounded-3xl border border-slate-800">
          <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Ushbu parametrlar bo'yicha mahsulotlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((prod) => (
            <div
              key={prod.id}
              className={`bg-[#121B2B] border rounded-3xl p-4 shadow-xl flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-2xl ${
                prod.isAvailable
                  ? 'border-slate-800/90 hover:border-slate-700'
                  : 'border-rose-950/40 opacity-70'
              }`}
            >
              <div>
                {/* Product Image */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-slate-900 border border-slate-800">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}

                  {/* Availability badge */}
                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md ${
                      prod.isAvailable
                        ? 'bg-emerald-500/90 text-white backdrop-blur-sm'
                        : 'bg-rose-500/90 text-white backdrop-blur-sm'
                    }`}
                  >
                    {prod.isAvailable ? 'Mavjud' : 'Tugagan'}
                  </span>

                  {/* Category badge */}
                  <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/70 text-slate-200 backdrop-blur-sm border border-white/10">
                    {prod.category?.name}
                  </span>
                </div>

                {/* Info */}
                <h4 className="text-sm font-bold text-white mb-1">{prod.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                  {prod.description || 'Tavsif berilmagan'}
                </p>
              </div>

              {/* Price & Actions */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Narxi</span>
                    <span className="text-base font-extrabold text-amber-400">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{prod.unit}</span>
                </div>

                {hasRole('ADMINISTRATOR') && (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleAvailability(prod)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                        prod.isAvailable
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {prod.isAvailable ? 'Tugatish' : 'Mavjud qilish'}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setProductToDelete(prod)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <Modal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          title={editingProduct ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot Qo\'shish'}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mahsulot nomi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Vegas Ribeye Steyk"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategoriya
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Narxi (so'm)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Masalan: 135000"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  O'lchov birligi
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="porsiya">Porsiya</option>
                  <option value="dona">Dona</option>
                  <option value="stakan">Stakan</option>
                  <option value="choynak">Choynak</option>
                  <option value="grafin">Grafin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rasm havolasi (URL)
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ombor xom-ashyosiga bog'lash (avtomatik sarf uchun)
              </label>
              <select
                value={formData.inventoryId}
                onChange={(e) => setFormData({ ...formData, inventoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="">Bog'lanmagan</option>
                {inventoryList.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.currentStock} {inv.unit} qoldiq)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tavsif va tarkibi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Taom tarkibi va xususiyatlari..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Saqlanmoqda...' : editingProduct ? 'Saqlash' : 'Qo\'shish'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Product Dialog */}
      {productToDelete && (
        <ConfirmDialog
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleDeleteProduct}
          title="Mahsulotni o'chirish"
          message={`Haqiqatan ham "${productToDelete.name}" mahsulotini o'chirmoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.`}
          confirmText="Ha, o'chirish"
          isLoading={deleting}
          isDanger={true}
        />
      )}
    </div>
  );
};
