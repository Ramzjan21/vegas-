import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit, createNotification } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, lowStockOnly } = req.query;

    const where: any = {};
    if (category && category !== 'ALL') where.category = String(category);
    if (search) where.name = { contains: String(search) };

    let items = await prisma.inventory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (lowStockOnly === 'true') {
      items = items.filter((i) => i.currentStock <= i.minStock);
    }

    res.json({ success: true, inventory: items });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getInventoryTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventoryId } = req.query;
    const where: any = {};
    if (inventoryId) where.inventoryId = Number(inventoryId);

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        inventory: true,
        user: { select: { fullName: true } },
      },
    });

    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, unit, initialStock = 0, minStock = 5, pricePerUnit = 0 } = req.body;

    if (!name || !unit) {
      res.status(400).json({ success: false, message: 'Nomi va o\'lchov birligi kiritilishi shart.' });
      return;
    }

    const initQty = parseFloat(initialStock) || 0;
    const item = await prisma.inventory.create({
      data: {
        name,
        category: category || 'Oziq-ovqat',
        unit,
        initialStock: initQty,
        currentStock: initQty,
        minStock: parseFloat(minStock) || 5,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
      },
    });

    if (initQty > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: item.id,
          userId: req.user?.id || 1,
          type: 'IN',
          quantity: initQty,
          cost: initQty * (parseFloat(pricePerUnit) || 0),
          note: 'Boshlang\'ich qoldiq kiritildi',
        },
      });
    }

    await logAudit(req.user?.id, 'CREATE_INVENTORY', 'Inventory', item.id, `Omborga yangi tovar qo'shildi: ${name}`, req.ip);

    res.status(201).json({ success: true, message: 'Mahsulot omborga qo\'shildi.', item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, category, unit, minStock, pricePerUnit } = req.body;

    const item = await prisma.inventory.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        category: category !== undefined ? category : undefined,
        unit: unit !== undefined ? unit : undefined,
        minStock: minStock !== undefined ? parseFloat(minStock) : undefined,
        pricePerUnit: pricePerUnit !== undefined ? parseFloat(pricePerUnit) : undefined,
      },
    });

    await logAudit(req.user?.id, 'UPDATE_INVENTORY', 'Inventory', id, `Ombor mahsuloti tahrirlandi: ${item.name}`, req.ip);

    res.json({ success: true, message: 'Mahsulot muvaffaqiyatli yangilandi.', item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const recordTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inventoryId, type, quantity, cost, note } = req.body;

    if (!inventoryId || !type || !quantity) {
      res.status(400).json({ success: false, message: 'Mahsulot, operatsiya turi va miqdori kiritilishi shart.' });
      return;
    }

    const item = await prisma.inventory.findUnique({ where: { id: Number(inventoryId) } });
    if (!item) {
      res.status(404).json({ success: false, message: 'Ombor mahsuloti topilmadi.' });
      return;
    }

    const qty = parseFloat(quantity);
    let newCurrentStock = item.currentStock;

    if (type === 'IN') {
      newCurrentStock += qty;
    } else if (type === 'OUT') {
      if (item.currentStock < qty) {
        res.status(400).json({
          success: false,
          message: `Omborda yetarli qoldiq mavjud emas. Joriy qoldiq: ${item.currentStock} ${item.unit}`,
        });
        return;
      }
      newCurrentStock -= qty;
    } else if (type === 'ADJUSTMENT') {
      newCurrentStock = qty;
    } else {
      res.status(400).json({ success: false, message: 'Noto\'g\'ri operatsiya turi (IN, OUT, ADJUSTMENT).' });
      return;
    }

    const updatedItem = await prisma.inventory.update({
      where: { id: item.id },
      data: { currentStock: newCurrentStock },
    });

    const tx = await prisma.inventoryTransaction.create({
      data: {
        inventoryId: item.id,
        userId: req.user?.id || 1,
        type,
        quantity: qty,
        cost: cost ? parseFloat(cost) : undefined,
        note: note || null,
      },
      include: { inventory: true },
    });

    // Check low stock alert
    if (newCurrentStock <= item.minStock) {
      await createNotification(
        'Ombor ogohlantirishi!',
        `"${item.name}" qoldig'i kam qoldi (${newCurrentStock} ${item.unit}, min: ${item.minStock} ${item.unit})`,
        'LOW_STOCK'
      );
    }

    await logAudit(
      req.user?.id,
      'INVENTORY_TRANSACTION',
      'Inventory',
      item.id,
      `${item.name} uchun ${type === 'IN' ? 'Kirim' : type === 'OUT' ? 'Chiqim' : 'Korreksiya'}: ${qty} ${item.unit}. Yangi qoldiq: ${newCurrentStock} ${item.unit}`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Ombor operatsiyasi muvaffaqiyatli saqlandi.',
      transaction: tx,
      item: updatedItem,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.inventory.findUnique({ where: { id } });

    if (!item) {
      res.status(404).json({ success: false, message: 'Mahsulot topilmadi.' });
      return;
    }

    await prisma.inventory.delete({ where: { id } });
    await logAudit(req.user?.id, 'DELETE_INVENTORY', 'Inventory', id, `Ombor mahsuloti o'chirildi: ${item.name}`, req.ip);

    res.json({ success: true, message: 'Mahsulot o\'chirildi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
