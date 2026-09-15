import { Request, Response } from 'express';
import prisma from '../config/db';
import { logAudit, createNotification } from '../utils/audit';
import { AuthRequest } from '../middleware/authMiddleware';

export const getReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, tableId } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (date) where.reservationDate = String(date);
    if (tableId && tableId !== 'ALL') where.tableId = Number(tableId);

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: [{ reservationDate: 'desc' }, { reservationTime: 'asc' }],
      include: {
        table: true,
        customer: true,
      },
    });

    res.json({ success: true, reservations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerName, customerPhone, tableId, guestsCount, reservationDate, reservationTime, notes } = req.body;

    if (!customerName || !customerPhone || !tableId || !reservationDate || !reservationTime) {
      res.status(400).json({ success: false, message: 'Barcha asosiy ma\'lumotlar kiritilishi shart.' });
      return;
    }

    // Link or create customer
    let customer = await prisma.customer.findUnique({ where: { phone: customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: customerName,
          phone: customerPhone,
        },
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerName,
        customerPhone,
        customerId: customer.id,
        tableId: Number(tableId),
        guestsCount: Number(guestsCount) || 2,
        reservationDate,
        reservationTime,
        status: 'CONFIRMED',
        notes: notes || null,
      },
      include: { table: true },
    });

    // Check if reservation is for today
    const todayStr = new Date().toISOString().split('T')[0];
    if (reservationDate === todayStr) {
      await prisma.table.update({
        where: { id: Number(tableId) },
        data: { status: 'RESERVED' },
      });
    }

    await logAudit(
      req.user?.id,
      'CREATE_RESERVATION',
      'Reservation',
      reservation.id,
      `${reservation.table.number}-stol uchun rezervatsiya qilindi: ${customerName} (${reservationDate} ${reservationTime})`,
      req.ip
    );

    await createNotification(
      'Yangi rezervatsiya!',
      `${reservation.table.number}-stol ${customerName} tomonidan ${reservationDate} ${reservationTime} ga band qilindi`,
      'RESERVATION'
    );

    res.status(201).json({ success: true, message: 'Rezervatsiya muvaffaqiyatli saqlandi.', reservation });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateReservationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Rezervatsiya topilmadi.' });
      return;
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true },
    });

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      const otherActiveReservations = await prisma.reservation.count({
        where: {
          tableId: reservation.tableId,
          status: 'CONFIRMED',
          id: { not: id },
        },
      });

      const activeOrders = await prisma.order.count({
        where: {
          tableId: reservation.tableId,
          status: { in: ['NEW', 'PREPARING', 'READY', 'SERVED'] },
        },
      });

      if (otherActiveReservations === 0 && activeOrders === 0) {
        await prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: 'EMPTY' },
        });
      }
    }

    await logAudit(
      req.user?.id,
      'UPDATE_RESERVATION_STATUS',
      'Reservation',
      id,
      `Rezervatsiya holati ${status} ga o'zgartirildi`,
      req.ip
    );

    res.json({ success: true, message: 'Rezervatsiya holati yangilandi.', reservation: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
