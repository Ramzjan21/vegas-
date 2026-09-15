import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ShoppingBag,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Utensils,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { Order, Product, Table, Customer, Category, OrderStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { formatCurrency, formatOrderStatus, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // POS State
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number; comment: string }[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderDiscount, setOrderDiscount] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // View Order Modal
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const { hasRole, user } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', {
        params: {
          search: search || undefined,
          status: statusFilter,
        },
      });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const openCreateModal = async () => {
    try {
      const [tRes, pRes, cRes, custRes] = await Promise.all([
        api.get('/tables'),
        api.get('/products'),
        api.get('/categories'),
        api.get('/customers'),
      ]);
      if (tRes.data.success) setTables(tRes.data.tables);
      if (pRes.data.success) setProducts(pRes.data.products);
      if (cRes.data.success) setCategories(cRes.data.categories);
      if (custRes.data.success) setCustomers(custRes.data.customers);

      setCartItems([]);
      setSelectedTableId(tRes.data.tables[0]?.id.toString() || '');
      setSelectedCustomerId('');
      setOrderDiscount('0');
      setOrderNotes('');
      setShowCreateModal(true);
    } catch (e) {
      console.error('Failed to load POS data', e);
    }
  };

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, comment: '' }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const updateItemComment = (productId: number, comment: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, comment } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      alert('Stolni tanlang!');
      return;
    }
    if (cartItems.length === 0) {
      alert('Kamida bitta taom yoki ichimlik tanlang!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/orders', {
        tableId: Number(selectedTableId),
        customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          comment: item.comment || undefined,
        })),
        notes: orderNotes || undefined,
        discount: Number(orderDiscount) || 0,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Buyurtma yaratishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      if (viewOrder?.id === orderId) {
        setViewOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === Number(selectedCategory);
    const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartSubtotal = calculateSubtotal();
  const discountVal = Number(orderDiscount) || 0;
  const discounted = Math.max(0, cartSubtotal - discountVal);
  const serviceFee = (discounted * 10) / 100;
  const grandTotal = discounted + serviceFee;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buyurtma yoki mijoz qidirish..."
              className="w-full pl-9 pr-4 py-2 bg-[#121B2B] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#121B2B] border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Barcha holatlar</option>
            <option value="NEW">Yangi</option>
            <option value="PREPARING">Tayyorlanmoqda</option>
            <option value="READY">Tayyor</option>
            <option value="SERVED">Yetkazildi</option>
            <option value="PAID">To'langan</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>

        {/* Create Order Button */}
        {hasRole('ADMINISTRATOR', 'OFITSIANT') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yangi buyurtma yaratish</span>
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-[#121B2B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Raqam</th>
                <th className="py-3.5 px-4 font-bold">Stol</th>
                <th className="py-3.5 px-4 font-bold">Ofitsiant</th>
                <th className="py-3.5 px-4 font-bold">Holati</th>
                <th className="py-3.5 px-4 font-bold">Mahsulotlar</th>
                <th className="py-3.5 px-4 font-bold text-right">Summa</th>
                <th className="py-3.5 px-4 font-bold">Sana va Vaqt</th>
                <th className="py-3.5 px-4 font-bold text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusMeta = formatOrderStatus(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-400">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-bold text-white">
                          {order.table?.number}-stol ({order.table?.section})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {order.waiter?.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {order.items?.map((i) => `${i.product?.name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-white">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setViewOrder(order)}
                            title="Tafsilotlar"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-none focus:border-amber-400 font-semibold"
                            >
                              <option value="NEW">Yangi</option>
                              <option value="PREPARING">Tayyorlanmoqda</option>
                              <option value="READY">Tayyor</option>
                              <option value="SERVED">Yetkazildi</option>
                              <option value="CANCELLED">Bekor qilish</option>
                            </select>
                          )}
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

      {/* POS - Create Order Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Yangi Buyurtma Yaratish (POS)"
          maxWidth="4xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Menu selection (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Category tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === 'ALL'
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Barchasi
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id.toString())}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === c.id.toString()
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Product search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Taom yoki ichimlik qidirish..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Products list/grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group"
                  >
                    {prod.imageUrl && (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-20 object-cover rounded-xl mb-2"
                      />
                    )}
                    <div>
                      <h5 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {prod.name}
                      </h5>
                      <span className="text-[10px] text-slate-400">{prod.unit}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400">
                        {formatCurrency(prod.price)}
                      </span>
                      <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        +
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Cart & Order configuration (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Tanlangan mahsulotlar ({cartItems.length})</span>
                </h4>

                {/* Table & Customer selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Stol</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.number}-stol ({t.section})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Mijoz (ixtiyoriy)</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">Oddiy mehmon</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border-t border-slate-800/80 pt-2">
                  {cartItems.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-6">
                      Mahsulot qo'shish uchun chap tomondagi menyudan tanlang
                    </p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.product.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-[140px]">
                            {item.product.name}
                          </span>
                          <span className="font-bold text-amber-400">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            placeholder="Izoh (masalan: achchiqsiz)"
                            value={item.comment}
                            onChange={(e) => updateItemComment(item.product.id, e.target.value)}
                            className="text-[10px] px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 w-36 focus:outline-none"
                          />

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-white w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Calculations */}
                <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Mahsulotlar summasi:</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Chegirma (so'm):</span>
                    <input
                      type="number"
                      value={orderDiscount}
                      onChange={(e) => setOrderDiscount(e.target.value)}
                      className="w-24 px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-right text-xs text-white"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Xizmat haqi (10%):</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-1 border-t border-slate-800">
                    <span>Yakuniy summa:</span>
                    <span className="text-amber-400">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={submitting || cartItems.length === 0}
                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Yaratilmoqda...' : 'Buyurtmani tasdiqlash'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <Modal
          isOpen={Boolean(viewOrder)}
          onClose={() => setViewOrder(null)}
          title={`Buyurtma: ${viewOrder.orderNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <p className="font-bold text-white">{viewOrder.table?.number}-Stol ({viewOrder.table?.section})</p>
                <p className="text-slate-400">Ofitsiant: {viewOrder.waiter?.fullName}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${formatOrderStatus(viewOrder.status).color}`}>
                {formatOrderStatus(viewOrder.status).label}
              </span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {viewOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-800/60">
                  <div>
                    <span className="font-semibold text-white">{item.product?.name}</span>
                    <span className="text-slate-400 ml-1.5">x{item.quantity}</span>
                    {item.comment && (
                      <p className="text-[10px] text-amber-300 italic">{item.comment}</p>
                    )}
                  </div>
                  <span className="font-bold text-slate-200">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Mahsulotlar:</span>
                <span>{formatCurrency(viewOrder.subtotal)}</span>
              </div>
              {viewOrder.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Chegirma:</span>
                  <span>-{formatCurrency(viewOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Xizmat haqi:</span>
                <span>{formatCurrency(viewOrder.serviceFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white pt-1 border-t border-slate-800">
                <span>Jami:</span>
                <span className="text-amber-400">{formatCurrency(viewOrder.finalAmount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
