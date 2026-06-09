# DIX Job Portal — Project Summary

> Complete reference document capturing architecture, decisions, features, and implementation history.

---

## 1. Project Overview

**DIX Job Portal** is a full-stack web application for managing daily operational requests (BAU) and long-term web development projects. It was built as a prototype for a small operational team, prioritizing simplicity, clean design, and practical functionality over enterprise complexity.

- **Production URL:** https://dix-job-portal.vercel.app
- **Repository:** https://github.com/aimanjunoh/dix-job-portal.git
- **Database:** Supabase (PostgreSQL) at `btdnptayjrtouezqehal.supabase.co`

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety |
| Tailwind CSS | 3.4 | Styling (utility-first) |
| Vite | 6.0 | Build tool |
| React Router | 6.28 | Client-side routing |
| Recharts | 3.8 | Data visualization (Insights page) |
| XLSX (SheetJS) | 0.18 | Excel export |
| Lucide React | 0.460 | Icons |
| React Hot Toast | 2.4 | Notifications |

### Backend & Database
| Technology | Purpose |
|---|---|
| Supabase | Auth, PostgreSQL database, RLS |
| Supabase JS Client | Client-side DB queries (no separate backend) |

### Hosting & Deployment
| Service | Tier | Purpose |
|---|---|---|
| GitHub | Free (private repo) | Source code |
| Vercel | Free | Frontend hosting + auto-deploy |
| Supabase | Free | Auth + PostgreSQL |

### External Integrations
| Service | Purpose |
|---|---|
| Gmail (via Google Apps Script) | Email ingestion from "Request Job" label |
| GmailApp | Outbound email notifications |

---

## 3. Design System

### Glassmorphism UI
The entire portal uses a glassmorphism design language:

- **`.glass`** — Semi-transparent white (`rgba(255,255,255,0.85)`) with `backdrop-filter: blur(20px)` and 16px border-radius
- **`.glass-dark`** — More opaque (`rgba(255,255,255,0.92)`) for sidebar and key panels
- **`.glass-card`** — Lighter (`rgba(255,255,255,0.7)`) with hover lift animation
- **Background** — Gradient `linear-gradient(135deg, #667eea, #764ba2)` on body
- **Status badges** — Color-coded CSS classes (`.status-new`, `.status-completed`, etc.)
- **Urgency badges** — `.urgency-normal` (indigo), `.urgency-urgent` (amber), `.urgency-critical` (red)
- **Print styles** — `@media print` rules for clean PDF export

---

## 4. Features

### 4.1 Authentication & Authorization
- **Supabase Auth** — Email/password login with JWT tokens
- **Roles:** `admin`, `staff`, `guest` (enforced via CHECK constraint)
- **Guest Preview Mode** — Read-only demo access via login page button
  - Guests can view dashboard, requests, projects, activities, insights
  - Cannot create, edit, assign, claim, or change any status
  - Export buttons hidden for guests
- **Auto-sync** — `users` table mirrors `auth.users` with UUID foreign key
- **Personalized greeting** — Dashboard shows "Welcome back, [Name]" with department/position and role badge

### 4.2 Dashboard (Operational Command Center)
The dashboard is designed as an operational command center — showing what requires action, what is assigned, and what needs attention today. All analytics and reporting are separated into the Insights page.

**Header:**
- "Welcome back, [Name]" greeting with department/position subtitle
- Role badge (Administrator, Staff, Guest)
- "Insights & Reports" button linking to Insights page

**Section A — Request Summary:**
- 7 clickable stat cards: Total, New, Unassigned, Escalated, In Progress, Pending Info, Completed
- Clicking any card navigates to filtered Requests page

**Section B — My Workload (personalized):**
- 4 clickable cards: Total Assigned, Active, Overdue, Completed
- Shows counts for the logged-in user's assigned requests
- Only visible for non-guest users with assigned requests

**Section C — My Active Requests:**
- Scrollable list of user's active requests with SLA indicators (Overdue, Due Soon)
- "View All My Requests" link to `/requests?mine=true`

**Section D — Unassigned Requests + Recently Updated:**
- Side-by-side panels
- Unassigned requests with admin assign dropdown or staff "Claim This Job" button
- Escalation indicators for requests unassigned 3+ days
- Recently Updated requests list

