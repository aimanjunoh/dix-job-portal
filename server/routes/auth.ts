import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email, 'active') as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  (req.session as any).userId = user.id;
  (req.session as any).userRole = user.role;
  (req.session as any).userName = user.name;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: AuthRequest, res: Response) => {
  req.session.destroy((err) => {
    res.json({ message: 'Logged out' });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, role, department, status FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;
