import { Request, Response } from 'express';
import prisma from '../config/db';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Bugungi to'langan buyurtmalar va jami savdo
    const todayPayments = await prisma.payment.findMany({
      where: {
        paidAt: {
          gte: today,
        },
      },
    });

    const todaySales = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayOrdersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 2. Faol buyurtmalar (NEW, PREPARING, READY, SERVED)
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: {
          in: ['NEW', 'PREPARING', 'READY', 'SERVED'],
        },
      },
    });

    // 3. Stollar holati
    const emptyTablesCount = await prisma.table.count({ where: { status: 'EMPTY' } });
    const occupiedTablesCount = await prisma.table.count({ where: { status: 'OCCUPIED' } });
    const reservedTablesCount = await prisma.table.count({ where: { status: 'RESERVED' } });

    // 4. Omborda kam qolgan mahsulotlar soni
    const allInventory = await prisma.inventory.findMany();
    const lowStockItems = allInventory.filter((item) => item.currentStock <= item.minStock);

    // 5. Eng ko'p sotilgan 5 ta mahsulot (Top products)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'PAID',
        },
      },
      include: {
        product: true,
      },
    });

    const productSalesMap: Record<number, { name: string; quantity: number; revenue: number; image?: string | null }> = {};
    for (const item of orderItems) {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          image: item.product.imageUrl,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.totalPrice;
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 6. So'nggi 5 ta buyurtma
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        waiter: { select: { fullName: true } },
        items: { include: { product: true } },
      },
    });

    res.json({
      success: true,
      stats: {
        todaySales,
        todayOrdersCount,
        activeOrdersCount,
        emptyTablesCount,
        occupiedTablesCount,
        reservedTablesCount,
        lowStockCount: lowStockItems.length,
        averageCheck: todayPayments.length > 0 ? Math.round(todaySales / todayPayments.length) : 0,
      },
      topProducts,
      recentOrders,
      lowStockItems: lowStockItems.slice(0, 5),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDashboardCharts = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Oxirgi 7 kunlik savdo dinamikasi
    const days: { date: string; label: string; sales: number; count: number }[] = [];
    const uzbekDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const payments = await prisma.payment.findMany({
        where: {
          paidAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const dayName = uzbekDays[d.getDay()];
      const formattedDate = `${d.getDate()}/${d.getMonth() + 1}`;

      days.push({
        date: formattedDate,
        label: `${dayName} (${formattedDate})`,
        sales: totalAmount,
        count: payments.length,
      });
    }

    // 2. Toifalar bo'yicha sotuv ulushi (Category distribution)
    const paidOrderItems = await prisma.orderItem.findMany({
      where: {
        order: { status: 'PAID' },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    const categoryMap: Record<string, number> = {};
    for (const item of paidOrderItems) {
      const catName = item.product.category.name;
      categoryMap[catName] = (categoryMap[catName] || 0) + item.totalPrice;
    }

    const categoryData = Object.keys(categoryMap).map((key) => ({
      name: key,
      value: categoryMap[key],
    }));

    // 3. To'lov turlari bo'yicha tushum (Naqd vs Karta)
    const cashPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentMethod: 'CASH' },
    });
    const cardPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentMethod: 'CARD' },
    });

    const paymentMethodsData = [
      { name: 'Naqd', value: cashPayments._sum.amount || 0 },
      { name: 'Bank karta', value: cardPayments._sum.amount || 0 },
    ];

    res.json({
      success: true,
      weeklySales: days,
      categorySales: categoryData,
      paymentMethods: paymentMethodsData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
