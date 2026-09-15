import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, search, isAvailable } = req.query;

    const where: any = {};
    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = Number(categoryId);
    }
    if (isAvailable !== undefined && isAvailable !== 'ALL') {
      where.isAvailable = isAvailable === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        category: true,
        inventory: true,
      },
    });

    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, inventory: true },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Mahsulot topilmadi.' });
      return;
    }

    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, categoryId, price, description, imageUrl, unit, inventoryId, isAvailable } = req.body;

    if (!name || !categoryId || price === undefined) {
      res.status(400).json({ success: false, message: 'Nomi, kategoriya va narx kiritilishi shart.' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId: Number(categoryId),
        price: parseFloat(price),
        description: description || null,
        imageUrl: imageUrl || null,
        unit: unit || 'dona',
        inventoryId: inventoryId ? Number(inventoryId) : null,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
      include: { category: true },
    });

    await logAudit(req.user?.id, 'CREATE_PRODUCT', 'Product', product.id, `Mahsulot qo'shildi: ${name} (${price} so'm)`, req.ip);

    res.status(201).json({ success: true, message: 'Mahsulot muvaffaqiyatli qo\'shildi.', product });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, categoryId, price, description, imageUrl, unit, inventoryId, isAvailable } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        unit: unit !== undefined ? unit : undefined,
        inventoryId: inventoryId !== undefined ? (inventoryId ? Number(inventoryId) : null) : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
      },
      include: { category: true },
    });

    await logAudit(req.user?.id, 'UPDATE_PRODUCT', 'Product', id, `Mahsulot yangilandi: ${product.name}`, req.ip);

    res.json({ success: true, message: 'Mahsulot muvaffaqiyatli yangilandi.', product });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleProductAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Mahsulot topilmadi.' });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isAvailable: !existing.isAvailable },
    });

    await logAudit(
      req.user?.id,
      'TOGGLE_PRODUCT_AVAILABILITY',
      'Product',
      id,
      `Mahsulot holati o'zgartirildi: ${updated.name} -> ${updated.isAvailable ? 'Mavjud' : 'Tugagan'}`,
      req.ip
    );

    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      res.status(404).json({ success: false, message: 'Mahsulot topilmadi.' });
      return;
    }

    await prisma.product.delete({ where: { id } });
    await logAudit(req.user?.id, 'DELETE_PRODUCT', 'Product', id, `Mahsulot o'chirildi: ${product.name}`, req.ip);

    res.json({ success: true, message: 'Mahsulot muvaffaqiyatli o\'chirildi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
