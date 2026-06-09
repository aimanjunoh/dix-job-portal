import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const WEBHOOK_SECRET = process.env.GMAIL_WEBHOOK_SECRET || 'dix-gmail-secret-2024';
const PORTAL_URL = process.env.PORTAL_URL || 'https://dix-job-portal.vercel.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function generateRequestId(): Promise<string> {
  const { data } = await supabase
    .from('requests')
    .select('request_id')
    .order('id', { ascending: false })
    .limit(1)
    .single();
  if (!data) return 'REQ-0001';
  const num = parseInt(data.request_id.replace('REQ-', '')) + 1;
  return `REQ-${String(num).padStart(4, '0')}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret
  const authHeader = req.headers['x-webhook-secret'] || req.headers['authorization'];
  if (authHeader !== WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sender_name, sender_email, subject, body, date } = req.body;
  const isThreadReply = !!req.body.is_thread_reply;

  if (!sender_email || !subject) {
    return res.status(400).json({ error: 'Missing sender_email or subject' });
  }

  try {
    const request_id = await generateRequestId();
    const action_token = generateToken();

    // Extract department from email or use default
    const department = req.body.department || '';
    const category = req.body.category || 'Email';
    const urgency = req.body.urgency || 'Normal';

    // Build remarks — flag thread replies for admin review
    let remarks = `Created from email on ${date || new Date().toISOString()}`;
    if (isThreadReply) {
      remarks += ' | Submitted as email thread reply — may be a new request or follow-up to a previous one.';
    }

    const { data, error } = await supabase.from('requests').insert({
      request_id,
      title: subject,
      requester_name: sender_name || sender_email.split('@')[0],
      requester_email: sender_email,
      department,
      category,
      urgency,
      description: body || '',
      assigned_to: null,
      status: 'New',
      remarks,
      action_token,
    }).select().single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      request_id: data.id,
      action: 'Request Created',
      performed_by: 'Gmail Integration',
      details: `Auto-created from email by ${sender_email}`,
    });

    // Send notification email to admins
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'active');

    const adminEmails = (admins || []).map(a => a.email);

    // Send notification to admins via internal send-email API
    if (adminEmails.length > 0) {
      await fetch(`${PORTAL_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmails,
          subject: `New Email Request: ${request_id} — ${subject}`,
          type: 'new_request',
          data: { ...data, requester_name: sender_name, token: action_token },
        }),
      });
    }

    // Send confirmation email to requester
    if (sender_email) {
      await fetch(`${PORTAL_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sender_email,
          subject: `Request Received: ${request_id} — ${subject}`,
          type: 'request_received',
          data: {
            request_id,
            title: subject,
            requester_name: sender_name || sender_email.split('@')[0],
            department,
            urgency,
            description: body || '',
          },
        }),
      });
    }

    return res.status(200).json({
      success: true,
      request_id,
      id: data.id,
      message: `Request ${request_id} created from email`,
    });
  } catch (err: any) {
    console.error('Create from email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
