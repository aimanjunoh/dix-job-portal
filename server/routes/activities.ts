import { Router, Response } from 'express';
import db from '../database.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/activities - List activity logs
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const total = (db.prepare('SELECT COUNT(*) as c FROM activity_logs').get() as any).c;
  const activities = db.prepare(
    'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?'
  ).all(Number(limit), offset);

  res.json({ activities, total, page: Number(page), limit: Number(limit) });
});

export default router;