**Section E — Compact Projects Summary:**
- 3 clickable cards: Active Projects, Delayed, Completed
- Active navigates to `/projects?status=Active`, Completed to `/projects?status=Completed`
- "View Projects" button
- No progress bars on dashboard (detailed tracking stays in Projects page)

**Removed from Dashboard (moved to Insights):**
- SLA Overview widgets (Within SLA, Approaching, Overdue, Compliance %)
- Full project listing with progress bars
- Analytics charts and reporting metrics

### 4.3 Job Requests (BAU)
- Full CRUD: Create, Read, Update, Delete
- Auto-generated IDs: `REQ-0001`, `REQ-0002`, etc.
- Fields: Title, Requester, Department, Category, Urgency, Description, Status, Remarks
- Statuses: New, In Progress, Pending Info, Completed
- Staff assignment (admin) or self-claim (staff)
- "My Requests" filter checkbox with `?mine=true` URL param
- Activity logging for all changes

### 4.4 SLA Management
- **Rules:** Normal = 3 working days, Urgent = 2, Critical = same day
- **Pause/Resume:** SLA pauses on Pending Info/Content/Approval, resumes when active
- **Dynamic calculation:** SLA status computed client-side from `created_at` + urgency + paused days
- **Statuses:** Within SLA, Approaching SLA (1 day remaining), Overdue, Paused
- **SLA insights available on Insights page** (moved from dashboard)

### 4.5 Project Management
- Full CRUD for projects with owner assignment
- Statuses: Planning, Active, On Hold, Completed, Cancelled
- Health indicators: On Track, At Risk, Delayed (calculated from progress vs. time elapsed)
- **Weighted milestones:** Default 5-phase template
  - Phase 1 Planning (10%), Phase 2 Design (20%), Phase 3 Development (30%), Phase 4 Testing (20%), Phase 5 Deployment (20%)
- Owners can rename phases and adjust weights (must total 100%)
- Progress = sum of completed milestone weights
- Fallback to count-based progress when no weights set
- Members, tasks, milestones, and notes per project
- URL param support: `/projects?status=Active` pre-filters the list

### 4.6 Insights Page (Analytics & Reporting)
5 tabbed sections:

| Tab | Content |
|---|---|
| **Requests** | Total/Completed/Pending/Overdue/Escalated + Monthly trend, By Category/Department/Staff, Status Distribution |
| **SLA** | Compliance %, Avg Resolution/Response Time, Overdue count + Compliance/Overdue/Resolution trends |
| **Projects** | Total/Active/Completed/Delayed + Status distribution, By Owner, Completion trend, Duration analysis |
| **Team** | Per-staff table (Assigned/Completed/Projects/Overdue/SLA%/Workload) + Workload/Activity charts |
| **Summary** | Executive overview cards + Top Categories + Workload distribution pie + Summary panels |

**Charts:** Recharts — BarChart, LineChart, PieChart, AreaChart  
**Exports:** CSV (native JS), Excel (xlsx multi-sheet), PDF (window.print with @media print CSS)

### 4.7 Email Integration
- **Inbound:** Gmail emails labeled "Request Job" auto-ingested as portal requests
- **Outbound notifications:**
  - Request received (to requester)
  - Assignment notifications (to assigned staff)
  - Completion alerts (to requester and relevant parties)
  - Escalation alerts (unassigned 3+ days)
  - **Staff self-claim notification** (to all admins when staff claims a job)
  - Daily digest for overdue items
- **Delivery:** GmailApp via Google Apps Script Web App

### 4.8 Activity Logs
- Automatic logging of all request/project actions
- Tracks: who performed action, what changed, when
- Viewable in dedicated Activities page

### 4.9 User Management (Admin Only)
- CRUD for users
- Fields: Name, Email, Role (admin/staff/guest), Position/Department, Status
- Auto-sync with auth.users

---

