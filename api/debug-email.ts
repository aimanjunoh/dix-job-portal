export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GMAIL_SCRIPT_URL = process.env.GMAIL_SCRIPT_URL || '';
  const GMAIL_WEBHOOK_SECRET = process.env.GMAIL_WEBHOOK_SECRET || 'dix-gmail-secret-2024';

  let gmailTest = null;
  if (GMAIL_SCRIPT_URL) {
    try {
      const testRes = await fetch(GMAIL_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          to: ['test@example.com'],
          subject: 'Test Email',
          html: '<p>Test</p>',
          secret: GMAIL_WEBHOOK_SECRET,
        }),
        redirect: 'follow',
      });
      gmailTest = {
        status: testRes.status,
        statusText: testRes.statusText,
        body: await testRes.text(),
        ok: testRes.ok,
      };
    } catch (err: any) {
      gmailTest = { error: err.message };
    }
  }

  return res.status(200).json({
    GMAIL_SCRIPT_URL: GMAIL_SCRIPT_URL ? GMAIL_SCRIPT_URL.substring(0, 50) + '...' : '(not set)',
    GMAIL_WEBHOOK_SECRET: GMAIL_WEBHOOK_SECRET ? '(set)' : '(not set)',
    gmailTest,
  });
}
