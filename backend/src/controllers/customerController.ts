import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { totalSpent: 'desc' },
      include: {
        _count: {
          select: { orders: true, reservations: true },
        },
      },
    });

    res.json({ success: true, customers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { table: true, items: { include: { product: true } } },
        },
        reservations: {
          orderBy: { reservationDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Mijoz topilmadi.' });
      return;
    }

    res.json({ success: true, customer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phone, notes } = req.body;

    if (!fullName || !phone) {
      res.status(400).json({ success: false, message: 'Ism va telefon raqam kiritilishi shart.' });
      return;
    }

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Ushbu telefon raqamli mijoz allaqachon mavjud.' });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        notes: notes || null,
      },
    });

    await logAudit(req.user?.id, 'CREATE_CUSTOMER', 'Customer', customer.id, `Mijoz qo'shildi: ${fullName}`, req.ip);

    res.status(201).json({ success: true, message: 'Mijoz muvaffaqiyatli ro\'yxatdan o\'tkazildi.', customer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { fullName, phone, notes } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        phone: phone !== undefined ? phone : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await logAudit(req.user?.id, 'UPDATE_CUSTOMER', 'Customer', id, `Mijoz tahrirlandi: ${customer.fullName}`, req.ip);

    res.json({ success: true, message: 'Mijoz ma\'lumotlari yangilandi.', customer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.customer.delete({ where: { id } });
    await logAudit(req.user?.id, 'DELETE_CUSTOMER', 'Customer', id, `Mijoz o'chirildi`, req.ip);
    res.json({ success: true, message: 'Mijoz o\'chirildi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
