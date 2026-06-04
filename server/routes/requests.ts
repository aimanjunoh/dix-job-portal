import { Router, Response } from 'express';
import db from '../database.js';
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

function generateRequestId(): string {
  const last = db.prepare("SELECT request_id FROM requests ORDER BY id DESC LIMIT 1").get() as any;
  if (!last) return 'REQ-0001';
  const num = parseInt(last.request_id.replace('REQ-', '')) + 1;
  return `REQ-${String(num).padStart(4, '0')}`;
}

// GET /api/requests - List requests with search, filter, pagination
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { search, status, hideCompleted, page = '1', limit = '10' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  let where = '1=1';
  const params: any[] = [];

  // Staff can only see assigned requests
  if (req.userRole === 'staff') {
    where += ' AND r.assigned_to = ?';
    params.push(req.userId);
  }

  if (search) {
    where += ' AND (r.request_id LIKE ? OR r.title LIKE ? OR r.requester_name LIKE ? OR r.department LIKE ? OR r.remarks LIKE ? OR u.name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }
  if (status) {
    where += ' AND r.status = ?';
    params.push(status);
  }
  if (hideCompleted === 'true') {
    where += " AND r.status != 'Completed'";
  }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM requests r LEFT JOIN users u ON r.assigned_to = u.id WHERE ${where}`).get(...params) as any).c;
  const requests = db.prepare(`
    SELECT r.*, u.name as assigned_name FROM requests r
    LEFT JOIN users u ON r.assigned_to = u.id
    WHERE ${where}
    ORDER BY r.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ requests, total, page: Number(page), limit: Number(limit) });
});

// GET /api/requests/dashboard - Dashboard stats
router.get('/dashboard', requireAuth, (req: AuthRequest, res: Response) => {
  const isStaff = req.userRole === 'staff';
  const staffFilter = isStaff ? ' AND assigned_to = ?' : '';
  const staffParam = isStaff ? [req.userId] : [];

  const total = (db.prepare(`SELECT COUNT(*) as c FROM requests WHERE 1=1 ${staffFilter}`).get(...staffParam) as any).c;
  const unassigned = (db.prepare(`SELECT COUNT(*) as c FROM requests WHERE assigned_to IS NULL ${staffFilter}`).get(...staffParam) as any).c;
  const inProgress = (db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status = 'In Progress' ${staffFilter}`).get(...staffParam) as any).c;
  const pendingInfo = (db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status = 'Pending Info' ${staffFilter}`).get(...staffParam) as any).c;
  const completed = (db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status = 'Completed' ${staffFilter}`).get(...staffParam) as any).c;
  const newCount = (db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status = 'New' ${staffFilter}`).get(...staffParam) as any).c;

  const recentRequests = db.prepare(`
    SELECT r.*, u.name as assigned_name FROM requests r
    LEFT JOIN users u ON r.assigned_to = u.id
    WHERE 1=1 ${staffFilter}
    ORDER BY r.updated_at DESC LIMIT 5
  `).all(...staffParam);

  const unassignedRequests = db.prepare(`
    SELECT r.* FROM requests r
    WHERE r.assigned_to IS NULL ${staffFilter}
    ORDER BY r.created_at DESC LIMIT 10
  `).all(...staffParam);

  res.json({
    stats: { total, unassigned, inProgress, pendingInfo, completed, new: newCount },
    recentRequests,
    unassignedRequests,
  });
});