## 5. Database Schema

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | User profiles (extends auth.users) | id (UUID PK -> auth.users), name, email, role, department, status |
| `requests` | Job requests | id, request_id, title, requester_name/email, department, category, urgency, status, assigned_to (FK->users), sla_due_date, sla_status, sla_paused_days |
| `activity_logs` | Audit trail | id, request_id (FK), action, performed_by, details, timestamp |
| `projects` | Project records | id, project_id, title, owner_id (FK->users), status, start_date, due_date, progress |
| `project_members` | Project team members | project_id (FK), user_id (FK), role (owner/member) |
| `project_milestones` | Milestone phases | project_id (FK), title, completed, sort_order, weight (0-100) |
| `project_tasks` | Project tasks | project_id (FK), milestone_id (FK), assigned_to (FK), status, priority, due_date |
| `project_notes` | Project activity feed | project_id (FK), user_id (FK), note |

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce `auth.role() = 'authenticated'` or `auth.uid()` checks
- Users can view all users but only update own profile
- Service role can insert users (for auth sync)

### SQL Migration Files
| File | Purpose |
|---|---|
| `supabase-schema.sql` | Core tables: users, requests, activity_logs + RLS + triggers |
| `project-schema.sql` | Project tables: projects, members, milestones, tasks, notes + RLS |
| `sla-migration.sql` | Adds SLA columns to requests table |
| `milestone-weight-migration.sql` | Adds weight column to project_milestones |

---

## 6. Application Architecture

### File Structure
```
src/
├── api/
│   └── index.ts              # All API functions (Supabase queries + helpers)
├── components/
│   ├── Insights/
│   │   ├── RequestInsights.tsx
│   │   ├── SlaInsights.tsx
│   │   ├── ProjectInsights.tsx
│   │   ├── TeamWorkload.tsx
│   │   └── ManagementSummary.tsx
│   ├── Layout/
│   │   ├── Layout.tsx         # Page wrapper with sidebar
│   │   └── Sidebar.tsx        # Navigation sidebar
│   └── shared/
│       ├── Modal.tsx          # Reusable modal
│       └── StatusBadge.tsx    # Status badge component
├── context/
│   └── AuthContext.tsx        # Auth provider + useAuth hook
├── lib/
│   └── supabase.ts            # Supabase client initialization
├── pages/
│   ├── Dashboard.tsx          # Operational command center
│   ├── Requests.tsx           # Request list with filters
│   ├── RequestDetail.tsx      # Single request view
│   ├── Projects.tsx           # Project list (URL param aware)
│   ├── ProjectDetail.tsx      # Single project with milestones/tasks
│   ├── Users.tsx              # User management (admin)
│   ├── Activities.tsx         # Activity logs
│   ├── Insights.tsx           # Analytics & reporting
│   ├── Login.tsx              # Login + guest preview
│   └── QuickAction.tsx        # Quick action page
├── types/
│   └── insights.ts            # TypeScript interfaces for Insights
├── utils/
│   ├── insights.ts            # Pure computation functions
│   └── export.ts              # CSV/Excel/PDF export utilities
├── App.tsx                    # Router + protected routes
├── main.tsx                   # React entry point
└── index.css                  # Global styles + glassmorphism
```

### Data Flow (Insights)
```
api.insights.fetchAll()
  -> 5 parallel Supabase queries (requests, projects, users, tasks, milestones)
  -> Enrichment (SLA status, project health/progress)
  -> Passed to Insights page state
  -> useMemo() calls pure functions from utils/insights.ts
  -> Computed stats passed as props to section components
  -> Recharts renders visualizations
```

### API Layer (`src/api/index.ts`)
Key namespaces:
- `api.requests.*` — CRUD, dashboard stats, SLA calculations, My Workload stats
- `api.projects.*` — CRUD, members, milestones, tasks, notes
- `api.users.*` — CRUD, profile management
- `api.activities.*` — Log creation and retrieval
- `api.insights.fetchAll()` — Parallel data fetching for analytics

### Routing
```
/login          -> Login page
/action         -> QuickAction page
/               -> Protected Layout
  /             -> Dashboard (operational command center)
  /users        -> User Management (admin only)
  /requests     -> Requests list (supports ?status, ?unassigned, ?mine, ?slaStatus params)
  /requests/:id -> Request detail
  /activities   -> Activity logs
  /projects     -> Projects list (supports ?status param)
  /projects/:id -> Project detail
  /insights     -> Insights (analytics)
*               -> Redirect to /
```

---

## 7. Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GMAIL_SCRIPT_URL` | Google Apps Script Web App URL |
| `GMAIL_WEBHOOK_SECRET` | Secret for authenticating Gmail webhooks |
| `RESEND_API_KEY` | Resend email service key (legacy, replaced by Gmail) |

