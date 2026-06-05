import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || 'dix-cron-secret-2024';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: any, res: any) {
  // Verify cron secret
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Find overdue requests (due_date < today AND status is not Completed)
    const { data: overdueRequests, error } = await supabase
      .from('requests')
      .select('*, users!assigned_to(name, email)')
      .lt('due_date', today)
      .neq('status', 'Completed')
      .not('assigned_to', 'is', null);

    if (error) throw error;

    if (!overdueRequests || overdueRequests.length === 0) {
      return res.status(200).json({ message: 'No overdue tasks found', count: 0 });
    }

    // Group by assignee
    const byAssignee: Record<string, any[]> = {};
    for (const r of overdueRequests) {
      const email = r.users?.email;
      if (!email) continue;
      if (!byAssignee[email]) byAssignee[email] = [];
      const dueDate = new Date(r.due_date);
      const now = new Date();
      const daysOver = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      byAssignee[email].push({
        request_id: r.request_id,
        title: r.title,
        due_date: r.due_date,
        days_over: daysOver,
        urgency: r.urgency,
      });
    }

    // Send overdue email to each assignee
    let emailsSent = 0;
    for (const [email, requests] of Object.entries(byAssignee)) {
      const response = await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Overdue Reminder: ${requests.length} task(s) past due`,
          type: 'overdue',
          data: { requests },
        }),
      });
      if (response.ok) emailsSent++;
    }

    // Also notify admins with summary
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (admins && admins.length > 0) {
      const allOverdue = overdueRequests.map(r => {
        const dueDate = new Date(r.due_date);
        const now = new Date();
        const daysOver = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          request_id: r.request_id,
          title: r.title,
          due_date: r.due_date,
          days_over: daysOver,
        };
      });

      await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: admins.map(a => a.email),
          subject: `Daily Overdue Report: ${allOverdue.length} task(s) past due`,
          type: 'overdue',
          data: { requests: allOverdue },
        }),
      });
    }

    return res.status(200).json({
      message: `Sent ${emailsSent} overdue reminder(s)`,
      overdue_count: overdueRequests.length,
      emails_sent: emailsSent,
    });
  } catch (err: any) {
    console.error('Overdue cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
