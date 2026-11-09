# CaptureCRM Super Admin Suite (Users, Metrics & Audit Logs)

Comprehensive Super Admin portal for CaptureCRM providing centralized user management and role assignment, high-level business and system performance metrics, an immutable administrative audit log, and master platform broadcast controls.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed building a **Complete Super Admin Suite with users, metrics, and audit logs**. The following architectural decisions have been incorporated:

- **Confirmed Scope**: A unified Super Admin Control Center (`/admin`) with four integrated modules: **Executive Platform Metrics**, **User & Team Management**, **Security & Action Audit Logs**, and **Platform Broadcast & System Settings**.
- **Role-Based Access Control (RBAC)**: Supports 4 distinct user tiers: `Super Admin` (Michael Ringa - full platform authority), `Studio Admin` (lead photographer/manager - studio settings, financial records), `Team Photographer` (creates projects, quotes, invoices, logs expenses), and `Assistant / Viewer` (read-only project & client details).
- **Strict Multi-Layer Security**: Gated on both the client (`AuthGuard` + `isSuperUser()`) and Firestore level (`firestore.rules` checking `isSuperUser()` email patterns).
- **Non-Intrusive Integration**: The Admin Suite integrates seamlessly into the current dark/light responsive layout as a dedicated Super Admin navigation item, appearing only when logged in as the Super Admin.

---

## 1. Overview & Core Concept

CaptureCRM currently manages photography/videography operations for Michael and his studio team. As the platform scales, the **Super Admin Suite** gives Michael complete executive visibility and governance over:

1. **User & Studio Directory**: Central registry of all authenticated users, active studio accounts, contact details, assigned roles, and engagement activity.
2. **Platform & Business Intelligence**: Cross-cutting metrics including total invoiced/collected volume in KES, quote-to-contract conversion rates, client acquisition pace, and statutory compliance status.
3. **Tamper-Resistant Audit Trail**: Chronological event log tracking all security, operational, and financial events (e.g., user logins, quote updates, invoice deletions, setting alterations).
4. **Platform Controls & Broadcasts**: Ability to publish platform-wide announcement banners (e.g., maintenance schedules, release notes) and configure global defaults.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Admin Hub Overview (`/admin`)**:
   - Michael accesses `/admin` via the sidebar (restricted to Super Admin email).
   - High-level KPI ribbon displays: Total Active Users, Total Platform Volume (KES), Quotes Conversion Rate, and 24h Audit Events.
   - Quick tabs navigate smoothly between **Metrics & Analytics**, **User Management**, **Audit Logs**, and **Platform Settings**.

2. **User Management Flow**:
   - Filterable, searchable table displaying: Photographer/User Name, Email, Role badge, Status (Active/Suspended), Date Joined, and Lifetime Volume.
   - Quick action drawer/modal to edit user role, toggle active/suspended status, or view user-specific project counts.
   - "Invite Team Member" / "Register Photographer" quick modal to provision new team members with pre-assigned roles.

3. **Security Audit Log Explorer**:
   - Interactive stream of audit events with timestamp (tabular figures), Actor (email/name), Category (Auth, Finance, Project, Settings, Security), Action Description, and Severity level (Info, Warning, Critical).
   - Search by keyword, actor email, or date range.
   - Clickable event row expands to reveal exact change payloads (e.g., previous value vs. new value for financial or role modifications).

4. **Platform Broadcast & System Banner**:
   - Admin creates a broadcast banner with message, alert type (Info, Warning, Announcement), and optional expiration date.
   - All active users instantly see the top notification banner across their sessions.

### Visual Identity & Theme
- **Layout Presence**: Full 1440px desktop grid leveraging CaptureCRM's existing Tailwind architecture and dark/light mode compatibility.
- **Color Discipline**: Neutral canvas (60%), structural card surfaces with 1px hairline dividers (30%), with Emerald (Active), Amber (Warning/Pending), and Crimson (Critical/Suspended) used strictly for semantic state (10%).
- **Typographic Polish**: Monospace tabular figures (`font-mono tabular-nums`) for timestamps, amounts (KES), and IDs; clean unboxed metadata with `·` separators; zero-pill static labels.
- **Zero-Pill Compliance**: Filters implemented as interactive segmented button tabs, avoiding static capsule pills.

---

## 3. Key Product Decisions & Trade-Offs

- **Dedicated Admin Route (`/admin`) vs. Fragmented Settings Pages**:
  - *Decision*: Consolidate all admin capabilities into a single cohesive `/admin` portal with tabbed views instead of scattering user lists across Settings.
  - *Rationale*: Provides a single command center for Michael while keeping everyday operational tools clean and focused.

- **Centralized User Profile Collection (`system_users`)**:
  - *Decision*: Store lightweight user directory documents in `/system_users/{userId}` synced upon authentication.
  - *Rationale*: Client-side Firebase Auth cannot list all users across an application without Firebase Admin SDK / backend. Storing a synced profile doc allows real-time user listing, role assignments, and status flags strictly controlled by Firestore security rules.

