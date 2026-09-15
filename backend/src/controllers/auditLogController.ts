import { Request, Response } from 'express';
import prisma from '../config/db';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, userId, search, limit = 100 } = req.query;

    const where: any = {};
    if (action && action !== 'ALL') where.action = String(action);
    if (userId && userId !== 'ALL') where.userId = Number(userId);
    if (search) {
      where.OR = [
        { details: { contains: String(search) } },
        { entity: { contains: String(search) } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        user: { select: { id: true, fullName: true, username: true, role: true } },
      },
    });

    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
