import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          cafeName: 'Vegas Cafe & Lounge',
          address: "Toshkent shahri, Amir Temur shoh ko'chasi 45-uy",
          phone: '+998 71 200 00 20',
          serviceFeePercent: 10,
          receiptHeader: 'Vegas Cafe ga xush kelibsiz!',
          receiptFooter: 'Tashrifingiz uchun rahmat! Yana kutib qolamiz.',
          currency: "so'm",
        },
      });
    }
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cafeName, address, phone, serviceFeePercent, receiptHeader, receiptFooter, currency } = req.body;

    let settings = await prisma.systemSettings.findFirst();
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          cafeName: cafeName !== undefined ? cafeName : undefined,
          address: address !== undefined ? address : undefined,
          phone: phone !== undefined ? phone : undefined,
          serviceFeePercent: serviceFeePercent !== undefined ? parseFloat(serviceFeePercent) : undefined,
          receiptHeader: receiptHeader !== undefined ? receiptHeader : undefined,
          receiptFooter: receiptFooter !== undefined ? receiptFooter : undefined,
          currency: currency !== undefined ? currency : undefined,
        },
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          cafeName: cafeName || 'Vegas Cafe & Lounge',
          address: address || "Toshkent shahri, Amir Temur shoh ko'chasi 45-uy",
          phone: phone || '+998 71 200 00 20',
          serviceFeePercent: serviceFeePercent ? parseFloat(serviceFeePercent) : 10,
          receiptHeader: receiptHeader || 'Vegas Cafe ga xush kelibsiz!',
          receiptFooter: receiptFooter || 'Tashrifingiz uchun rahmat! Yana kutib qolamiz.',
          currency: currency || "so'm",
        },
      });
    }

    await logAudit(req.user?.id, 'UPDATE_SETTINGS', 'SystemSettings', settings.id, 'Tizim sozlamalari yangilandi', req.ip);

    res.json({ success: true, message: 'Sozlamalar muvaffaqiyatli saqlandi.', settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
