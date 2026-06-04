import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  userName?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.session || !(req.session as any).userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = (req.session as any).userId;
  req.userRole = (req.session as any).userRole;
  req.userName = (req.session as any).userName;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
}
