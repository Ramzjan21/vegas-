import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const { section, status } = req.query;

    const where: any = {};
    if (section && section !== 'ALL') where.section = String(section);
    if (status && status !== 'ALL') where.status = String(status);

    const tables = await prisma.table.findMany({
      where,
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: {
            status: { in: ['NEW', 'PREPARING', 'READY', 'SERVED'] },
          },
          include: {
            waiter: { select: { id: true, fullName: true } },
            customer: { select: { id: true, fullName: true, phone: true } },
            items: { include: { product: true } },
          },
          take: 1,
        },
        reservations: {
          where: {
            status: 'CONFIRMED',
          },
          orderBy: { reservationTime: 'asc' },
          take: 1,
        },
      },
    });

    const formattedTables = tables.map((t) => ({
      ...t,
      activeOrder: t.orders.length > 0 ? t.orders[0] : null,
      activeReservation: t.reservations.length > 0 ? t.reservations[0] : null,
    }));

    res.json({ success: true, tables: formattedTables });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTableById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { in: ['NEW', 'PREPARING', 'READY', 'SERVED'] } },
          include: {
            waiter: true,
            customer: true,
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!table) {
      res.status(404).json({ success: false, message: 'Stol topilmadi.' });
      return;
    }

    res.json({ success: true, table });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { number, capacity, section } = req.body;

    if (!number || !capacity) {
      res.status(400).json({ success: false, message: 'Stol raqami va sig\'imi kiritilishi shart.' });
      return;
    }

    const existing = await prisma.table.findUnique({ where: { number: Number(number) } });
    if (existing) {
      res.status(400).json({ success: false, message: `${number}-raqamli stol allaqachon mavjud.` });
      return;
    }

    const table = await prisma.table.create({
      data: {
        number: Number(number),
        capacity: Number(capacity),
        section: section || 'Zal',
        status: 'EMPTY',
      },
    });

    await logAudit(req.user?.id, 'CREATE_TABLE', 'Table', table.id, `${table.number}-stol yaratildi`, req.ip);

    res.status(201).json({ success: true, message: 'Stol muvaffaqiyatli qo\'shildi.', table });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { number, capacity, section, status } = req.body;

    const updated = await prisma.table.update({
      where: { id },
      data: {
        number: number !== undefined ? Number(number) : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        section: section !== undefined ? section : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    await logAudit(req.user?.id, 'UPDATE_TABLE', 'Table', id, `${updated.number}-stol ma'lumotlari tahrirlandi`, req.ip);

    res.json({ success: true, message: 'Stol muvaffaqiyatli yangilandi.', table: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTableStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const updated = await prisma.table.update({
      where: { id },
      data: { status },
    });

    await logAudit(req.user?.id, 'UPDATE_TABLE_STATUS', 'Table', id, `${updated.number}-stol holati ${status} ga o'zgartirildi`, req.ip);

    res.json({ success: true, message: 'Stol holati o\'zgartirildi.', table: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const table = await prisma.table.findUnique({ where: { id } });

    if (!table) {
      res.status(404).json({ success: false, message: 'Stol topilmadi.' });
      return;
    }

    if (table.status !== 'EMPTY') {
      res.status(400).json({ success: false, message: 'Band yoki rezerv qilingan stolni o\'chirib bo\'lmaydi.' });
      return;
    }

    await prisma.table.delete({ where: { id } });
    await logAudit(req.user?.id, 'DELETE_TABLE', 'Table', id, `${table.number}-stol o'chirildi`, req.ip);

    res.json({ success: true, message: 'Stol o\'chirildi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