---

## 8. Implementation History

### Phase 0 — Foundation
- Initial Express + SQLite prototype
- Docker/Hugging Face deployment attempt
- Glitch hosting attempt

### Phase 1 — Migration to React + Supabase
- Migrated from Express/SQLite to React/Vite/TypeScript + Supabase
- Deployed to Vercel
- Basic CRUD for requests
- Email approval workflow (Resend)

### Phase 2 — Email & Core Features
- Gmail integration via Google Apps Script
- Request received email notifications
- Clickable dashboard cards with filters
- User management department->position rename
- UUID fixes for foreign keys
- RLS policy fixes (idempotent DROP IF EXISTS)

### Phase 3 — Email Enhancements
- Switched from Resend to Gmail via Apps Script
- CORS fixes for Gmail Apps Script
- Admin completion emails
- Staff self-claim functionality
- Escalation alerts (unassigned 3+ days)
- Daily digest for overdue items
- Guest preview login

### Phase 4 — Project Management
- Full project CRUD with owner assignment
- Members, milestones, tasks, notes
- Project health indicators (On Track/At Risk/Delayed)
- Dashboard project section

### Phase 5 — SLA & Progress
- SLA management (working days, pause/resume)
- Dashboard SLA widgets
- Weighted milestone phases (5-phase template)
- Progress = sum of completed milestone weights

### Phase 6 — Insights & Analytics
- 5-section Insights page with tabbed navigation
- Recharts visualizations (13 charts total)
- CSV/Excel/PDF exports
- Parallel Supabase data fetching
- Pure computation functions separated from UI

### Phase 7 — Personalization & Notifications
- Personalized dashboard greeting ("Welcome back, [Name]" + role)
- Admin notification on staff job claim
- My Requests filter and My Workload dashboard widget

### Phase 8 — Dashboard UX Restructure
- Dashboard restructured as Operational Command Center
- SLA Overview and full Projects section removed from dashboard
- My Workload section with personalized stats (Assigned, Active, Overdue, Completed)
- My Active Requests list with SLA indicators
- Compact Projects Summary widget (Active, Delayed, Completed)
- All dashboard summary cards now clickable (including project cards)
- URL param support added to Projects page (`?status=Active`, `?status=Completed`)
- Analytics and reporting consolidated in Insights page

---

## 9. Key Technical Decisions

| Decision | Rationale |
|---|---|
| No separate backend server | Supabase client handles auth + queries directly, reducing hosting cost |
| Glassmorphism CSS | Clean, modern look without heavy UI library |
| Recharts over Chart.js | React-native integration, declarative API |
| xlsx (SheetJS) for Excel | Lightweight, multi-sheet support |
| window.print() for PDF | Zero dependency, @media print CSS handles formatting |
| Tab-based Insights UI | Keeps page clean, only active tab renders |
| Pure computation functions | Separated from components for testability |
| UUID foreign keys | Required by Supabase auth.users referential integrity |
| Working days SLA | Weekends excluded from SLA calculations |
| Parallel Supabase queries | Promise.all for 5 queries in Insights reduces load time |
| Operational vs Analytical split | Dashboard for action, Insights for reporting — reduces cognitive load |
| URL-based filtering | Enables deep linking from dashboard cards to filtered lists |

---

## 10. Known Constraints (Free Tier)

| Constraint | Impact |
|---|---|
| Supabase 500MB database | Sufficient for small team; attachments should use Supabase Storage (1GB free) |
| Supabase 50K monthly active users | More than enough |
| Vercel 100GB bandwidth | Adequate for low-traffic portal |
| GitHub private repo | Single contributor, no issues |
| Gmail daily quota (~1500 emails) | Sufficient for notifications |
| No server-side cron | Daily digest relies on scheduled external trigger |

---

## 11. Security Notes

- All tables protected by Row Level Security (RLS)
- Service role key never exposed in client code
- Guest role enforced at both app and database level
- Auth tokens managed by Supabase client (JWT)
- `.env` file excluded from git (`.gitignore`)
- No sensitive logic in client — validation via RLS policies
- Input sanitization via React's built-in XSS protection

---

*Generated from project history and codebase analysis.*
*Last updated: After Dashboard UX Restructure (Phase 8).*