// GET /api/requests/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const request = db.prepare(`
    SELECT r.*, u.name as assigned_name FROM requests r
    LEFT JOIN users u ON r.assigned_to = u.id
    WHERE r.id = ?
  `).get(req.params.id) as any;

  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Staff can only view their assigned requests
  if (req.userRole === 'staff' && request.assigned_to !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const activities = db.prepare(
    'SELECT * FROM activity_logs WHERE request_id = ? ORDER BY timestamp DESC'
  ).all(req.params.id);

  res.json({ request, activities });
});

// POST /api/requests - Create request
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, requester_name, requester_email, department, category, urgency, description, assigned_to, status, remarks } = req.body;

  if (!title || !requester_name) {
    return res.status(400).json({ error: 'Title and requester name are required' });
  }

  const request_id = generateRequestId();
  const result = db.prepare(`
    INSERT INTO requests (request_id, title, requester_name, requester_email, department, category, urgency, description, assigned_to, status, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(request_id, title, requester_name, requester_email || '', department || '', category || '', urgency || 'Normal', description || '', assigned_to || null, status || 'New', remarks || '');

  db.prepare('INSERT INTO activity_logs (request_id, action, performed_by, details) VALUES (?, ?, ?, ?)').run(
    result.lastInsertRowid,
    'Request Created',
    req.userName || 'System',
    `${title} created`
  );

  if (assigned_to) {
    const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(assigned_to) as any;
    db.prepare('INSERT INTO activity_logs (request_id, action, performed_by, details) VALUES (?, ?, ?, ?)').run(
      result.lastInsertRowid,
      'Request Assigned',
      req.userName || 'System',
      `Assigned to ${assignee?.name || 'Unknown'}`
    );
  }

  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ request });
});

// PUT /api/requests/:id - Update request
router.put('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Request not found' });

  // Staff can only update their assigned requests
  if (req.userRole === 'staff' && existing.assigned_to !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, requester_name, requester_email, department, category, urgency, description, assigned_to, status, remarks } = req.body;
  const updates: string[] = [];
  const params: any[] = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (requester_name !== undefined) { updates.push('requester_name = ?'); params.push(requester_name); }
  if (requester_email !== undefined) { updates.push('requester_email = ?'); params.push(requester_email); }
  if (department !== undefined) { updates.push('department = ?'); params.push(department); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (urgency !== undefined) { updates.push('urgency = ?'); params.push(urgency); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (remarks !== undefined) { updates.push('remarks = ?'); params.push(remarks); }

  // Only admin can assign
  if (assigned_to !== undefined && req.userRole === 'admin') {
    updates.push('assigned_to = ?');
    params.push(assigned_to || null);
    if (assigned_to && assigned_to !== existing.assigned_to) {
      const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(assigned_to) as any;
      db.prepare('INSERT INTO activity_logs (request_id, action, performed_by, details) VALUES (?, ?, ?, ?)').run(
        Number(req.params.id), 'Request Assigned', req.userName || 'System',
        `Assigned to ${assignee?.name || 'Unknown'}`
      );
    }
  }

  if (status !== undefined && status !== existing.status) {
    updates.push('status = ?');
    params.push(status);
    db.prepare('INSERT INTO activity_logs (request_id, action, performed_by, details) VALUES (?, ?, ?, ?)').run(
      Number(req.params.id), 'Status Changed', req.userName || 'System',
      `Status changed from ${existing.status} to ${status}`
    );
  }

  if (updates.length === 0) {
    return res.json({ request: existing });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);
  db.prepare(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  db.prepare('INSERT INTO activity_logs (request_id, action, performed_by, details) VALUES (?, ?, ?, ?)').run(
    Number(req.params.id), 'Request Updated', req.userName || 'System', 'Request details updated'
  );

  const request = db.prepare(`SELECT r.*, u.name as assigned_name FROM requests r LEFT JOIN users u ON r.assigned_to = u.id WHERE r.id = ?`).get(req.params.id);
  res.json({ request });
});

// DELETE /api/requests/:id - Delete request (admin only)
router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id) as any;
  if (!request) return res.status(404).json({ error: 'Request not found' });

  db.prepare('DELETE FROM activity_logs WHERE request_id = ?').run(req.params.id);
  db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);

  db.prepare('INSERT INTO activity_logs (action, performed_by, details) VALUES (?, ?, ?)').run(
    'Request Deleted', req.userName || 'System', `Request ${request.request_id} deleted`
  );

  res.json({ message: 'Request deleted' });
});

export default router;
