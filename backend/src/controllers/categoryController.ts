import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, icon, description, sortOrder } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Kategoriya nomi kiritilishi shart.' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || 'Utensils',
        description,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    await logAudit(req.user?.id, 'CREATE_CATEGORY', 'Category', category.id, `Kategoriya qo'shildi: ${name}`, req.ip);

    res.status(201).json({ success: true, message: 'Kategoriya yaratildi.', category });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, icon, description, sortOrder } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        icon: icon !== undefined ? icon : undefined,
        description: description !== undefined ? description : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    await logAudit(req.user?.id, 'UPDATE_CATEGORY', 'Category', id, `Kategoriya yangilandi: ${category.name}`, req.ip);

    res.json({ success: true, message: 'Kategoriya yangilandi.', category });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({ where: { id }, include: { products: true } });

    if (!category) {
      res.status(404).json({ success: false, message: 'Kategoriya topilmadi.' });
      return;
    }

    if (category.products.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Ushbu kategoriyada mahsulotlar bor. Avval mahsulotlarni boshqa kategoriyaga o\'tkazing yoki o\'chiring.',
      });
      return;
    }

    await prisma.category.delete({ where: { id } });
    await logAudit(req.user?.id, 'DELETE_CATEGORY', 'Category', id, `Kategoriya o'chirildi: ${category.name}`, req.ip);

    res.json({ success: true, message: 'Kategoriya muvaffaqiyatli o\'chirildi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
