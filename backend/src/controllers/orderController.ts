import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit, createNotification } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, tableId, waiterId, search, date } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (tableId && tableId !== 'ALL') where.tableId = Number(tableId);
    if (waiterId && waiterId !== 'ALL') where.waiterId = Number(waiterId);
    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search) } },
        { customer: { fullName: { contains: String(search) } } },
      ];
    }
    if (date) {
      const d = new Date(String(date));
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        waiter: { select: { id: true, fullName: true, username: true } },
        customer: true,
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
        payment: true,
      },
    });

    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: { select: { id: true, fullName: true, username: true, phone: true } },
        customer: true,
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
        payment: {
          include: {
            cashier: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Buyurtma topilmadi.' });
      return;
    }

    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tableId, customerId, items, notes, discount = 0 } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Stol va kamida bitta mahsulot tanlanishi kerak.' });
      return;
    }

    const waiterId = req.user ? req.user.id : 1;

    // Get system settings for service fee
    const settings = await prisma.systemSettings.findFirst();
    const serviceFeePercent = settings ? settings.serviceFeePercent : 10;

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: Number(item.productId) } });
      if (!product) {
        res.status(400).json({ success: false, message: `ID: ${item.productId} bo'lgan mahsulot topilmadi.` });
        return;
      }
      const qty = Number(item.quantity) || 1;
      const itemTotal = product.price * qty;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: itemTotal,
        comment: item.comment || null,
      });
    }

    const discountAmount = Number(discount) || 0;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const serviceFee = (discountedSubtotal * serviceFeePercent) / 100;
    const finalAmount = discountedSubtotal + serviceFee;

    // Generate readable order number: VGS-{number}
    const count = await prisma.order.count();
    const orderNumber = `VGS-${1000 + count + 1}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId: Number(tableId),
        waiterId,
        customerId: customerId ? Number(customerId) : null,
        status: 'NEW',
        subtotal,
        discount: discountAmount,
        serviceFee,
        finalAmount,
        notes: notes || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        waiter: { select: { fullName: true } },
        items: { include: { product: true } },
      },
    });

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: Number(tableId) },
      data: { status: 'OCCUPIED' },
    });

    await logAudit(
      req.user?.id,
      'CREATE_ORDER',
      'Order',
      order.id,
      `${order.table.number}-stol uchun yangi buyurtma (${order.orderNumber}) yaratildi. Jami: ${finalAmount} so'm`,
      req.ip
    );

    await createNotification(
      'Yangi buyurtma!',
      `${order.table.number}-stol uchun yangi ${order.orderNumber} buyurtmasi qabul qilindi`,
      'NEW_ORDER'
    );

    res.status(201).json({ success: true, message: 'Buyurtma muvaffaqiyatli yaratildi.', order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ['NEW', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Noto\'g\'ri buyurtma holati.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      res.status(404).json({ success: false, message: 'Buyurtma topilmadi.' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { table: true, waiter: true },
    });

    // If cancelled, free up the table if no other active order
    if (status === 'CANCELLED') {
      const activeCount = await prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { in: ['NEW', 'PREPARING', 'READY', 'SERVED'] },
          id: { not: order.id },
        },
      });
      if (activeCount === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'EMPTY' },
        });
      }
    }

    // If ready, notify waiter
    if (status === 'READY') {
      await createNotification(
        'Buyurtma tayyor!',
        `${order.table.number}-stol uchun ${order.orderNumber} buyurtmasi tayyor bo'ldi`,
        'ORDER_READY'
      );
    }

    await logAudit(
      req.user?.id,
      'UPDATE_ORDER_STATUS',
      'Order',
      id,
      `${order.orderNumber} buyurtma holati ${status} ga o'zgartirildi`,
      req.ip
    );

    res.json({ success: true, message: 'Buyurtma holati yangilandi.', order: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { items, notes, discount } = req.body;

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) {
      res.status(404).json({ success: false, message: 'Buyurtma topilmadi.' });
      return;
    }

    if (order.status === 'PAID') {
      res.status(400).json({ success: false, message: 'To\'langan buyurtmani tahrirlab bo\'lmaydi.' });
      return;
    }

    const settings = await prisma.systemSettings.findFirst();
    const serviceFeePercent = settings ? settings.serviceFeePercent : 10;

    let subtotal = 0;
    const newItemsData: any[] = [];

    if (items && Array.isArray(items)) {
      // Remove old items and re-create
      await prisma.orderItem.deleteMany({ where: { orderId: id } });

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: Number(item.productId) } });
        if (!product) continue;
        const qty = Number(item.quantity) || 1;
        const total = product.price * qty;
        subtotal += total;

        newItemsData.push({
          productId: product.id,
          orderId: id,
          quantity: qty,
          unitPrice: product.price,
          totalPrice: total,
          comment: item.comment || null,
        });
      }

      await prisma.orderItem.createMany({ data: newItemsData });
    } else {
      subtotal = order.subtotal;
    }

    const discountAmount = discount !== undefined ? Number(discount) : order.discount;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const serviceFee = (discountedSubtotal * serviceFeePercent) / 100;
    const finalAmount = discountedSubtotal + serviceFee;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        subtotal,
        discount: discountAmount,
        serviceFee,
        finalAmount,
        notes: notes !== undefined ? notes : order.notes,
      },
      include: {
        table: true,
        items: { include: { product: true } },
      },
    });

    await logAudit(req.user?.id, 'UPDATE_ORDER', 'Order', id, `${order.orderNumber} buyurtmasi tahrirlandi`, req.ip);

    res.json({ success: true, message: 'Buyurtma yangilandi.', order: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
