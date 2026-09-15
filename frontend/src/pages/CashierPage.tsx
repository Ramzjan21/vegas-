import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  Receipt,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';
import api from '../api/client';
import { Order, Payment } from '../types';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const CashierPage: React.FC = () => {
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [processing, setProcessing] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, paymentsRes] = await Promise.all([
        api.get('/orders', { params: { status: 'ALL' } }),
        api.get('/payments'),
      ]);

      if (ordersRes.data.success) {
        // Filter out PAID and CANCELLED
        const active = ordersRes.data.orders.filter(
          (o: Order) => o.status !== 'PAID' && o.status !== 'CANCELLED'
        );
        setUnpaidOrders(active);
      }

      if (paymentsRes.data.success) {
        setRecentPayments(paymentsRes.data.payments);
      }
    } catch (err) {
      console.error('Error fetching cashier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCheckout = (order: Order) => {
    setSelectedOrder(order);
    setPaymentMethod('CASH');
    setDiscountAmount(order.discount.toString());
    setCashReceived(order.finalAmount.toString());
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setProcessing(true);
      const res = await api.post('/payments', {
        orderId: selectedOrder.id,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? Number(cashReceived) : undefined,
        discount: Number(discountAmount) || 0,
      });

      if (res.data.success) {
        setSelectedOrder(null);
        setReceiptData(res.data.receipt);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'To\'lovda xatolik yuz berdi');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for current checkout
  const subtotal = selectedOrder?.subtotal || 0;
  const disc = Number(discountAmount) || 0;
  const afterDiscount = Math.max(0, subtotal - disc);
  const serviceFee = (afterDiscount * 10) / 100;
  const finalPayable = afterDiscount + serviceFee;
  const received = Number(cashReceived) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, received - finalPayable) : 0;

  // Revenue stats
  const totalRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashRevenue = recentPayments
    .filter((p) => p.paymentMethod === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);
  const cardRevenue = recentPayments
    .filter((p) => p.paymentMethod === 'CARD')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Cash Register Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kassa jami tushumi"
          value={formatCurrency(totalRevenue)}
          subtitle="Barcha qabul qilingan to'lovlar"
          icon={DollarSign}
          iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          title="Naqd to'lovlar"
          value={formatCurrency(cashRevenue)}
          subtitle="Naqd hisob-kitob"
          icon={Banknote}
          iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <StatCard
          title="Bank karta to'lovlari"
          value={formatCurrency(cardRevenue)}
          subtitle="Terminal / Humo / Uzcard"
          icon={CreditCard}
          iconColor="text-sky-400 bg-sky-500/10 border-sky-500/20"
        />
        <StatCard
          title="Kutilayotgan hisoblar"
          value={`${unpaidOrders.length} ta`}
          subtitle="To'lanmagan buyurtmalar"
          icon={Clock}
          iconColor="text-rose-400 bg-rose-500/10 border-rose-500/20"
        />
      </div>

      {/* Main Grid: Unpaid Orders & Recent Completed Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unpaid Orders Waiting for Payment (7 cols) */}
        <div className="lg:col-span-7 bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>To'lovga Tayyor Buyurtmalar</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mijoz hisobini yopish va kassa chekini chiqarish
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
              {unpaidOrders.length} ta faol buyurtma
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {unpaidOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Hozirda to'lov kutilayotgan buyurtmalar yo'q. Barcha stollar hisoblari yopilgan.
              </div>
            ) : (
              unpaidOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-extrabold text-amber-400 text-base shrink-0">
                      S-{order.table?.number}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white">{order.orderNumber}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({order.table?.section})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ofitsiant: <strong className="text-slate-300">{order.waiter?.fullName}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {order.items?.length || 0} xil mahsulot • {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Summa</span>
                      <span className="text-base font-extrabold text-amber-400">
                        {formatCurrency(order.finalAmount)}
                      </span>
                    </div>

                    <button
                      onClick={() => openCheckout(order)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>To'lov olish</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Completed Payments (5 cols) */}
        <div className="lg:col-span-5 bg-[#121B2B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Yopilgan Cheklar Tarixi</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">So'nggi 20 ta</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {recentPayments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                To'lovlar tarixi mavjud emas
              </div>
            ) : (
              recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl border ${
                        p.paymentMethod === 'CASH'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}
                    >
                      {p.paymentMethod === 'CASH' ? (
                        <Banknote className="w-4 h-4" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">
                          {p.order?.orderNumber || `Chek #${p.id}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.order?.table?.number ? `S-${p.order.table.number}` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {p.paymentMethod === 'CASH' ? 'Naqd' : 'Bank karta'} • {formatDateTime(p.paidAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </span>
                    <button
                      onClick={async () => {
                        const r = await api.get(`/payments/receipt/${p.orderId}`);
                        if (r.data.success) setReceiptData(r.data.receipt);
                      }}
                      className="block text-[10px] text-slate-400 hover:text-amber-400 ml-auto transition-colors"
                    >
                      Chekni ko'rish
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`To'lovni Qabul Qilish: ${selectedOrder.orderNumber}`}
          maxWidth="lg"
        >
          <form onSubmit={handleProcessPayment} className="space-y-4">
            {/* Table and Waiter overview */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="font-bold text-white">
                  {selectedOrder.table?.number}-Stol ({selectedOrder.table?.section})
                </span>
                <p className="text-slate-400">Ofitsiant: {selectedOrder.waiter?.fullName}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Vaqti:</span>
                <p className="text-slate-300 font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
            </div>

            {/* Items summary */}
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border-b border-slate-800 pb-2">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-xs py-1">
                  <span className="text-slate-300">
                    {item.product?.name} <strong className="text-slate-400">x{item.quantity}</strong>
                  </span>
                  <span className="font-semibold text-white">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Discount & Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Mahsulotlar jami:</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center space-x-1">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chegirma summasi (so'm):</span>
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-32 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                  min="0"
                />
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Xizmat haqi (10%):</span>
                <span className="text-white">{formatCurrency(serviceFee)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>To'lanishi kerak:</span>
                <span className="text-amber-400">{formatCurrency(finalPayable)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                To'lov turi:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Naqd pul</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                    paymentMethod === 'CARD'
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bank karta</span>
                </button>
              </div>
            </div>

            {/* Cash Input & Change Calculation */}
            {paymentMethod === 'CASH' && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold">
                    Mijoz bergan summa:
                  </label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-36 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-right text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                    placeholder="Summa"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-semibold">Qaytim (Sdacha):</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {processing ? 'Bajarilmoqda...' : 'To\'lovni qabul qilish'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {receiptData && (
        <Modal
          isOpen={Boolean(receiptData)}
          onClose={() => setReceiptData(null)}
          title="Kassa Cheki (80mm)"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {/* Printable Receipt Area */}
            <div
              id="printable-receipt"
              className="p-6 bg-white text-black font-mono text-xs rounded-xl shadow-inner space-y-3"
            >
              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed border-gray-400 pb-3">
                <h2 className="text-base font-black uppercase tracking-wider">
                  {receiptData.settings?.cafeName || 'VEGAS CAFE & LOUNGE'}
                </h2>
                <p className="text-[10px] text-gray-600">
                  {receiptData.settings?.address}
                </p>
                <p className="text-[10px] text-gray-600">
                  Tel: {receiptData.settings?.phone}
                </p>
                <p className="text-[10px] font-bold mt-1 text-gray-800">
                  {receiptData.settings?.receiptHeader}
                </p>
              </div>

              {/* Order Meta */}
              <div className="space-y-0.5 text-[11px] border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between">
                  <span>Chek raqami:</span>
                  <span className="font-bold">{receiptData.order?.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stol:</span>
                  <span className="font-bold">
                    {receiptData.order?.table?.number}-stol ({receiptData.order?.table?.section})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ofitsiant:</span>
                  <span>{receiptData.order?.waiter?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sana va vaqt:</span>
                  <span>{formatDateTime(receiptData.payment?.paidAt)}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-b border-dashed border-gray-400 pb-2 space-y-1">
                <div className="flex justify-between font-bold text-[10px] uppercase text-gray-500 pb-0.5">
                  <span>Nomi</span>
                  <span>Miqdor x Narx</span>
                  <span>Jami</span>
                </div>
                {receiptData.order?.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span className="font-semibold truncate max-w-[120px]">{it.product?.name}</span>
                    <span>{it.quantity} x {(it.unitPrice / 1000).toFixed(0)}k</span>
                    <span className="font-bold">{(it.totalPrice).toLocaleString('uz-UZ')}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between">
                  <span>Mahsulotlar summasi:</span>
                  <span>{receiptData.order?.subtotal?.toLocaleString('uz-UZ')} so'm</span>
                </div>
                {receiptData.order?.discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Chegirma:</span>
                    <span>-{receiptData.order?.discount?.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Xizmat haqi ({receiptData.settings?.serviceFeePercent || 10}%):</span>
                  <span>{receiptData.order?.serviceFee?.toLocaleString('uz-UZ')} so'm</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-300">
                  <span>JAMI:</span>
                  <span>{receiptData.payment?.amount?.toLocaleString('uz-UZ')} so'm</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>To'lov turi:</span>
                  <span className="font-bold">
                    {receiptData.payment?.paymentMethod === 'CASH' ? 'NAQD PUL' : 'BANK KARTA'}
                  </span>
                </div>
                {receiptData.payment?.cashReceived && (
                  <div className="flex justify-between">
                    <span>Qabul qilindi:</span>
                    <span>{receiptData.payment.cashReceived.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                )}
                {receiptData.payment?.changeGiven > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Qaytim:</span>
                    <span>{receiptData.payment.changeGiven.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-600 space-y-1">
                <p className="font-medium">{receiptData.settings?.receiptFooter}</p>
                <p className="tracking-widest font-mono text-[9px]">*** VEGAS POS SYSTEM ***</p>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Chekni chop etish</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
