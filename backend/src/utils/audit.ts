import prisma from '../config/db';

export async function logAudit(
  userId: number | undefined | null,
  action: string,
  entity: string,
  entityId?: number | null,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ?? '',
        ipAddress: ipAddress ?? '127.0.0.1',
      },
    });
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
}

export async function createNotification(title: string, message: string, type: string = 'NEW_ORDER') {
  try {
    await prisma.notification.create({
      data: {
        title,
        message,
        type,
        isRead: false,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
