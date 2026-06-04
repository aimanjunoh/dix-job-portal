import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/users - List all users (with search, filter, pagination)
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { search, status, page = '1', limit = '10' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  let where = '1=1';
  const params: any[] = [];

  if (search) {
    where += ' AND (name LIKE ? OR email LIKE ? OR department LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE ${where}`).get(...params) as any).c;
  const users = db.prepare(
    `SELECT id, name, email, role, department, status, created_at, updated_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), offset);

  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

// GET /api/users/all - Get all active users (for dropdowns)
router.get('/all', requireAuth, (_req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, name, email, role, department FROM users WHERE status = ? ORDER BY name').all('active');
  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, role, department, status, created_at, updated_at FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/users - Create user (admin only)
router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, email, password, role, department, status } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role, department, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, email, hash, role || 'staff', department || '', status || 'active');

  // Log activity
  db.prepare('INSERT INTO activity_logs (action, performed_by, details) VALUES (?, ?, ?)').run(
    'User Created',
    req.userName || 'System',
    `User ${name} created`
  );

  const user = db.prepare('SELECT id, name, email, role, department, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ user });
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, email, password, role, department, status } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (email !== undefined) {
    const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.id);
    if (dup) return res.status(409).json({ error: 'Email already exists' });
    updates.push('email = ?'); params.push(email);
  }
  if (password) { updates.push('password = ?'); params.push(bcrypt.hashSync(password, 10)); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (department !== undefined) { updates.push('department = ?'); params.push(department); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  updates.push('updated_at = CURRENT_TIMESTAMP');

  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  db.prepare('INSERT INTO activity_logs (action, performed_by, details) VALUES (?, ?, ?)').run(
    'User Updated',
    req.userName || 'System',
    `User ${name || existing.name} updated`
  );

  const user = db.prepare('SELECT id, name, email, role, department, status, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
  res.json({ user });
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  db.prepare('INSERT INTO activity_logs (action, performed_by, details) VALUES (?, ?, ?)').run(
    'User Deleted',
    req.userName || 'System',
    `User ${user.name} deleted`
  );

  res.json({ message: 'User deleted' });
});

export default router;