- **Firestore Audit Logging (`audit_logs`)**:
  - *Decision*: Dedicated top-level collection `/audit_logs/{logId}`. Every client action helper emits an immutable audit event; Super Admin has read/filter access; regular users can only append their own actions.
  - *Rationale*: Ensures complete audit integrity without slowing down individual document writes.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CaptureCRM Applet                             │
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │   Sidebar Layout    │                 │   Super Admin Suite    │   │
│   │ (Super Admin Guard) ├────────────────►│      (/admin)          │   │
│   └─────────────────────┘                 └───────────┬────────────┘   │
│                                                       │                │
│             ┌─────────────────┬───────────────────────┼────────────────┤
│             ▼                 ▼                       ▼                ▼
│      ┌──────────────┐  ┌──────────────┐       ┌──────────────┐  ┌──────────────┐
│      │   Platform   │  │    User &    │       │    Audit     │  │   Platform   │
│      │   Metrics    │  │  Team Mgmt   │       │     Logs     │  │  Broadcast   │
│      └──────┬───────┘  └──────┬───────┘       └──────┬───────┘  └──────┬───────┘
│             │                 │                      │                 │
│             └─────────────────┴──────────┬───────────┴─────────────────┘
│                                          │
│                                          ▼
│                        ┌───────────────────────────────────┐
│                        │      Zustand Store / State        │
│                        │ (users, auditLogs, metrics, alert)│
│                        └─────────────────┬─────────────────┘
└──────────────────────────────────────────┼─────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Firebase Firestore                             │
│                                                                        │
│   • /system_users/{userId}          (Super Admin read/write, user self)│
│   • /audit_logs/{logId}             (Super Admin read, auth append)   │
│   • /system_announcements/{id}      (Public read, Super Admin write)   │
│   • /users/{userId}/...             (User-namespaced studio records)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models & Schemas

1. **`SystemUser` Model (`/system_users/{userId}`)**:
   ```typescript
   export type UserRole = 'super_admin' | 'studio_admin' | 'photographer' | 'viewer';
   export type UserStatus = 'active' | 'suspended';

   export type SystemUser = {
     id: string; // userId (auth UID)
     email: string;
     displayName?: string;
     role: UserRole;
     status: UserStatus;
     joinedAt: string; // ISO date
     lastActiveAt: string; // ISO date
     phone?: string;
     notes?: string;
   };
   ```

2. **`AuditLog` Model (`/audit_logs/{logId}`)**:
   ```typescript
   export type AuditCategory = 'auth' | 'finance' | 'project' | 'settings' | 'security';
   export type AuditSeverity = 'info' | 'warning' | 'critical';

   export type AuditLog = {
     id: string;
     timestamp: string; // ISO timestamp
     actorId: string;
     actorEmail: string;
     actorName?: string;
     category: AuditCategory;
     action: string; // e.g. "QUOTE_APPROVED", "USER_ROLE_CHANGED", "INVOICE_VOIDED"
     description: string;
     severity: AuditSeverity;
     metadata?: Record<string, any>;
     targetResourceId?: string;
     targetResourceType?: string;
   };
   ```

3. **`SystemAnnouncement` Model (`/system_announcements/{id}`)**:
   ```typescript
   export type SystemAnnouncement = {
     id: string;
     title: string;
     message: string;
     type: 'info' | 'warning' | 'announcement';
     isActive: boolean;
     createdAt: string;
     createdBy: string;
     expiresAt?: string;
   };
   ```

### Implementation Steps

1. **State Store & Types (`src/store/index.ts`)**:
   - Add `SystemUser`, `AuditLog`, `SystemAnnouncement` types.
   - Implement store state slices: `systemUsers`, `auditLogs`, `announcements`, with full CRUD operations and Firestore integration.
   - Helper function `recordAuditLog()` to easily dispatch audit events on critical business actions.

2. **Firebase Rules & Sync (`firestore.rules` & `src/components/FirebaseProvider.tsx`)**:
   - Add security rules for `/system_users/{userId}`, `/audit_logs/{logId}`, and `/system_announcements/{id}` with strict `isSuperUser()` authorization.
   - Set up real-time `onSnapshot` listeners in `FirebaseProvider` when logged in as Super Admin.
   - Ensure automatic user registration into `/system_users` on initial sign-in.

3. **Admin Suite Components & Views (`src/pages/Admin.tsx` & subcomponents)**:
   - Create `Admin.tsx` root page with tabbed views:
     - `AdminMetrics`: Executive KPI cards (Revenue volume, quote conversion, user counts, statutory totals) and activity breakdown.
     - `AdminUsers`: Searchable, filterable user roster, role management modal, and account status toggles.
     - `AdminAuditLogs`: Filterable chronological audit log table with severity tags, actor details, and JSON payload viewer.
     - `AdminSettings`: Platform announcement banner broadcast manager and system export.

4. **Navigation & Global Banner**:
   - Update `src/components/Layout.tsx` to add "Admin Portal" link to the sidebar (gated by `isSuperUser`).
   - Add the dynamic announcement banner component to `Layout.tsx` so all users see active announcements.
   - Register `/admin` route in `src/App.tsx`.
