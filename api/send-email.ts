const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'DIX Portal <onboarding@resend.dev>';
const PORTAL_URL = process.env.PORTAL_URL || 'https://dix-job-portal.vercel.app';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const { to, subject, type, data } = req.body;

  if (!to || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let html = '';

  if (type === 'new_request') {
    html = buildNewRequestEmail(data);
  } else if (type === 'assignment') {
    html = buildAssignmentEmail(data);
  } else if (type === 'status_change') {
    html = buildStatusChangeEmail(data);
  } else {
    return res.status(400).json({ error: 'Unknown email type' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject: subject || 'DIX Job Portal Notification',
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, id: result.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

function buildNewRequestEmail(data: any): string {
  const { request_id, title, requester_name, department, urgency, description, token, admin_emails } = data;
  const approveUrl = `${PORTAL_URL}/action?token=${token}&action=approve`;
  const rejectUrl = `${PORTAL_URL}/action?token=${token}&action=reject`;
  const viewUrl = `${PORTAL_URL}/requests`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🆕 New Job Request</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${request_id} requires your attention</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Title</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${title}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Requester</td><td style="padding: 8px 0; font-size: 14px;">${requester_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Department</td><td style="padding: 8px 0; font-size: 14px;">${department || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Urgency</td><td style="padding: 8px 0; font-size: 14px;"><span style="background: ${urgency === 'Critical' ? '#fee2e2' : urgency === 'Urgent' ? '#fef3c7' : '#f3f4f6'}; color: ${urgency === 'Critical' ? '#dc2626' : urgency === 'Urgent' ? '#d97706' : '#374151'}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${urgency}</span></td></tr>
        </table>
        ${description ? `<div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #374151;">${description}</div>` : ''}
        <div style="margin-top: 24px; display: flex; gap: 12px;">
          <a href="${approveUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">✓ Approve</a>
          <a href="${rejectUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">✗ Reject</a>
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View All</a>
        </div>
        <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">Or open the portal to manage this request with full details.</p>
      </div>
    </div>
  `;
}

function buildAssignmentEmail(data: any): string {
  const { request_id, title, requester_name, assigned_name, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">📋 New Assignment</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Hi ${assigned_name}, you've been assigned a request</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Request ID</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${request_id}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Title</td><td style="padding: 8px 0; font-size: 14px;">${title}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Requester</td><td style="padding: 8px 0; font-size: 14px;">${requester_name}</td></tr>
        </table>
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Request Details</a>
        </div>
      </div>
    </div>
  `;
}

function buildStatusChangeEmail(data: any): string {
  const { request_id, title, old_status, new_status, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">📊 Status Update</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${request_id}: ${old_status} → ${new_status}</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="font-size: 14px; color: #374151;">Request <strong>${title}</strong> has been updated from <strong>${old_status}</strong> to <strong>${new_status}</strong>.</p>
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Request</a>
        </div>
      </div>
    </div>
  `;
}
