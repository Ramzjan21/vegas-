import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Clock,
  User,
  ShoppingBag,
  CreditCard,
  Filter,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import api from '../api/client';
import { Table, TableStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatTableStatus, formatOrderStatus } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // New Table Modal State (Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [newSection, setNewSection] = useState('Zal');
  const [savingTable, setSavingTable] = useState(false);

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tables', {
        params: {
          section: selectedSection,
          status: selectedStatus,
        },
      });
      if (res.data.success) {
        setTables(res.data.tables);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [selectedSection, selectedStatus]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTable(true);
      const res = await api.post('/tables', {
        number: Number(newNumber),
        capacity: Number(newCapacity),
        section: newSection,
      });
      if (res.data.success) {
        setShowAddModal(false);
        setNewNumber('');
        fetchTables();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSavingTable(false);
    }
  };

  const handleUpdateStatus = async (tableId: number, status: TableStatus) => {
    try {
      await api.patch(`/tables/${tableId}/status`, { status });
      fetchTables();
      if (selectedTable?.id === tableId) {
        setSelectedTable((prev) => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Section Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#121B2B] border border-slate-800 rounded-2xl overflow-x-auto">
          {['ALL', 'Zal', 'Terassa', 'VIP'].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedSection === sec
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {sec === 'ALL' ? 'Barcha hududlar' : sec}
            </button>
          ))}
        </div>

        {/* Status Filter & Add Table */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Barcha holatlar</option>
            <option value="EMPTY">🟢 Bo'sh stollar</option>
            <option value="OCCUPIED">🟡 Band stollar</option>
            <option value="RESERVED">🟣 Rezervatsiya</option>
          </select>

          {hasRole('ADMINISTRATOR') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi stol</span>
            </button>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-[#121B2B] rounded-3xl border border-slate-800">
          <p className="text-slate-400 text-sm">Stollar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const statusInfo = formatTableStatus(table.status);
            const isOccupied = table.status === 'OCCUPIED';
            const isReserved = table.status === 'RESERVED';

            return (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-lg hover:shadow-2xl hover:-translate-y-1 ${statusInfo.color}`}
              >
                {/* Header: Table number and section */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0F172A] border border-slate-700/80 flex items-center justify-center text-white font-extrabold text-lg shadow-md group-hover:border-amber-400 transition-colors">
                    {table.number}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {table.section}
                    </span>
                  </div>
                </div>

                {/* Capacity & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity} kishilik</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.badge}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Dynamic Content based on status */}
                {isOccupied && table.activeOrder ? (
                  <div className="pt-3 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Buyurtma:</span>
                      <span className="text-amber-400 font-bold">{table.activeOrder.orderNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Summa:</span>
                      <span className="text-white font-extrabold">{formatCurrency(table.activeOrder.finalAmount)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 pt-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{table.activeOrder.waiter?.fullName}</span>
                    </div>
                  </div>
                ) : isReserved && table.activeReservation ? (
                  <div className="pt-3 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-400 font-bold truncate">
                        {table.activeReservation.customerName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{table.activeReservation.reservationTime}</span>
                      <span>({table.activeReservation.guestsCount} kishi)</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-800/80 text-center">
                    <span className="text-xs text-emerald-400 font-medium">Mijoz qabul qilishga tayyor</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Table Details Modal */}
      {selectedTable && (
        <Modal
          isOpen={Boolean(selectedTable)}
          onClose={() => setSelectedTable(null)}
          title={`${selectedTable.number}-Stol Tafsilotlari (${selectedTable.section})`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Sig'imi:</span>
                <p className="text-sm font-bold text-white">{selectedTable.capacity} kishilik stol</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Holat:</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${formatTableStatus(selectedTable.status).badge}`}>
                  {formatTableStatus(selectedTable.status).label}
                </span>
              </div>
            </div>

            {/* If Occupied: Order Information */}
            {selectedTable.status === 'OCCUPIED' && selectedTable.activeOrder ? (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>Joriy Buyurtma: {selectedTable.activeOrder.orderNumber}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ofitsiant: {selectedTable.activeOrder.waiter?.fullName}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${formatOrderStatus(selectedTable.activeOrder.status).color}`}>
                    {formatOrderStatus(selectedTable.activeOrder.status).label}
                  </span>
                </div>

                {/* Order Items list */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedTable.activeOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40">
                      <div>
                        <span className="font-semibold text-white">{item.product?.name}</span>
                        <span className="text-slate-400 ml-1.5">x{item.quantity}</span>
                        {item.comment && (
                          <p className="text-[10px] text-amber-300 italic">{item.comment}</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-300">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Final */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Jami hisob (xizmat haqi bilan):</span>
                  <span className="text-base font-extrabold text-amber-400">
                    {formatCurrency(selectedTable.activeOrder.finalAmount)}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      navigate('/orders');
                    }}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all text-center"
                  >
                    Buyurtmani tahrirlash
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      navigate('/cashier');
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>To'lovga o'tish</span>
                  </button>
                </div>
              </div>
            ) : selectedTable.status === 'RESERVED' && selectedTable.activeReservation ? (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <CalendarDays className="w-4 h-4" />
                  <span>Mijoz Rezervatsiyasi</span>
                </div>
                <p className="text-xs text-white">
                  <strong>Mijoz:</strong> {selectedTable.activeReservation.customerName} (
                  {selectedTable.activeReservation.customerPhone})
                </p>
                <p className="text-xs text-white">
                  <strong>Vaqt:</strong> {selectedTable.activeReservation.reservationTime},{' '}
                  {selectedTable.activeReservation.guestsCount} kishilik
                </p>
                {selectedTable.activeReservation.notes && (
                  <p className="text-xs text-slate-400">
                    <strong>Izoh:</strong> {selectedTable.activeReservation.notes}
                  </p>
                )}

                <div className="pt-3 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      navigate('/orders');
                    }}
                    className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition-all"
                  >
                    Buyurtma ochish
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 mb-4">Stol hozirda bo'sh va yangi buyurtmaga tayyor.</p>
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    navigate('/orders');
                  }}
                  className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black rounded-xl text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi buyurtma yaratish</span>
                </button>
              </div>
            )}

            {/* Quick Status Override Buttons for Staff */}
            <div className="pt-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 font-semibold mb-2">Stol holatini qo'lda o'zgartirish:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedTable.id, 'EMPTY')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedTable.status === 'EMPTY'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  Bo'sh qilish
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTable.id, 'OCCUPIED')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedTable.status === 'OCCUPIED'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  Band qilish
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTable.id, 'RESERVED')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedTable.status === 'RESERVED'
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                  }`}
                >
                  Rezerv qilish
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Table Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Yangi Stol Qo'shish"
          maxWidth="md"
        >
          <form onSubmit={handleCreateTable} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Stol raqami
              </label>
              <input
                type="number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Masalan: 11"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sig'imi (odam soni)
              </label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                placeholder="Masalan: 4"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hudud / Bo'lim
              </label>
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="Zal">Asosiy Zal</option>
                <option value="Terassa">Terassa (Ochiq havo)</option>
                <option value="VIP">VIP Xona</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={savingTable}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {savingTable ? 'Saqlanmoqda...' : 'Stolni qo\'shish'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
