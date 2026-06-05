export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = req.query.email || 'aiman291106@gmail.com';

  // Call the internal send-email API
  try {
    const portalUrl = process.env.PORTAL_URL || 'https://dix-job-portal.vercel.app';
    const response = await fetch(`${portalUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '🧪 Test Email from DIX Portal',
        type: 'completed',
        data: {
          request_id: 'REQ-TEST',
          title: 'Test Email',
          old_status: 'In Progress',
          new_status: 'Completed',
          remarks: 'This is a test email',
          history: [],
          token: 'test-token',
        },
      }),
    });

    const body = await response.text();
    return res.status(response.status).json({
      status: response.status,
      ok: response.ok,
      body: JSON.parse(body),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
