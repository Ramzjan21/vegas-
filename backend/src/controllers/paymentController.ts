import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit, createNotification } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentMethod, date, cashierId } = req.query;

    const where: any = {};
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = String(paymentMethod);
    if (cashierId && cashierId !== 'ALL') where.cashierId = Number(cashierId);
    if (date) {
      const d = new Date(String(date));
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      where.paidAt = { gte: startOfDay, lte: endOfDay };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: {
        cashier: { select: { id: true, fullName: true } },
        order: {
          include: {
            table: true,
            waiter: { select: { id: true, fullName: true } },
            customer: true,
            items: { include: { product: true } },
          },
        },
      },
    });

    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, paymentMethod = 'CASH', cashReceived, discount } = req.body;

    if (!orderId) {
      res.status(400).json({ success: false, message: 'Buyurtma ID si kiritilishi shart.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        table: true,
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Buyurtma topilmadi.' });
      return;
    }

    if (order.status === 'PAID') {
      res.status(400).json({ success: false, message: 'Ushbu buyurtma uchun allaqachon to\'lov qilingan.' });
      return;
    }

    const cashierId = req.user ? req.user.id : 1;

    // Recalculate if custom discount was applied at checkout
    let finalAmount = order.finalAmount;
    let appliedDiscount = order.discount;
    if (discount !== undefined && Number(discount) >= 0) {
      appliedDiscount = Number(discount);
      const settings = await prisma.systemSettings.findFirst();
      const feePercent = settings ? settings.serviceFeePercent : 10;
      const subtotalAfterDiscount = Math.max(0, order.subtotal - appliedDiscount);
      const serviceFee = (subtotalAfterDiscount * feePercent) / 100;
      finalAmount = subtotalAfterDiscount + serviceFee;

      await prisma.order.update({
        where: { id: order.id },
        data: { discount: appliedDiscount, serviceFee, finalAmount },
      });
    }

    const received = cashReceived ? parseFloat(cashReceived) : finalAmount;
    const changeGiven = paymentMethod === 'CASH' ? Math.max(0, received - finalAmount) : 0;

    // Create Payment
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        cashierId,
        amount: finalAmount,
        paymentMethod,
        cashReceived: received,
        changeGiven,
      },
    });

    // Mark Order as PAID
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID' },
    });

    // Check if table has other active orders; if not, free up table
    const otherActiveOrders = await prisma.order.count({
      where: {
        tableId: order.tableId,
        status: { in: ['NEW', 'PREPARING', 'READY', 'SERVED'] },
        id: { not: order.id },
      },
    });

    if (otherActiveOrders === 0) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'EMPTY' },
      });
    }

    // Update customer spending stats if order has customer
    if (order.customerId) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: {
          visitsCount: { increment: 1 },
          totalSpent: { increment: finalAmount },
          lastVisitAt: new Date(),
        },
      });
    }

    // Auto deduct inventory for products linked to inventory
    for (const item of order.items) {
      if (item.product.inventoryId) {
        const inv = await prisma.inventory.findUnique({ where: { id: item.product.inventoryId } });
        if (inv) {
          const newStock = Math.max(0, inv.currentStock - item.quantity);
          await prisma.inventory.update({
            where: { id: inv.id },
            data: { currentStock: newStock },
          });

          await prisma.inventoryTransaction.create({
            data: {
              inventoryId: inv.id,
              userId: cashierId,
              type: 'OUT',
              quantity: item.quantity,
              note: `Buyurtma ${order.orderNumber} bo'yicha sarflandi`,
            },
          });

          // Check if now low stock
          if (newStock <= inv.minStock) {
            await createNotification(
              'Ombor ogohlantirishi!',
              `"${inv.name}" qoldig'i kamaydi (${newStock} ${inv.unit} qoldi, min: ${inv.minStock} ${inv.unit})`,
              'LOW_STOCK'
            );
          }
        }
      }
    }

    await logAudit(
      req.user?.id,
      'PAYMENT_RECEIVED',
      'Payment',
      payment.id,
      `${order.orderNumber} uchun ${finalAmount} so'm to'lov qabul qilindi (${paymentMethod})`,
      req.ip
    );

    await createNotification(
      'To\'lov qabul qilindi',
      `${order.orderNumber} buyurtmasi uchun ${finalAmount.toLocaleString('uz-UZ')} so'm to'landi`,
      'PAYMENT'
    );

    // Fetch full receipt details
    const settings = await prisma.systemSettings.findFirst();
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        waiter: { select: { fullName: true } },
        items: { include: { product: true } },
        payment: { include: { cashier: { select: { fullName: true } } } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi.',
      payment,
      order: updatedOrder,
      receipt: {
        settings,
        order: updatedOrder,
        payment,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        waiter: { select: { fullName: true, phone: true } },
        customer: true,
        items: { include: { product: true } },
        payment: { include: { cashier: { select: { fullName: true } } } },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Buyurtma topilmadi.' });
      return;
    }

    const settings = await prisma.systemSettings.findFirst();

    res.json({
      success: true,
      receipt: {
        settings,
        order,
        payment: order.payment,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
