import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Search,
  CheckCircle2,
  History,
  Scale,
} from 'lucide-react';
import api from '../api/client';
import { InventoryItem, InventoryTransaction } from '../types';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'HISTORY'>('ITEMS');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // New Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Oziq-ovqat',
    unit: 'kg',
    initialStock: '0',
    minStock: '5',
    pricePerUnit: '0',
  });

  // Transaction Modal (Kirim / Chiqim)
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [txQuantity, setTxQuantity] = useState('');
  const [txNote, setTxNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, txRes] = await Promise.all([
        api.get('/inventory', {
          params: {
            search: search || undefined,
            category: categoryFilter,
            lowStockOnly: lowStockOnly ? 'true' : undefined,
          },
        }),
        api.get('/inventory/transactions'),
      ]);

      if (invRes.data.success) setInventory(invRes.data.inventory);
      if (txRes.data.success) setTransactions(txRes.data.transactions);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, lowStockOnly]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.unit) {
      alert('Nomi va o\'lchov birligini kiriting.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/inventory', itemForm);
      if (res.data.success) {
        setShowItemModal(false);
        setItemForm({
          name: '',
          category: 'Oziq-ovqat',
          unit: 'kg',
          initialStock: '0',
          minStock: '5',
          pricePerUnit: '0',
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !txQuantity || Number(txQuantity) <= 0) {
      alert('Mahsulot va miqdorni to\'g\'ri kiriting.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/inventory/transaction', {
        inventoryId: selectedItem.id,
        type: txType,
        quantity: Number(txQuantity),
        note: txNote || undefined,
      });

      if (res.data.success) {
        setShowTxModal(false);
        setTxQuantity('');
        setTxNote('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operatsiyani saqlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const openTx = (item: InventoryItem, type: 'IN' | 'OUT') => {
    setSelectedItem(item);
    setTxType(type);
    setTxQuantity('');
    setTxNote('');
    setShowTxModal(true);
  };

  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minStock).length;
  const totalStockItems = inventory.length;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Ombor tovarlari"
          value={`${totalStockItems} xil`}
          subtitle="Umumiy nazoratdagi mahsulotlar"
          icon={Warehouse}
          iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
        />
        <StatCard
          title="Kam qolgan mahsulotlar"
          value={`${lowStockCount} ta`}
          subtitle="Minimal me'yordan past"
          icon={AlertTriangle}
          iconColor={
            lowStockCount > 0
              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          }
        />
        <StatCard
          title="Ombor operatsiyalari"
          value={`${transactions.length} ta`}
          subtitle="Kirim va chiqimlar tarixi"
          icon={History}
          iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ITEMS'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-[#121B2B] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tovar qoldiqlari
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-[#121B2B] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Kirim/Chiqim tarixi
          </button>
        </div>

        {activeTab === 'ITEMS' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mahsulot nomi..."
                className="w-full pl-9 pr-3 py-2 bg-[#121B2B] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                lowStockOnly
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-[#121B2B] text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              ⚠️ Faqat kam qolganlar
            </button>

            {hasRole('ADMINISTRATOR', 'OMBORCHI') && (
              <button
                onClick={() => setShowItemModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold rounded-xl flex items-center space-x-2 shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Yangi mahsulot</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Inventory Items Table */}
      {activeTab === 'ITEMS' && (
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Nomi</th>
                  <th className="py-3.5 px-4 font-bold">Kategoriya</th>
                  <th className="py-3.5 px-4 font-bold">Birligi</th>
                  <th className="py-3.5 px-4 font-bold text-right">Boshlang'ich</th>
                  <th className="py-3.5 px-4 font-bold text-right">Joriy qoldiq</th>
                  <th className="py-3.5 px-4 font-bold text-right">Min. me'yor</th>
                  <th className="py-3.5 px-4 font-bold text-center">Holati</th>
                  <th className="py-3.5 px-4 font-bold text-center">Tezkor Harakat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Omborda mahsulotlar topilmadi
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{item.name}</td>
                        <td className="py-3 px-4 text-slate-400">{item.category}</td>
                        <td className="py-3 px-4 font-medium text-slate-300">{item.unit}</td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {item.initialStock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-sm">
                          <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isLow
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isLow ? '⚠️ Kam qoldi' : 'Yetarli'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => openTx(item, 'IN')}
                              title="Kirim qilish"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black font-bold text-[11px] transition-all border border-emerald-500/20 flex items-center space-x-1"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Kirim</span>
                            </button>
                            <button
                              onClick={() => openTx(item, 'OUT')}
                              title="Chiqim qilish"
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold text-[11px] transition-all border border-rose-500/20 flex items-center space-x-1"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Chiqim</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Transactions History Table */}
      {activeTab === 'HISTORY' && (
        <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Vaqti</th>
                  <th className="py-3.5 px-4 font-bold">Mahsulot</th>
                  <th className="py-3.5 px-4 font-bold">Turi</th>
                  <th className="py-3.5 px-4 font-bold text-right">Miqdor</th>
                  <th className="py-3.5 px-4 font-bold">Xodim</th>
                  <th className="py-3.5 px-4 font-bold">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Operatsiyalar tarixi mavjud emas
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(tx.createdAt)}</td>
                      <td className="py-3 px-4 font-bold text-white">{tx.inventory?.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            tx.type === 'IN'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {tx.type === 'IN' ? 'Kirim' : 'Chiqim'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {tx.type === 'IN' ? '+' : '-'}{tx.quantity} {tx.inventory?.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{tx.user?.fullName}</td>
                      <td className="py-3 px-4 text-slate-400">{tx.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal (Kirim / Chiqim) */}
      {showTxModal && selectedItem && (
        <Modal
          isOpen={showTxModal}
          onClose={() => setShowTxModal(false)}
          title={txType === 'IN' ? `Kirim Qilish: ${selectedItem.name}` : `Chiqim Qilish: ${selectedItem.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordTransaction} className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Joriy ombor qoldig'i:</span>
              <span className="font-extrabold text-white">{selectedItem.currentStock} {selectedItem.unit}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {txType === 'IN' ? 'Kirim qilinayotgan miqdor' : 'Chiqim qilinayotgan miqdor'} ({selectedItem.unit})
              </label>
              <input
                type="number"
                step="any"
                value={txQuantity}
                onChange={(e) => setTxQuantity(e.target.value)}
                placeholder={`Masalan: 5`}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 font-bold"
                required
                min="0.1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Izoh yoki hujjat raqami
              </label>
              <input
                type="text"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="Masalan: Bozor xaridi / Spisaniya"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all text-black ${
                  txType === 'IN' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300 text-white'
                }`}
              >
                {submitting ? 'Saqlanmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Inventory Item Modal */}
      {showItemModal && (
        <Modal
          isOpen={showItemModal}
          onClose={() => setShowItemModal(false)}
          title="Yangi Xom-ashyo / Tovar Qo'shish"
          maxWidth="md"
        >
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mahsulot nomi
              </label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Masalan: Pomidor"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategoriya
                </label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="Go'sht">Go'sht</option>
                  <option value="Sabzavot">Sabzavot</option>
                  <option value="Sut mahsuloti">Sut mahsuloti</option>
                  <option value="Non mahsuloti">Non mahsuloti</option>
                  <option value="Ichimlik">Ichimlik</option>
                  <option value="Qahva">Qahva</option>
                  <option value="Ziravor">Ziravor</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  O'lchov birligi
                </label>
                <select
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="kg">Kilogramm (kg)</option>
                  <option value="litr">Litr</option>
                  <option value="dona">Dona</option>
                  <option value="gramm">Gramm</option>
                  <option value="quti">Quti</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Boshlang'ich qoldiq
                </label>
                <input
                  type="number"
                  step="any"
                  value={itemForm.initialStock}
                  onChange={(e) => setItemForm({ ...itemForm, initialStock: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Minimal ogohlantirish me'yori
                </label>
                <input
                  type="number"
                  step="any"
                  value={itemForm.minStock}
                  onChange={(e) => setItemForm({ ...itemForm, minStock: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-md transition-all"
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
