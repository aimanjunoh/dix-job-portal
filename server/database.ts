import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'dix-portal.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    department TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT DEFAULT '',
    department TEXT DEFAULT '',
    category TEXT DEFAULT '',
    urgency TEXT NOT NULL DEFAULT 'Normal',
    description TEXT DEFAULT '',
    assigned_to INTEGER,
    status TEXT NOT NULL DEFAULT 'New',
    remarks TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT DEFAULT '',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
  );
`);

// Seed data
function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
  if (userCount.c > 0) return; // Already seeded

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Seed users
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password, role, department, status) VALUES (?, ?, ?, ?, ?, ?)'
  );

  insertUser.run('Admin', 'admin@dix.local', hash('admin123'), 'admin', 'Management', 'active');
  insertUser.run('Aiman', 'aiman@dix.local', hash('password123'), 'staff', 'Web Development', 'active');
  insertUser.run('Fakhrul', 'fakhrul@dix.local', hash('password123'), 'staff', 'Design', 'active');

  // Seed 20 requests
  const insertRequest = db.prepare(`
    INSERT INTO requests (request_id, title, requester_name, requester_email, department, category, urgency, description, assigned_to, status, remarks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  const sampleRequests = [
    ['REQ-0001', 'Homepage Banner Update', 'Marketing Team', 'marketing@company.com', 'Marketing', 'Web', 'Urgent', 'Update the main banner with new campaign visuals and CTA buttons.', 2, 'In Progress', 'Working on it', '-1 day', '-1 day'],
    ['REQ-0002', 'Employee Onboarding Portal', 'HR Department', 'hr@company.com', 'HR', 'Web App', 'Critical', 'Build an internal portal for new employee onboarding with document upload.', null, 'New', '', '-2 days', '-2 days'],
    ['REQ-0003', 'Monthly Report Dashboard', 'Finance Team', 'finance@company.com', 'Finance', 'Dashboard', 'Normal', 'Create a dashboard showing monthly revenue, expenses and KPIs.', 3, 'Pending Info', 'Waiting for data from finance', '-3 days', '-1 day'],
    ['REQ-0004', 'Mobile App Login Fix', 'QA Team', 'qa@company.com', 'Engineering', 'Bug Fix', 'Urgent', 'Users report intermittent login failures on iOS devices.', 2, 'In Progress', 'Investigating auth flow', '-4 days', '-2 days'],
    ['REQ-0005', 'Product Catalog Redesign', 'Product Team', 'product@company.com', 'Product', 'Design', 'Normal', 'Redesign the product catalog page with improved UX and filtering.', null, 'New', '', '-5 days', '-5 days'],
    ['REQ-0006', 'API Rate Limiting', 'DevOps', 'devops@company.com', 'Engineering', 'Backend', 'Critical', 'Implement rate limiting on public API endpoints to prevent abuse.', 3, 'Completed', 'Deployed to production', '-10 days', '-2 days'],
    ['REQ-0007', 'Customer Feedback Form', 'CX Team', 'cx@company.com', 'Customer Experience', 'Web', 'Normal', 'Create a multi-step feedback form with sentiment analysis integration.', null, 'New', '', '-6 days', '-6 days'],
    ['REQ-0008', 'Email Template System', 'Marketing', 'marketing@company.com', 'Marketing', 'Email', 'Urgent', 'Build reusable email templates for campaign automation.', 2, 'New', '', '-7 days', '-7 days'],
    ['REQ-0009', 'Inventory Tracking Module', 'Operations', 'ops@company.com', 'Operations', 'Web App', 'Normal', 'Track inventory levels, reorder points, and supplier information.', null, 'New', '', '-8 days', '-8 days'],
    ['REQ-0010', 'SSO Integration', 'IT Security', 'security@company.com', 'IT', 'Security', 'Critical', 'Integrate SAML-based SSO with corporate Azure AD.', 3, 'In Progress', 'Configuring SAML endpoints', '-9 days', '-3 days'],
    ['REQ-0011', 'Blog CMS Setup', 'Content Team', 'content@company.com', 'Marketing', 'CMS', 'Normal', 'Set up a headless CMS for the company blog with markdown support.', null, 'New', '', '-11 days', '-11 days'],
    ['REQ-0012', 'Payment Gateway Upgrade', 'Finance', 'finance@company.com', 'Finance', 'Backend', 'Urgent', 'Upgrade payment gateway SDK to latest version for PCI compliance.', 2, 'Pending Info', 'Awaiting vendor documentation', '-12 days', '-4 days'],
    ['REQ-0013', 'Data Export Feature', 'Analytics', 'analytics@company.com', 'Data', 'Feature', 'Normal', 'Allow users to export reports in CSV and PDF formats.', null, 'New', '', '-13 days', '-13 days'],
    ['REQ-0014', 'Push Notification Service', 'Mobile Team', 'mobile@company.com', 'Engineering', 'Mobile', 'Normal', 'Implement push notifications for the mobile app using FCM.', 3, 'Completed', 'Live in production', '-15 days', '-5 days'],
    ['REQ-0015', 'Knowledge Base Portal', 'Support', 'support@company.com', 'Support', 'Web App', 'Normal', 'Build an internal knowledge base with search and categorization.', null, 'New', '', '-14 days', '-14 days'],
    ['REQ-0016', 'Performance Monitoring', 'DevOps', 'devops@company.com', 'Engineering', 'DevOps', 'Urgent', 'Set up APM tools and custom dashboards for application monitoring.', 2, 'In Progress', 'Installing agents', '-16 days', '-6 days'],
    ['REQ-0017', 'Client Portal MVP', 'Sales', 'sales@company.com', 'Sales', 'Web App', 'Critical', 'Build minimum viable client portal with document sharing and messaging.', null, 'New', '', '-17 days', '-17 days'],
    ['REQ-0018', 'Automated Testing Suite', 'QA', 'qa@company.com', 'Engineering', 'QA', 'Normal', 'Create end-to-end automated test suite for critical user journeys.', 3, 'In Progress', 'Writing test cases', '-18 days', '-7 days'],
    ['REQ-0019', 'GDPR Compliance Audit', 'Legal', 'legal@company.com', 'Legal', 'Compliance', 'Urgent', 'Audit all data processing activities and create compliance report.', null, 'New', '', '-19 days', '-19 days'],
    ['REQ-0020', 'Chatbot Integration', 'CX Team', 'cx@company.com', 'Customer Experience', 'AI', 'Normal', 'Integrate AI chatbot for first-line customer support queries.', null, 'New', '', '-20 days', '-20 days'],
  ];

  const insertMany = db.transaction(() => {
    for (const r of sampleRequests) {
      insertRequest.run(...r);
    }
  });
  insertMany();

  // Seed activity logs
  const insertLog = db.prepare(
    `INSERT INTO activity_logs (request_id, action, performed_by, details, timestamp) VALUES (?, ?, ?, ?, datetime('now', ?))`
  );

  const insertLogs = db.transaction(() => {
    insertLog.run(1, 'Request Created', 'Admin', 'Homepage Banner Update created', '-1 day');
    insertLog.run(1, 'Request Assigned', 'Admin', 'Assigned to Aiman', '-1 day');
    insertLog.run(1, 'Status Changed', 'Aiman', 'Status changed to In Progress', '-1 day');
    insertLog.run(2, 'Request Created', 'Admin', 'Employee Onboarding Portal created', '-2 days');
    insertLog.run(3, 'Request Created', 'Admin', 'Monthly Report Dashboard created', '-3 days');
    insertLog.run(3, 'Request Assigned', 'Admin', 'Assigned to Fakhrul', '-3 days');
    insertLog.run(4, 'Request Created', 'Admin', 'Mobile App Login Fix created', '-4 days');
    insertLog.run(6, 'Request Created', 'Admin', 'API Rate Limiting created', '-10 days');
    insertLog.run(6, 'Status Changed', 'Fakhrul', 'Status changed to Completed', '-2 days');
    insertLog.run(10, 'Request Created', 'Admin', 'SSO Integration created', '-9 days');
  });
  insertLogs();

  console.log('Database seeded successfully');
}

seed();

export default db;
