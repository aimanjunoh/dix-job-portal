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
      remarks: `Created from email on ${date || new Date().toISOString()}`,
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

    if (adminEmails.length > 0 && process.env.RESEND_API_KEY) {
      const approveUrl = `${PORTAL_URL}/action?token=${action_token}&action=approve`;
      const rejectUrl = `${PORTAL_URL}/action?token=${action_token}&action=reject`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'DIX Portal <onboarding@resend.dev>',
          to: adminEmails,
          subject: `New Email Request: ${request_id} — ${subject}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 20px;">📧 New Email Request</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${request_id} from Gmail</p>
              </div>
              <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 100px;">From</td><td style="padding: 8px 0; font-size: 14px;"><strong>${sender_name || sender_email}</strong> &lt;${sender_email}&gt;</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${subject}</td></tr>
                </table>
                ${body ? `<div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #374151; max-height: 200px; overflow-y: auto;">${body.substring(0, 500)}${body.length > 500 ? '...' : ''}</div>` : ''}
                <div style="margin-top: 24px; display: flex; gap: 12px;">
                  <a href="${approveUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">✓ Approve & Assign</a>
                  <a href="${rejectUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">✗ Reject</a>
                </div>
              </div>
            </div>
          `,
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
