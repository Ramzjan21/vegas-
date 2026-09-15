import { Request, Response } from 'express';
import prisma from '../config/db';

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate) + 'T23:59:59'),
      };
    } else if (period === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      dateFilter = { gte: today };
    } else if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { gte: weekAgo };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      dateFilter = { gte: monthAgo };
    } else if (period === 'yearly') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dateFilter = { gte: yearStart };
    }

    // Paid orders in period
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: dateFilter,
      },
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { fullName: true } },
            items: { include: { product: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOrders = payments.length;
    const cashTotal = payments
      .filter((p) => p.paymentMethod === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);
    const cardTotal = payments
      .filter((p) => p.paymentMethod === 'CARD' || p.paymentMethod === 'MIXED')
      .reduce((sum, p) => sum + p.amount, 0);

    // Waiter performance
    const waiterMap: Record<string, { name: string; ordersCount: number; totalSales: number }> = {};
    for (const p of payments) {
      const waiterName = p.order.waiter.fullName;
      if (!waiterMap[waiterName]) {
        waiterMap[waiterName] = { name: waiterName, ordersCount: 0, totalSales: 0 };
      }
      waiterMap[waiterName].ordersCount += 1;
      waiterMap[waiterName].totalSales += p.amount;
    }

    const waiterPerformance = Object.values(waiterMap).sort((a, b) => b.totalSales - a.totalSales);

    // Product performance
    const productStatsMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
    for (const p of payments) {
      for (const it of p.order.items) {
        const prodName = it.product.name;
        if (!productStatsMap[prodName]) {
          productStatsMap[prodName] = {
            name: prodName,
            quantity: 0,
            revenue: 0,
            category: it.product.unit,
          };
        }
        productStatsMap[prodName].quantity += it.quantity;
        productStatsMap[prodName].revenue += it.totalPrice;
      }
    }

    const allProductStats = Object.values(productStatsMap);
    const topProducts = [...allProductStats].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const bottomProducts = [...allProductStats].sort((a, b) => a.quantity - b.quantity).slice(0, 5);

    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalOrders,
        averageCheck: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        cashTotal,
        cardTotal,
      },
      waiterPerformance,
      topProducts,
      bottomProducts,
      recentPayments: payments.slice(0, 20),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportSalesReportCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      include: {
        order: {
          include: {
            table: true,
            waiter: true,
          },
        },
      },
    });

    let csv = 'Chek ID,Buyurtma raqami,Stol,Ofitsiant,Sana,Vaqt,Summa,To\'lov turi\n';

    for (const p of payments) {
      const date = p.paidAt.toISOString().split('T')[0];
      const time = p.paidAt.toTimeString().split(' ')[0];
      csv += `${p.id},${p.order.orderNumber},Stol ${p.order.table.number},${p.order.waiter.fullName},${date},${time},${p.amount},${p.paymentMethod === 'CASH' ? 'Naqd' : 'Karta'}\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=vegas_cafe_hisobot.csv');
    res.send('\uFEFF' + csv); // Include BOM for Excel UTF-8
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
