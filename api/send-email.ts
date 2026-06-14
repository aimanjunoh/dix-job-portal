const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'DIX Portal <onboarding@resend.dev>';
const PORTAL_URL = process.env.PORTAL_URL || 'https://dix-job-portal.vercel.app';
const GMAIL_SCRIPT_URL = process.env.GMAIL_SCRIPT_URL || '';
const GMAIL_WEBHOOK_SECRET = process.env.GMAIL_WEBHOOK_SECRET || 'dix-gmail-secret-2024';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, type, data } = req.body;

  if (!to || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let html = '';
  const builders: Record<string, (d: any) => string> = {
    new_request: buildNewRequestEmail,
    assignment: buildAssignmentEmail,
    claimed: buildClaimedEmail,
    reassigned: buildReassignedEmail,
    status_change: buildStatusChangeEmail,
    completed: buildCompletedEmail,
    pending_info: buildPendingInfoEmail,
    overdue: buildOverdueEmail,
    request_received: buildRequestReceivedEmail,
    daily_digest: buildDailyDigestEmail,
  };

  if (builders[type]) {
    html = builders[type](data);
  } else {
    return res.status(400).json({ error: 'Unknown email type' });
  }

  // Try Gmail via Apps Script first
  if (GMAIL_SCRIPT_URL) {
    try {
      const gmailRes = await fetch(GMAIL_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ to: Array.isArray(to) ? to : [to], subject: subject || 'DIX Job Portal Notification', html, secret: GMAIL_WEBHOOK_SECRET }),
        redirect: 'follow',
      });
      if (gmailRes.ok) {
        const result = await gmailRes.json();
        return res.status(200).json({ success: true, method: 'gmail', ...result });
      } else {
        console.warn(`Gmail send returned ${gmailRes.status}`);
      }
    } catch (err: any) {
      console.warn('Gmail send failed, falling back to Resend:', err.message);
    }
  } else {
    console.warn('GMAIL_SCRIPT_URL not set, using Resend');
  }

  // Fallback to Resend
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'No email service configured. Set GMAIL_SCRIPT_URL or RESEND_API_KEY.' });
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
    return res.status(200).json({ success: true, method: 'resend', id: result.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

function historyHtml(history: any[]): string {
  if (!history || history.length === 0) return '';
  return `
    <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 8px;">
      <p style="font-size: 12px; color: #6b7280; font-weight: 600; margin: 0 0 8px;">Recent Activity</p>
      ${history.map(h => `<div style="font-size: 12px; color: #374151; padding: 4px 0; border-bottom: 1px solid #e5e7eb;"><strong>${h.action}</strong> — ${h.details} <span style="color: #9ca3af; font-size: 11px;">(${new Date(h.timestamp).toLocaleDateString()})</span></div>`).join('')}
    </div>
  `;
}

function buildNewRequestEmail(data: any): string {
  const { request_id, title, requester_name, department, urgency, description, token } = data;
  const approveUrl = `${PORTAL_URL}/action?token=${token}&action=approve`;
  const rejectUrl = `${PORTAL_URL}/action?token=${token}&action=reject`;
  const viewUrl = `${PORTAL_URL}/requests`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">New Job Request</h1>
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
        <div style="margin-top: 24px;">
          <a href="${approveUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Approve</a>
          <a href="${rejectUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; margin-left: 8px;">Reject</a>
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; margin-left: 8px;">View All</a>
        </div>
      </div>
    </div>
  `;
}

function buildAssignmentEmail(data: any): string {
  const { request_id, title, requester_name, assigned_name, urgency, due_date, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">New Assignment</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Hi ${assigned_name}, you've been assigned a request</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Request ID</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${request_id}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Title</td><td style="padding: 8px 0; font-size: 14px;">${title}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Requester</td><td style="padding: 8px 0; font-size: 14px;">${requester_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Urgency</td><td style="padding: 8px 0; font-size: 14px;">${urgency || 'Normal'}</td></tr>
          ${due_date ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Due Date</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #dc2626;">${due_date}</td></tr>` : ''}
        </table>
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Request</a>
        </div>
      </div>
    </div>
  `;
}

function buildClaimedEmail(data: any): string {
  const { request_id, title, requester_name, assigned_name, urgency, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Job Claimed</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${assigned_name} has claimed this request</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Request ID</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${request_id}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Title</td><td style="padding: 8px 0; font-size: 14px;">${title}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Requester</td><td style="padding: 8px 0; font-size: 14px;">${requester_name || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Claimed By</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${assigned_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Urgency</td><td style="padding: 8px 0; font-size: 14px;">${urgency || 'Normal'}</td></tr>
        </table>
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Request</a>
        </div>
      </div>
    </div>
  `;
}

function buildReassignedEmail(data: any): string {
  const { request_id, title, old_name, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Assignment Changed</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Hi ${old_name}, this request has been reassigned</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="font-size: 14px; color: #374151;">Request <strong>${request_id}</strong> — <strong>${title}</strong> has been assigned to someone else.</p>
        <div style="margin-top: 16px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Request</a>
        </div>
      </div>
    </div>
  `;
}

function buildStatusChangeEmail(data: any): string {
  const { request_id, title, old_status, new_status, remarks, history, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Status Update</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${request_id}: ${old_status} → ${new_status}</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="font-size: 14px; color: #374151;">Request <strong>${title}</strong> status changed from <strong>${old_status}</strong> to <strong>${new_status}</strong>.</p>
        ${remarks ? `<div style="margin-top: 8px; padding: 10px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #374151;"><strong>Remarks:</strong> ${remarks}</div>` : ''}
        ${historyHtml(history)}
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Request</a>
        </div>
      </div>
    </div>
  `;
}

function buildCompletedEmail(data: any): string {
  const { request_id, title, remarks, history, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Request Completed</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${request_id} has been completed</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="font-size: 14px; color: #374151;">Your request <strong>${title}</strong> (${request_id}) has been marked as <strong style="color: #10b981;">Completed</strong>.</p>
        ${remarks ? `<div style="margin-top: 8px; padding: 10px; background: #f0fdf4; border-radius: 8px; font-size: 13px; color: #374151; border: 1px solid #bbf7d0;"><strong>Remarks:</strong> ${remarks}</div>` : ''}
        ${historyHtml(history)}
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View Details</a>
        </div>
      </div>
    </div>
  `;
}

function buildPendingInfoEmail(data: any): string {
  const { request_id, title, remarks, history, token } = data;
  const viewUrl = `${PORTAL_URL}/action?token=${token}&action=view`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Action Needed</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${request_id} requires additional information</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="font-size: 14px; color: #374151;">Your request <strong>${title}</strong> (${request_id}) has been set to <strong style="color: #d97706;">Pending Info</strong> — additional information or content is needed to proceed.</p>
        ${remarks ? `<div style="margin-top: 8px; padding: 10px; background: #fffbeb; border-radius: 8px; font-size: 13px; color: #374151; border: 1px solid #fde68a;"><strong>What's needed:</strong> ${remarks}</div>` : ''}
        ${historyHtml(history)}
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Provide Information</a>
        </div>
      </div>
    </div>
  `;
}

function buildOverdueEmail(data: any): string {
  const { requests } = data;
  const viewUrl = `${PORTAL_URL}/requests?status=In+Progress`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Overdue Tasks Reminder</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${requests.length} task(s) past due date</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 8px 4px; color: #6b7280;">ID</th>
              <th style="text-align: left; padding: 8px 4px; color: #6b7280;">Title</th>
              <th style="text-align: left; padding: 8px 4px; color: #6b7280;">Due Date</th>
              <th style="text-align: left; padding: 8px 4px; color: #6b7280;">Days Over</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map((r: any) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 4px; font-family: monospace; color: #6b7280;">${r.request_id}</td>
                <td style="padding: 8px 4px; font-weight: 500;">${r.title}</td>
                <td style="padding: 8px 4px; color: #dc2626;">${r.due_date}</td>
                <td style="padding: 8px 4px;"><span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${r.days_over} days</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 24px;">
          <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">View All In Progress</a>
        </div>
      </div>
    </div>
  `;
}

function buildRequestReceivedEmail(data: any): string {
  const { request_id, title, requester_name, department, urgency, description } = data;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Request Received</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Hi ${requester_name || 'there'}, your request has been submitted</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">Thank you for your request. The DIX team has received it and will process it shortly.</p>
        <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; padding: 12px;">
          <tr><td style="padding: 8px; color: #6b7280; font-size: 13px; width: 120px;">Reference</td><td style="padding: 8px; font-size: 14px; font-weight: 600; font-family: monospace;">${request_id}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Title</td><td style="padding: 8px; font-size: 14px; font-weight: 600;">${title}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Department</td><td style="padding: 8px; font-size: 14px;">${department || '-'}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Priority</td><td style="padding: 8px; font-size: 14px;"><span style="background: ${urgency === 'Critical' ? '#fee2e2' : urgency === 'Urgent' ? '#fef3c7' : '#f3f4f6'}; color: ${urgency === 'Critical' ? '#dc2626' : urgency === 'Urgent' ? '#d97706' : '#374151'}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${urgency || 'Normal'}</span></td></tr>
        </table>
        ${description ? `<div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #374151;"><strong>Description:</strong><br>${description}</div>` : ''}
        <div style="margin-top: 20px; padding: 12px; background: #eef2ff; border-radius: 8px; font-size: 13px; color: #4338ca;">
          <strong>What happens next?</strong><br>
          The DIX team will review your request and assign it to the appropriate team member. You will receive another email once the status is updated.
        </div>
      </div>
    </div>
  `;
}

function buildDailyDigestEmail(data: any): string {
  const { unassigned, overdue, dueToday, totalInProgress, escalated } = data;
  const portalUrl = PORTAL_URL;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const renderRequests = (items: any[]) => items.map((r: any) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 6px 4px; font-family: monospace; color: #6b7280; font-size: 12px;">${r.request_id || r.id}</td>
      <td style="padding: 6px 4px; font-size: 13px; font-weight: 500;">${r.title}</td>
      <td style="padding: 6px 4px; font-size: 12px; color: #6b7280;">${r.assigned_name || 'Unassigned'}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #3730a3, #6366f1); padding: 24px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">📋 Daily Digest</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">${today}</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <!-- Summary Stats -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 33%; text-align: center; padding: 12px; background: #fef3c7; border-radius: 12px 0 0 0;">
              <p style="font-size: 24px; font-weight: 700; color: #d97706; margin: 0;">${unassigned?.length || 0}</p>
              <p style="font-size: 11px; color: #92400e; margin: 4px 0 0;">Unassigned</p>
            </td>
            <td style="width: 33%; text-align: center; padding: 12px; background: #fee2e2; border-radius: 0;">
              <p style="font-size: 24px; font-weight: 700; color: #dc2626; margin: 0;">${escalated || 0}</p>
              <p style="font-size: 11px; color: #991b1b; margin: 4px 0 0;">Escalated (3d+)</p>
            </td>
            <td style="width: 33%; text-align: center; padding: 12px; background: #dbeafe; border-radius: 0 12px 0 0;">
              <p style="font-size: 24px; font-weight: 700; color: #2563eb; margin: 0;">${totalInProgress || 0}</p>
              <p style="font-size: 11px; color: #1e40af; margin: 4px 0 0;">In Progress</p>
            </td>
          </tr>
        </table>

        ${unassigned?.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 13px; font-weight: 600; color: #d97706; margin: 0 0 8px;">⚠️ Unassigned Jobs (${unassigned.length})</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #fffbeb; border-radius: 8px; padding: 8px;">
            <thead><tr style="border-bottom: 2px solid #fde68a;">
              <th style="text-align: left; padding: 4px; color: #92400e; font-size: 11px;">ID</th>
              <th style="text-align: left; padding: 4px; color: #92400e; font-size: 11px;">Title</th>
              <th style="text-align: left; padding: 4px; color: #92400e; font-size: 11px;">Assigned</th>
            </tr></thead>
            <tbody>${renderRequests(unassigned)}</tbody>
          </table>
        </div>` : ''}

        ${overdue?.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 13px; font-weight: 600; color: #dc2626; margin: 0 0 8px;">🔴 Overdue (${overdue.length})</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #fef2f2; border-radius: 8px; padding: 8px;">
            <thead><tr style="border-bottom: 2px solid #fecaca;">
              <th style="text-align: left; padding: 4px; color: #991b1b; font-size: 11px;">ID</th>
              <th style="text-align: left; padding: 4px; color: #991b1b; font-size: 11px;">Title</th>
              <th style="text-align: left; padding: 4px; color: #991b1b; font-size: 11px;">Assigned</th>
            </tr></thead>
            <tbody>${renderRequests(overdue)}</tbody>
          </table>
        </div>` : ''}

        ${dueToday?.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 13px; font-weight: 600; color: #2563eb; margin: 0 0 8px;">📅 Due Today (${dueToday.length})</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #eff6ff; border-radius: 8px; padding: 8px;">
            <thead><tr style="border-bottom: 2px solid #bfdbfe;">
              <th style="text-align: left; padding: 4px; color: #1e40af; font-size: 11px;">ID</th>
              <th style="text-align: left; padding: 4px; color: #1e40af; font-size: 11px;">Title</th>
              <th style="text-align: left; padding: 4px; color: #1e40af; font-size: 11px;">Assigned</th>
            </tr></thead>
            <tbody>${renderRequests(dueToday)}</tbody>
          </table>
        </div>` : ''}

        ${(unassigned?.length || 0) === 0 && (overdue?.length || 0) === 0 && (dueToday?.length || 0) === 0 ? `
        <div style="text-align: center; padding: 24px; background: #f0fdf4; border-radius: 12px;">
          <p style="font-size: 28px; margin: 0;">✅</p>
          <p style="font-size: 14px; color: #166534; font-weight: 600; margin: 8px 0 0;">All clear! No action items today.</p>
        </div>` : ''}

        <div style="margin-top: 20px; text-align: center;">
          <a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">Open Dashboard</a>
        </div>
      </div>
    </div>
  `;
}
