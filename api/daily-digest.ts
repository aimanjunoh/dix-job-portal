import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || 'dix-cron-secret-2024';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: any, res: any) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only run on weekdays (Mon-Fri)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(200).json({ message: 'Weekend — skipping digest' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all active requests
    const { data: allRequests } = await supabase
      .from('requests')
      .select('*, users!assigned_to(name)')
      .neq('status', 'Completed');

    if (!allRequests) {
      return res.status(200).json({ message: 'No active requests' });
    }

    const requestsWithNames = allRequests.map((r: any) => ({
      ...r,
      assigned_name: r.users?.name || null,
      users: undefined,
    }));

    // Unassigned jobs
    const unassigned = requestsWithNames.filter((r: any) => !r.assigned_to);

    // Escalated: unassigned for 3+ days
    const escalated = unassigned.filter((r: any) => new Date(r.created_at) < new Date(threeDaysAgo)).length;

    // Overdue: past due_date
    const overdue = requestsWithNames.filter((r: any) => r.due_date && r.due_date < today);

    // Due today
    const dueToday = requestsWithNames.filter((r: any) => r.due_date === today);

    // In Progress count
    const totalInProgress = requestsWithNames.filter((r: any) => r.status === 'In Progress').length;

    const digestData = {
      unassigned: unassigned.slice(0, 10),
      overdue: overdue.slice(0, 10),
      dueToday: dueToday.slice(0, 10),
      totalInProgress,
      escalated,
    };

    // Get admin emails
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (!admins || admins.length === 0) {
      return res.status(200).json({ message: 'No admins to notify' });
    }

    const adminEmails = admins.map(a => a.email);

    const portalUrl = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${portalUrl}://${host}`;

    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: adminEmails,
        subject: `📋 Daily Digest — ${unassigned.length} unassigned, ${overdue.length} overdue, ${dueToday.length} due today`,
        type: 'daily_digest',
        data: digestData,
      }),
    });

    return res.status(200).json({
      message: 'Daily digest sent',
      sent_to: adminEmails,
      stats: {
        unassigned: unassigned.length,
        overdue: overdue.length,
        dueToday: dueToday.length,
        escalated,
        totalInProgress,
      },
      email_ok: response.ok,
    });
  } catch (err: any) {
    console.error('Daily digest error:', err);
    return res.status(500).json({ error: err.message });
  }
}
