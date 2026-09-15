import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { logAudit } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;

    const where: any = {};
    if (role && role !== 'ALL') where.role = String(role);
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { username: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true, payments: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json({ success: true, staff });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, username, password, role, phone } = req.body;

    if (!fullName || !username || !password || !role) {
      res.status(400).json({ success: false, message: 'Barcha maydonlar to\'ldirilishi shart.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Bu loginli xodim allaqachon mavjud.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        password: hashedPassword,
        role,
        phone: phone || null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit(req.user?.id, 'CREATE_STAFF', 'User', user.id, `Yangi xodim qo'shildi: ${fullName} (${role})`, req.ip);

    res.status(201).json({ success: true, message: 'Xodim muvaffaqiyatli qo\'shildi.', staff: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { fullName, role, phone, password } = req.body;

    const data: any = {
      fullName: fullName !== undefined ? fullName : undefined,
      role: role !== undefined ? role : undefined,
      phone: phone !== undefined ? phone : undefined,
    };

    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit(req.user?.id, 'UPDATE_STAFF', 'User', id, `Xodim ma'lumotlari tahrirlandi: ${user.fullName}`, req.ip);

    res.json({ success: true, message: 'Xodim ma\'lumotlari yangilandi.', staff: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleStaffStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (req.user?.id === id) {
      res.status(400).json({ success: false, message: 'O\'zingizning profilingizni faolsizlantira olmaysiz.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Xodim topilmadi.' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, fullName: true, isActive: true },
    });

    await logAudit(
      req.user?.id,
      'TOGGLE_STAFF_STATUS',
      'User',
      id,
      `Xodim holati o'zgartirildi: ${user.fullName} (${user.isActive ? 'Faol' : 'Faolsiz'})`,
      req.ip
    );

    res.json({ success: true, message: `Xodim holati o'zgartirildi.`, staff: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
