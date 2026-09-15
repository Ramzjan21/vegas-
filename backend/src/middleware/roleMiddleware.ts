import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Foydalanuvchi tizimga kirmagan.' });
      return;
    }

    if (req.user.role === 'ADMINISTRATOR') {
      // Administrator has access to all modules
      return next();
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Ushbu amalni bajarish uchun sizda yetarli ruxsat yo\'q.',
      });
      return;
    }

    next();
  };
};
