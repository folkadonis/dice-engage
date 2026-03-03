# Dice Engage — UI Wireframes

All pages share a common layout: **Sidebar** (left) + **Header** (top) + **Content** (center).

---

## User Personas

### 1. 🛡️ Super Admin (Platform Owner)
- **Who**: Dice Engage platform operators
- **Access**: Admin Panel, Tenant Mgmt, DLQ, Rate Limiting, Platform Dashboard
- **Can do**: Create/suspend tenants, assign plans, monitor DLQ, rotate
  platform encryption keys, configure global rate limits, view platform analytics
- **Cannot do**: Configure tenant-level channel providers or secrets
  (that's the Tenant Admin's job — they bring their own API keys)

### 2. 🏢 Tenant Admin (Owner)
- **Who**: Organization owner who signed up for Dice Engage
- **Access**: Dashboard, Journeys, Broadcasts, Segments, Templates, Users,
  Billing, Analytics, Settings, Security, API Keys, Webhooks
- **Can do**: Configure THEIR OWN channel providers (bring their own Twilio,
  SMTP, SES, FCM keys), manage brands, manage team roles (RBAC), manage
  billing, create/send campaigns, set up webhooks + API keys
- **Owns**: All provider credentials are tenant-scoped and encrypted per-tenant

### 3. ✏️ Campaign Manager (Editor)
- **Who**: Marketing team member within a tenant
- **Access**: Dashboard, Journeys, Broadcasts, Segments, Templates, Users,
  Analytics
- **Can do**: Create/edit journeys, build segments, design templates,
  schedule broadcasts, run A/B tests. Cannot manage billing, secrets, or RBAC

### 4. 👁️ Analyst (Viewer)
- **Who**: Read-only stakeholders, report consumers
- **Access**: Dashboard, Analytics, Billing (view-only)
- **Can do**: View metrics, download reports, view broadcast results.
  Cannot create or modify any campaigns

### 5. 👤 End User (Public)
- **Who**: Customers of the tenant's business
- **Access**: Subscription Management page only (public, no login)
- **Can do**: Manage channel preferences (opt-in/out per channel),
  unsubscribe from all communications

---

## User Permissions Matrix

```
┌──────────────────────┬───────┬────────┬────────┬────────┬──────┐
│ Feature              │ Super │ Tenant │Campaign│ Analyst│ End  │
│                      │ Admin │ Admin  │ Manager│ Viewer │ User │
├──────────────────────┼───────┼────────┼────────┼────────┼──────┤
│ Platform Dashboard   │  ✓    │   ✗    │   ✗    │   ✗    │  ✗   │
│ Tenant Management    │  ✓    │   ✗    │   ✗    │   ✗    │  ✗   │
│ Brand Management     │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant's own
│ Workspace Dashboard  │  ✓*   │   ✓    │   ✓    │   ✓    │  ✗   │
│ Journey Builder      │  ✗    │   ✓    │   ✓    │   ✗    │  ✗   │
│ Broadcast / A/B Test │  ✗    │   ✓    │   ✓    │   ✗    │  ✗   │
│ Segment Builder      │  ✗    │   ✓    │   ✓    │   ✗    │  ✗   │
│ Template Editor      │  ✗    │   ✓    │   ✓    │   ✗    │  ✗   │
│ User Management      │  ✗    │   ✓    │   ✓    │   ✗    │  ✗   │
│ Analytics            │  ✓*   │   ✓    │   ✓    │   ✓    │  ✗   │
│ Billing & Usage      │  ✓*   │   ✓    │   ✗    │   ✓**  │  ✗   │
│ Provider Settings    │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant configures OWN providers
│ Channel Registry     │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant's own keys
│ Security / RBAC      │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant's own team
│ Encryption / Secrets │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant's own secrets
│ Rate Limiting        │  ✓    │   ✗    │   ✗    │   ✗    │  ✗   │  ← platform-level only
│ API Keys             │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant's own
│ Webhook Config       │  ✗    │   ✓    │   ✗    │   ✗    │  ✗   │  ← tenant's own
│ DLQ Monitor          │  ✓    │   ✗    │   ✗    │   ✗    │  ✗   │  ← platform-level only
│ Admin Super Panel    │  ✓    │   ✗    │   ✗    │   ✗    │  ✗   │
│ Subscription Mgmt    │  ✗    │   ✗    │   ✗    │   ✗    │  ✓   │
└──────────────────────┴───────┴────────┴────────┴────────┴──────┘
* Super Admin views tenant dashboards/analytics/billing in read-only mode
** Analyst: view-only billing access
```

### Ownership Summary
```
┌─────────────────────────────────────────────────────────────┐
│  SUPER ADMIN (Platform)         │  TENANT ADMIN (Own Org)  │
├─────────────────────────────────┼──────────────────────────┤
│  • Create / suspend tenants     │  • Configure OWN Email   │
│  • Assign plans (Starter/etc)   │    SMTP, SES providers   │
│  • Set global rate limits       │  • Configure OWN Twilio  │
│  • Monitor DLQ across platform  │    SMS + WhatsApp keys   │
│  • Rotate platform encryption   │  • Configure OWN FCM,    │
│    master key                   │    WebPush, RCS, Webhook │
│  • View provider health (all)   │  • Manage OWN secrets    │
│  • Platform-wide analytics      │  • Manage OWN team RBAC  │
│                                 │  • Manage OWN brands     │
│  ✗ Cannot touch tenant's        │  • Manage OWN API keys   │
│    provider credentials         │  • Set up OWN webhooks   │
│  ✗ Cannot send campaigns        │  • Create campaigns      │
│  ✗ Cannot modify tenant data    │  • View OWN billing      │
└─────────────────────────────────┴──────────────────────────┘
```

---

## App Flows

### Flow 1: Super Admin — Onboard a New Tenant (platform-level only)

```
Login ──▶ Admin Panel ──▶ Tenant List ──▶ [+ Create Tenant]
  │                                           │
  │         ┌─────────────────────────────────┘
  │         ▼
  │    Tenant Detail (Super Admin can only set:)
  │    ├─ Tenant name
  │    ├─ Plan type (Starter / Growth / Enterprise)
  │    ├─ Initial status (Active)
  │    └─ Send invite to Tenant Admin email
  │         │
  │         ▼
  │    Rate Limiting ──▶ Plan limits auto-applied
  │    (Starter=100/min, Growth=500/min, Enterprise=2K/min)
  │         │
  │         ▼
  │    Admin Panel ──▶ Verify tenant appears in health table
  │         │
  │         ▼
  │    ⚠ Super Admin does NOT configure channels.
  │    The Tenant Admin receives invite email and sets up
  │    their own providers in Flow 3.
  └──▶ Done. Tenant Admin takes over from here.
```

### Flow 2: Super Admin — Monitor & Resolve DLQ

```
Admin Panel ──▶ [DLQ ▼ Quick Action] ──▶ DLQ Monitor
  │                                          │
  │    ┌─────────────────────────────────────┘
  │    ▼
  │  View pending/failed entries
  │  ├─ Click entry row to expand detail
  │  ├─ Review error + payload
  │  ├─ [Retry Now] ──▶ Triggers retry with exponential backoff
  │  ├─ [Move to Failed] ──▶ Marks as permanently failed
  │  └─ Check Provider Health on Admin Panel if errors recurring
  │       │
  │       ▼
  │  Channel Registry ──▶ [Test Connection] on failing provider
  │       │
  └──▶ Dashboard ──▶ Verify message volume recovers
```

### Flow 3: Tenant Admin — First-Time Setup

```
Login (SSO/Google) ──▶ Dashboard (empty state)
  │
  ├──▶ Settings > Providers
  │    ├─ [+ Add] Email provider (SMTP credentials)
  │    ├─ [+ Add] SMS provider (Twilio API keys)
  │    └─ Secrets auto-encrypted with AES-256-GCM
  │
  ├──▶ Security > RBAC
  │    ├─ [+ Invite] team members
  │    └─ Assign roles: Admin, Editor, Viewer
  │
  ├──▶ Settings > API Keys
  │    └─ [+ Create Key] for production integration
  │
  ├──▶ Settings > Webhooks
  │    ├─ Add webhook URL for event callbacks
  │    └─ Enable signature verification (HMAC-SHA256)
  │
  └──▶ Dashboard ──▶ Integrate SDK ──▶ Users start appearing
```

### Flow 4: Campaign Manager — Create & Send a Broadcast

```
Dashboard ──▶ Templates ──▶ [+ New Template]
  │                              │
  │    ┌─────────────────────────┘
  │    ▼
  │  Template Editor
  │  ├─ Select channel: Email
  │  ├─ Edit subject + body with {{variables}}
  │  ├─ Switch to SMS / WhatsApp variants
  │  ├─ [Preview] ──▶ Live preview panel
  │  └─ [Save]
  │         │
  │         ▼
  │  Segments ──▶ [+ New Segment]
  │  ├─ Add condition groups (AND/OR)
  │  ├─ Preview matched users (right panel)
  │  └─ [Save]
  │         │
  │         ▼
  │  Broadcasts ──▶ [+ New Broadcast]
  │  ├─ Select template + segment + channel
  │  ├─ Choose: Immediately / Scheduled
  │  └─ [Create Broadcast]
  │         │
  │         ▼
  │  Analytics ──▶ Track delivery, opens, clicks
```

### Flow 5: Campaign Manager — Run an A/B Test

```
Broadcasts ──▶ Select existing broadcast ──▶ [A/B Test tab]
  │                                               │
  │    ┌──────────────────────────────────────────┘
  │    ▼
  │  A/B Testing Page
  │  ├─ Set test name, metric (Open Rate / Click Rate)
  │  ├─ Set test % (e.g. 20% of segment)
  │  ├─ Configure Variant A (control subject line)
  │  ├─ Configure Variant B (alternative subject line)
  │  ├─ Set auto-winner duration (e.g. 4 hours)
  │  └─ [Start Test]
  │         │
  │         ▼
  │  Test runs ──▶ Stats update in real-time
  │  ├─ Variant B wins with 34% open rate
  │  └─ Auto-sends to remaining 80% using winner
  │         │
  │         ▼
  └──▶ Analytics ──▶ Full report on test results
```

### Flow 6: Campaign Manager — Build a Journey

```
Dashboard ──▶ Journeys ──▶ [+ New Journey]
  │                              │
  │    ┌─────────────────────────┘
  │    ▼
  │  Journey Builder (Canvas)
  │  ├─ Drag "Trigger" node ──▶ Set event: "User Signup"
  │  ├─ Connect to "Wait" node ──▶ Set: 2 hours
  │  ├─ Connect to "Decision" node ──▶ Condition: "Has Email?"
  │  │     ├─ Yes branch ──▶ "Send Email" node ──▶ Select template
  │  │     └─ No branch  ──▶ "Send SMS" node ──▶ Select template
  │  ├─ Add more nodes: Send WhatsApp, Wait, Check Segment
  │  └─ [Test] ──▶ Dry-run with test user
  │         │
  │         ▼
  │  [Publish] ──▶ Journey goes live (Status: Running)
  │         │
  │         ▼
  └──▶ Dashboard ──▶ Monitor journey metrics in real-time
```

### Flow 7: Campaign Manager — Schedule Campaigns

```
Broadcasts ──▶ [Schedule Manager tab]
  │                    │
  │    ┌───────────────┘
  │    ▼
  │  Campaign Scheduler
  │  ├─ View calendar (month view)
  │  ├─ See existing campaigns on dates (📧📱💬🔔 icons)
  │  ├─ [+ Schedule New]
  │  │    ├─ Pick date + time
  │  │    ├─ Select broadcast
  │  │    ├─ Set timezone (Workspace Default or custom)
  │  │    └─ [Confirm]
  │  └─ Campaign appears in queue + calendar
  │         │
  │         ▼
  └──▶ Broadcasts list ──▶ Status shows "⏳ Scheduled"
```

### Flow 8: Analyst — View Reports

```
Login ──▶ Dashboard (view-only)
  │
  ├──▶ Analytics
  │    ├─ Set date range filter
  │    ├─ Message Volume Over Time (line chart)
  │    ├─ Channel Mix (pie chart)
  │    ├─ Delivery Status (bar chart)
  │    └─ [Export CSV / PDF]
  │
  ├──▶ Billing & Usage (view-only)
  │    ├─ Current period usage meters
  │    ├─ Channel-by-channel cost breakdown
  │    └─ [Download Invoice]
  │
  └──▶ Dashboard ──▶ Review broadcast results in activity feed
```

### Flow 9: End User — Manage Subscriptions

```
Receives Email/SMS ──▶ Clicks "Manage Preferences" link
  │
  ▼
Subscription Management Page (public, no login)
  ├─ See all subscribed channels:
  │    ├─ 📧 Marketing Emails      [✓ Subscribed]
  │    ├─ 📧 Transactional Emails  [✓ Subscribed]
  │    ├─ 📱 SMS Notifications     [✓ Subscribed]
  │    ├─ 💬 WhatsApp Messages     [◻ Unsubscribed]
  │    └─ 🔔 Push Notifications    [✓ Subscribed]
  ├─ Toggle individual channels on/off
  ├─ Or click [Unsubscribe from All]
  └─ [Save Preferences] ──▶ Confirmation shown
```

### Flow 10: Super Admin — Platform-Wide Security Audit

```
Admin Panel ──▶ Review all tenant health
  │
  ├──▶ Security > RBAC ──▶ Audit role assignments across tenants
  │
  ├──▶ Security > Encryption
  │    ├─ Verify AES-256-GCM status: 🟢 Active
  │    ├─ Check all secrets encrypted (5/5 🔒)
  │    └─ [Rotate Key] if due for rotation
  │
  ├──▶ Security > Rate Limiting
  │    ├─ Review per-plan limits
  │    ├─ Check current activity (any 🔴 Limit breaches?)
  │    └─ Verify Redis connection: 🟢 Connected
  │
  ├──▶ Security > Webhooks
  │    ├─ Verify all webhook endpoints are 🟢 OK
  │    └─ Confirm signature verification is ✓ Enabled
  │
  ├──▶ Channel Registry
  │    ├─ Check all 10 providers are connected
  │    └─ [Test Connection] on any showing 🟡 Slow
  │
  └──▶ DLQ Monitor ──▶ Confirm no stuck entries
```

---

## Common Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  🎲 Dice Engage          [🔍 Search...]    🔔  👤 Admin ▼      │
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│  📊 Dash   │              Page Content Area                      │
│  🏢 Tenants│                                                     │
│  🔀 Journey│                                                     │
│  📡 Broad  │                                                     │
│  👥 Segment│                                                     │
│  📝 Templ  │                                                     │
│  👤 Users  │                                                     │
│  💰 Billing│                                                     │
│  📈 Analyt │                                                     │
│  ⚙️ Settings│                                                    │
│  🛡️ Admin  │                                                     │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

---

## 1. Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard Overview                                    [⟳ Refresh]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Total    │  │ Active   │  │ Messages │  │ Revenue  │       │
│  │ Tenants  │  │ Wkspaces │  │ Today    │  │ MTD      │       │
│  │   142    │  │   389    │  │  28.5K   │  │ $12,450  │       │
│  │  +12%  ↑ │  │  +8%   ↑ │  │  +23%  ↑ │  │  +15%  ↑ │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌────────────────────────────┐  ┌────────────────────────┐    │
│  │  Message Volume (30 days)  │  │  Top Channels          │    │
│  │                            │  │                        │    │
│  │  ╱╲    ╱╲                  │  │  Email    ████████ 45% │    │
│  │ ╱  ╲  ╱  ╲   ─── Email    │  │  SMS      ██████   30% │    │
│  │╱    ╲╱    ╲   ─── SMS     │  │  WhatsApp ████     18% │    │
│  │      ╲     ╲  ─── WhatsApp│  │  Push     ██        5% │    │
│  │       ╲     ╲ ─── Push    │  │  Webhook  █         2% │    │
│  └────────────────────────────┘  └────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Recent Activity                                         │  │
│  │  • Tenant "Acme Corp" upgraded to Growth    2 min ago    │  │
│  │  • Broadcast "Welcome Q1" completed         15 min ago   │  │
│  │  • Provider "Twilio SMS" health: OK         1 hr ago     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tenant Management (List)

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Tenants                              [+ Create Tenant] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [🔍 Search tenants...]  [Status ▼]  [Plan ▼]  [Export CSV]    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Name          │ Plan       │ Status    │ Msgs/Mo │ Actions│  │
│  ├───────────────┼────────────┼───────────┼─────────┼────────┤  │
│  │ Acme Corp     │ ◉ Growth   │ 🟢 Active │  8,420  │ ⚙ ⏸ 🗑│  │
│  │ Beta Inc      │ ◉ Enterprise│ 🟢 Active│ 45,200  │ ⚙ ⏸ 🗑│  │
│  │ Gamma LLC     │ ◉ Starter  │ 🔴 Suspend│  1,200  │ ⚙ ▶ 🗑│  │
│  │ Delta Co      │ ◉ Growth   │ 🟢 Active │ 12,800  │ ⚙ ⏸ 🗑│  │
│  │ Epsilon Ltd   │ ◉ Starter  │ ⚫ Cancel │    980  │ ⚙   🗑│  │
│  │ Zeta Group    │ ◉ Enterprise│ 🟢 Active│ 92,100  │ ⚙ ⏸ 🗑│  │
│  └───────────────┴────────────┴───────────┴─────────┴────────┘  │
│                                                                 │
│  Showing 1-6 of 142 tenants          [← Prev] [1] [2] [Next →] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tenant Detail / Create

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Tenants > Acme Corp                                    │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│  Tenant Information                  │  Plan Summary            │
│  ┌────────────────────────────────┐  │  ┌────────────────────┐ │
│  │ Name:    [Acme Corp        ]  │  │  │ Plan: Growth       │ │
│  │ Plan:    [Growth          ▼]  │  │  │ Limit: 100K/mo     │ │
│  │ Status:  [🟢 Active       ▼]  │  │  │ Used:  8,420       │ │
│  └────────────────────────────────┘  │  │ ████░░░░░░░  8.4%  │ │
│                                      │  │ Cost: $842/mo      │ │
│  Brands                [+ Add Brand] │  └────────────────────┘ │
│  ┌────────────────────────────────┐  │                          │
│  │ • Main Brand    | UTC    | ⚙ 🗑│  │  Quick Actions           │
│  │ • Sub Brand EU  | CET    | ⚙ 🗑│  │  ┌────────────────────┐ │
│  └────────────────────────────────┘  │  │ [⏸ Suspend Tenant] │ │
│                                      │  │ [📊 View Analytics] │ │
│  Workspaces          [+ Assign]      │  │ [🔑 Manage Roles]  │ │
│  ┌────────────────────────────────┐  │  └────────────────────┘ │
│  │ • Prod Workspace | Main Brand │  │                          │
│  │ • Dev Workspace  | —          │  │                          │
│  └────────────────────────────────┘  │                          │
│                                      │                          │
│         [Save Changes]  [Cancel]     │                          │
└──────────────────────────────────────┴──────────────────────────┘
```

---

## 4. Journey Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  Journeys > Welcome Flow         [Draft ▼]  [Test] [▶ Publish] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────── Canvas ───────────────────────────────────┐  │
│  │                                                           │  │
│  │         ┌─────────────┐                                   │  │
│  │         │  🎯 Trigger  │                                   │  │
│  │         │  User Signup │                                   │  │
│  │         └──────┬──────┘                                   │  │
│  │                │                                           │  │
│  │         ┌──────▼──────┐                                   │  │
│  │         │  ⏱ Wait     │                                   │  │
│  │         │  2 hours    │                                   │  │
│  │         └──────┬──────┘                                   │  │
│  │                │                                           │  │
│  │         ┌──────▼──────┐                                   │  │
│  │         │ ◇ Has Email? │                                   │  │
│  │         └───┬─────┬───┘                                   │  │
│  │          Yes│     │No                                     │  │
│  │    ┌────────▼──┐ ┌▼──────────┐                            │  │
│  │    │ 📧 Send   │ │ 📱 Send   │                            │  │
│  │    │   Email   │ │   SMS     │                            │  │
│  │    └───────────┘ └───────────┘                            │  │
│  │                                                           │  │
│  │  [+ Add Node]   [🔍 Zoom: 100%]                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Node Properties ─┐                                         │
│  │ Type: Send Email   │                                         │
│  │ Template: [Welcome]│                                         │
│  │ Channel: Email     │                                         │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Broadcasts

```
┌─────────────────────────────────────────────────────────────────┐
│  Broadcasts                                  [+ New Broadcast]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [🔍 Search...]  [Channel ▼]  [Status ▼]                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Name             │ Channel  │ Segment    │Status  │ Sent  │  │
│  ├──────────────────┼──────────┼────────────┼────────┼───────┤  │
│  │ Welcome Q1       │ 📧 Email │ New Users  │✅ Done │12,400 │  │
│  │ Flash Sale       │ 📱 SMS   │ VIP Users  │⏳ Sched│  —    │  │
│  │ App Update       │ 🔔 Push  │ All Users  │📝 Draft│  —    │  │
│  │ Holiday Promo    │ 💬 WA    │ Engaged    │▶ Running│ 3,200│  │
│  │ Refer a Friend   │ 📧 Email │ Power Users│✅ Done │ 8,900 │  │
│  └──────────────────┴──────────┴────────────┴────────┴───────┘  │
│                                                                 │
│  ┌─ New Broadcast ────────────────────────────────────────────┐ │
│  │ Name:     [                                    ]           │ │
│  │ Channel:  [Email ▼]   Template: [Select... ▼]             │ │
│  │ Segment:  [Select target segment...        ▼]             │ │
│  │ Schedule: [○ Immediately  ● Scheduled]  [2026-03-15 09:00]│ │
│  │                              [Create Broadcast]  [Cancel] │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Segment Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  Segments > Power Users                        [Save] [Cancel]  │
├─────────────────────────────────────────┬───────────────────────┤
│                                         │                       │
│  Segment Rules                          │  Preview              │
│                                         │  ┌─────────────────┐ │
│  ┌── Group 1 (AND) ──────────────────┐  │  │ Matched: 2,450  │ │
│  │                                    │  │  │                 │ │
│  │ [Last Login ▼] [< 7 days ▼]       │  │  │ john@acme.com   │ │
│  │                AND                 │  │  │ sara@beta.io    │ │
│  │ [Purchase Count ▼] [≥ 3   ▼]      │  │  │ mike@gamma.co   │ │
│  │                AND                 │  │  │ lisa@delta.com  │ │
│  │ [Country ▼] [equals ▼] [US]       │  │  │ ...+2,446 more  │ │
│  │                                    │  │  └─────────────────┘ │
│  │ [+ Add Condition]                  │  │                       │
│  └────────────────────────────────────┘  │  Properties           │
│          OR                              │  ┌─────────────────┐ │
│  ┌── Group 2 (AND) ──────────────────┐  │  │ Status: Running │ │
│  │                                    │  │  │ Type: Declarative│ │
│  │ [Plan Type ▼] [equals ▼] [Enter]  │  │  │ Created: Feb 12 │ │
│  │                                    │  │  │ Updated: Mar 01 │ │
│  │ [+ Add Condition]                  │  │  └─────────────────┘ │
│  └────────────────────────────────────┘  │                       │
│                                         │                       │
│  [+ Add Group]                          │                       │
└─────────────────────────────────────────┴───────────────────────┘
```

---

## 7. Template Editor

```
┌─────────────────────────────────────────────────────────────────┐
│  Templates > Welcome Email             [Preview] [Save] [Test]  │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                              │
│  Template Settings               │  Live Preview                │
│  ┌────────────────────────────┐  │  ┌──────────────────────────┐│
│  │ Name:    [Welcome Email ]  │  │  │  ┌──────────────────┐   ││
│  │ Channel: [Email        ▼]  │  │  │  │   🎲 Dice Engage │   ││
│  │ From:    [hello@acme.com]  │  │  │  │                  │   ││
│  │ Subject: [Welcome, {{n}}]  │  │  │  │  Welcome aboard, │   ││
│  │ Reply:   [support@acme ]   │  │  │  │  {{firstName}}!  │   ││
│  └────────────────────────────┘  │  │  │                  │   ││
│                                  │  │  │  You've joined   │   ││
│  Body Editor                     │  │  │  the best...     │   ││
│  ┌────────────────────────────┐  │  │  │                  │   ││
│  │ [B] [I] [🔗] [📷] [</>]   │  │  │  │  [Get Started]   │   ││
│  │                            │  │  │  │                  │   ││
│  │ <h1>Welcome, {{name}}</h1>│  │  │  │  © 2026 Acme     │   ││
│  │ <p>You've joined the...</p>│  │  │  └──────────────────┘   ││
│  │ <a href="{{cta_url}}">    │  │  └──────────────────────────┘│
│  │   Get Started             │  │                              │
│  │ </a>                      │  │  Channel Variants            │
│  │                            │  │  [📧 Email] [📱 SMS] [💬 WA]│
│  └────────────────────────────┘  │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

---

## 8. User Management

```
┌─────────────────────────────────────────────────────────────────┐
│  Users                                         [Export] [Import] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [🔍 Search by email, ID...]  [Segment ▼]  [Property ▼]        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ User ID      │ Email           │ Segments │ Events │ Last │  │
│  ├──────────────┼─────────────────┼──────────┼────────┼──────┤  │
│  │ usr_a1b2c3   │ john@acme.com   │ 3        │ 142    │ 2h   │  │
│  │ usr_d4e5f6   │ sara@beta.io    │ 2        │ 89     │ 1d   │  │
│  │ usr_g7h8i9   │ mike@gamma.co   │ 5        │ 312    │ 30m  │  │
│  │ usr_j0k1l2   │ lisa@delta.com  │ 1        │ 45     │ 3d   │  │
│  └──────────────┴─────────────────┴──────────┴────────┴──────┘  │
│                                                                 │
│  ┌─ User Detail (usr_a1b2c3) ─────────────────────────────────┐ │
│  │  Properties          │  Event Timeline     │ Journeys      │ │
│  │  ┌────────────────┐  │  ┌───────────────┐  │ ┌───────────┐│ │
│  │  │firstName: John │  │  │ Page View  2h │  │ │ Welcome ✓ ││ │
│  │  │lastName: Doe   │  │  │ Purchase  1d  │  │ │ Onboard ▶ ││ │
│  │  │plan: Growth    │  │  │ Login     1d  │  │ │ Re-engage ││ │
│  │  │country: US     │  │  │ Signup    30d │  │ └───────────┘│ │
│  │  └────────────────┘  │  └───────────────┘  │              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Billing & Usage

```
┌─────────────────────────────────────────────────────────────────┐
│  Billing > Acme Corp (Growth Plan)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current Period: Mar 1 – Mar 31, 2026                           │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Total    │  │ Plan     │  │ Usage    │  │ Cost     │       │
│  │ Messages │  │ Limit    │  │ Rate     │  │ This Mo  │       │
│  │  8,420   │  │ 100,000  │  │  8.4%    │  │  $842    │       │
│  │ ████░░░░ │  │          │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  Channel Breakdown                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Channel    │ Sent    │ Cost/msg  │ Total Cost │ % of Total│  │
│  ├────────────┼─────────┼───────────┼────────────┼───────────┤  │
│  │ 📧 Email   │  3,800  │ $0.001    │   $3.80    │   0.5%    │  │
│  │ 📱 SMS     │  2,500  │ $0.075    │ $187.50    │  22.3%    │  │
│  │ 💬 WhatsApp│  1,200  │ $0.050    │  $60.00    │   7.1%    │  │
│  │ 🔔 Push    │    800  │ $0.005    │   $4.00    │   0.5%    │  │
│  │ 🌐 WebPush │    100  │ $0.003    │   $0.30    │   0.0%    │  │
│  │ 🔗 Webhook │     20  │ $0.010    │   $0.20    │   0.0%    │  │
│  ├────────────┼─────────┼───────────┼────────────┼───────────┤  │
│  │ TOTAL      │  8,420  │           │ $255.80    │  100%     │  │
│  └────────────┴─────────┴───────────┴────────────┴───────────┘  │
│                                                                 │
│  [📊 View Analytics]  [⬆ Upgrade Plan]  [📥 Download Invoice]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics                    [Date: Mar 1 – Mar 31 ▼] [Apply] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Message Volume Over Time                                  │ │
│  │                                                            │ │
│  │  1.2K ┤            ╱╲                                      │ │
│  │  1.0K ┤     ╱╲    ╱  ╲    ╱╲                               │ │
│  │  0.8K ┤    ╱  ╲  ╱    ╲  ╱  ╲                              │ │
│  │  0.6K ┤   ╱    ╲╱      ╲╱    ╲                             │ │
│  │  0.4K ┤  ╱                     ╲                            │ │
│  │  0.2K ┤ ╱                                                   │ │
│  │       └──────────────────────────────────                   │ │
│  │        Mar 1    Mar 8    Mar 15   Mar 22   Mar 29           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────┐  ┌──────────────────────────────┐   │
│  │  Channel Mix (Pie)    │  │  Delivery Status              │   │
│  │                       │  │                               │   │
│  │     ╭───╮             │  │  Delivered  ████████████ 92%  │   │
│  │   ╱ Email ╲           │  │  Opened     ████████     67%  │   │
│  │  │  45%    │          │  │  Clicked    █████        41%  │   │
│  │  │ SMS 30% │          │  │  Bounced    █             3%  │   │
│  │   ╲ WA 18%╱           │  │  Failed     █             2%  │   │
│  │     ╰───╯             │  │                               │   │
│  └───────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Settings & Providers

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                                       │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  [General  ] │  Provider Configuration                          │
│  [Providers] │                                                  │
│  [API Keys ] │  Email Providers                     [+ Add]     │
│  [Secrets  ] │  ┌──────────────────────────────────────────┐    │
│  [Features ] │  │ SMTP (Primary)        │ ✅ Connected │ ⚙ │    │
│  [Team     ] │  │ Amazon SES            │ ✅ Connected │ ⚙ │    │
│              │  └──────────────────────────────────────────┘    │
│              │                                                  │
│              │  SMS Providers                       [+ Add]     │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Twilio                │ ✅ Connected │ ⚙ │    │
│              │  │ Gupshup              │ ⚠ Config Needed│ ⚙│    │
│              │  └──────────────────────────────────────────┘    │
│              │                                                  │
│              │  WhatsApp Providers                  [+ Add]     │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Twilio WhatsApp       │ ✅ Connected │ ⚙ │    │
│              │  └──────────────────────────────────────────┘    │
│              │                                                  │
│              │  Push / WebPush / RCS                 [+ Add]    │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Firebase FCM          │ ✅ Connected │ ⚙ │    │
│              │  │ VAPID WebPush         │ ✅ Connected │ ⚙ │    │
│              │  │ RCS (SMS fallback)    │ ✅ Connected │ ⚙ │    │
│              │  └──────────────────────────────────────────┘    │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 12. Admin Super Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel — Platform Overview                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Tenants  │  │ Active   │  │ Suspended│  │ Providers│       │
│  │   142    │  │   138    │  │     4    │  │  10/10   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  Tenant Health                                        [Refresh] │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Tenant       │ Plan      │ Msgs/Mo │ Limit  │ Health     │  │
│  ├──────────────┼───────────┼─────────┼────────┼────────────┤  │
│  │ Acme Corp    │ Growth    │  8,420  │ 100K   │ 🟢 8.4%   │  │
│  │ Beta Inc     │ Enterprise│ 45,200  │   ∞    │ 🟢 OK     │  │
│  │ Gamma LLC    │ Starter   │  9,800  │  10K   │ 🟡 98.0%  │  │
│  │ Delta Co     │ Growth    │ 12,800  │ 100K   │ 🟢 12.8%  │  │
│  └──────────────┴───────────┴─────────┴────────┴────────────┘  │
│                                                                 │
│  Provider Health                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📧 SMTP: 🟢  │ 📧 SES: 🟢   │ 📱 Twilio SMS: 🟢       │  │
│  │ 💬 Twilio WA: 🟢 │ 🔔 FCM: 🟢  │ 🌐 VAPID: 🟢          │  │
│  │ 📱 Gupshup SMS: 🟡│ 💬 Gupshup WA: 🟢│ 📡 RCS: 🟢     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Quick Actions: [Assign Plan ▼]  [Suspend Tenant ▼]  [DLQ ▼]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Security & RBAC

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Security & Access Control                           │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  [RBAC     ] │  Role-Based Access Control                       │
│  [Encrypt  ] │                                                  │
│  [Rate Limit]│  Team Members                       [+ Invite]   │
│  [Webhooks ] │  ┌──────────────────────────────────────────┐    │
│              │  │ Name          │ Email          │ Role    │    │
│              │  ├───────────────┼────────────────┼─────────┤    │
│              │  │ John Admin    │ john@acme.com  │ Owner ▼ │    │
│              │  │ Sara Manager  │ sara@acme.com  │ Admin ▼ │    │
│              │  │ Mike Editor   │ mike@acme.com  │ Editor▼ │    │
│              │  │ Lisa Viewer   │ lisa@acme.com  │ Viewer▼ │    │
│              │  └──────────────────────────────────────────┘    │
│              │                                                  │
│              │  Role Permissions Matrix                         │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Permission      │Owner│Admin│Editor│View │    │
│              │  ├─────────────────┼─────┼─────┼──────┼─────┤    │
│              │  │ Manage Tenants  │  ✓  │  ✓  │  ✗   │  ✗  │    │
│              │  │ Create Journeys │  ✓  │  ✓  │  ✓   │  ✗  │    │
│              │  │ Send Broadcasts │  ✓  │  ✓  │  ✓   │  ✗  │    │
│              │  │ View Analytics  │  ✓  │  ✓  │  ✓   │  ✓  │    │
│              │  │ Manage Billing  │  ✓  │  ✓  │  ✗   │  ✗  │    │
│              │  │ Manage Secrets  │  ✓  │  ✗  │  ✗   │  ✗  │    │
│              │  └──────────────────────────────────────────┘    │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 14. Subscription Management (Public)

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎲 Dice Engage                               │
│              Manage Your Preferences                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hello john@acme.com,                                           │
│  Manage which communications you'd like to receive:             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  📧 Marketing Emails                      [✓ Subscribed] │  │
│  │  Product updates, promotions, and tips                    │  │
│  │                                                           │  │
│  │  📧 Transactional Emails                  [✓ Subscribed] │  │
│  │  Order confirmations, receipts, alerts                    │  │
│  │                                                           │  │
│  │  📱 SMS Notifications                     [✓ Subscribed] │  │
│  │  Important account alerts via text                        │  │
│  │                                                           │  │
│  │  💬 WhatsApp Messages                     [◻ Unsubscribed]│  │
│  │  Updates and support via WhatsApp                         │  │
│  │                                                           │  │
│  │  🔔 Push Notifications                    [✓ Subscribed] │  │
│  │  Real-time alerts on your device                          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Unsubscribe from All]              [Save Preferences]         │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│  Powered by Dice Engage • Privacy Policy • Contact Support      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. API Keys Management

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > API Keys                          [+ Create Key]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Name            │ Key (masked)        │ Created   │ Actions│  │
│  ├─────────────────┼─────────────────────┼───────────┼────────┤  │
│  │ Production API  │ dk_live_****...x4f2 │ Feb 12    │ 👁 🗑  │  │
│  │ Staging API     │ dk_test_****...m8a1 │ Jan 30    │ 👁 🗑  │  │
│  │ CI/CD Pipeline  │ dk_live_****...k2b7 │ Mar 01    │ 👁 🗑  │  │
│  └─────────────────┴─────────────────────┴───────────┴────────┘  │
│                                                                 │
│  ┌─ Create New API Key ─────────────────────────────────────┐   │
│  │  Name:  [                          ]                      │   │
│  │  Scope: [● Full Access  ○ Read Only  ○ Write Only]       │   │
│  │                        [Create]  [Cancel]                 │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠ API keys grant access to your workspace. Keep them secret!   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 16. Login / Auth

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                     🎲 Dice Engage                              │
│                                                                 │
│              Sign in to your account                            │
│                                                                 │
│         ┌─────────────────────────────────┐                     │
│         │                                 │                     │
│         │  Email                          │                     │
│         │  ┌───────────────────────────┐  │                     │
│         │  │ you@company.com           │  │                     │
│         │  └───────────────────────────┘  │                     │
│         │                                 │                     │
│         │  Password                       │                     │
│         │  ┌───────────────────────────┐  │                     │
│         │  │ ••••••••••••              │  │                     │
│         │  └───────────────────────────┘  │                     │
│         │                                 │                     │
│         │  [✓] Remember me    Forgot?     │                     │
│         │                                 │                     │
│         │  ┌───────────────────────────┐  │                     │
│         │  │       Sign In            │  │                     │
│         │  └───────────────────────────┘  │                     │
│         │                                 │                     │
│         │  ─── or continue with ───       │                     │
│         │                                 │                     │
│         │  [G Google]  [🔑 SSO/SAML]      │                     │
│         │                                 │                     │
│         └─────────────────────────────────┘                     │
│                                                                 │
│         Don't have an account? Contact admin                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 17. Brand Management (Phase 1)

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Tenants > Acme Corp > Brands              [+ Add Brand]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Brand Name     │ Timezone │ Workspaces │ Msgs/Mo │ Actions│  │
│  ├────────────────┼──────────┼────────────┼─────────┼────────┤  │
│  │ Main Brand     │ UTC      │  3         │  5,200  │ ⚙  🗑  │  │
│  │ EU Brand       │ CET      │  2         │  2,100  │ ⚙  🗑  │  │
│  │ APAC Brand     │ SGT      │  1         │  1,120  │ ⚙  🗑  │  │
│  └────────────────┴──────────┴────────────┴─────────┴────────┘  │
│                                                                 │
│  ┌─ Edit Brand ──────────────────────────────────────────────┐  │
│  │  Name:         [Main Brand              ]                 │  │
│  │  Timezone:     [UTC                    ▼]                 │  │
│  │  Sender Config (JSON):                                    │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ {                                                  │   │  │
│  │  │   "fromName": "Acme Corp",                         │   │  │
│  │  │   "replyTo": "support@acme.com",                   │   │  │
│  │  │   "defaultChannel": "Email"                        │   │  │
│  │  │ }                                                  │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                              [Save Brand]  [Cancel]       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 18. Channel Registry (Phase 2-5)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Channel Registry                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Registered Providers (10 active across 7 channels)             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Provider         │ Channel  │ Status │ Latency │ Default │  │
│  ├──────────────────┼──────────┼────────┼─────────┼─────────┤  │
│  │ SMTP             │ 📧 Email │ 🟢 OK  │  120ms  │  ● Yes  │  │
│  │ Amazon SES       │ 📧 Email │ 🟢 OK  │   85ms  │  ○ No   │  │
│  │ Twilio           │ 📱 SMS   │ 🟢 OK  │  210ms  │  ● Yes  │  │
│  │ Gupshup          │ 📱 SMS   │ 🟡 Slow│  450ms  │  ○ No   │  │
│  │ Twilio WhatsApp  │ 💬 WA    │ 🟢 OK  │  180ms  │  ● Yes  │  │
│  │ Gupshup WhatsApp │ 💬 WA    │ 🟢 OK  │  200ms  │  ○ No   │  │
│  │ Firebase FCM     │ 🔔 Push  │ 🟢 OK  │   95ms  │  ● Yes  │  │
│  │ VAPID            │ 🌐 WebPush│ 🟢 OK │  110ms  │  ● Yes  │  │
│  │ RCS Gateway      │ 📡 RCS   │ 🟢 OK  │  300ms  │  ● Yes  │  │
│  │ Custom Webhook   │ 🔗 Hook  │ 🟢 OK  │  150ms  │  ● Yes  │  │
│  └──────────────────┴──────────┴────────┴─────────┴─────────┘  │
│                                                                 │
│  ┌─ Provider Detail (Twilio SMS) ────────────────────────────┐  │
│  │  Type:       Twilio                                       │  │
│  │  Channel:    SMS                                          │  │
│  │  Secret:     twilio-sms-secret (🔒 encrypted AES-256)     │  │
│  │  Account SID: [AC****...4f2    ]                          │  │
│  │  Auth Token:  [••••••••••••    ]  [👁 Show]               │  │
│  │  From Number: [+1234567890     ]                          │  │
│  │  Status:     🟢 Connected  │  Last Check: 2 min ago       │  │
│  │                          [Test Connection]  [Save]        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 19. DLQ Monitor (Phase 9)

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin > Dead Letter Queue                        [⟳ Refresh]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Pending  │  │ Retrying │  │ Failed   │  │ Resolved │       │
│  │    12    │  │     3    │  │     2    │  │   145    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ID       │ Type       │ Retries │ Last Error   │ Actions  │  │
│  ├──────────┼────────────┼─────────┼──────────────┼──────────┤  │
│  │ dlq_001  │ Send SMS   │ 2/3     │ Timeout      │ ▶ 👁 🗑  │  │
│  │ dlq_002  │ Send Email │ 3/3     │ Rate Limited │ ▶ 👁 🗑  │  │
│  │ dlq_003  │ Send WA    │ 1/3     │ Auth Failed  │ ▶ 👁 🗑  │  │
│  │ dlq_004  │ Webhook    │ 2/3     │ 500 Error    │ ▶ 👁 🗑  │  │
│  └──────────┴────────────┴─────────┴──────────────┴──────────┘  │
│                                                                 │
│  ┌─ Entry Detail (dlq_001) ──────────────────────────────────┐  │
│  │  Type:       SendSMS                                      │  │
│  │  Tenant:     Acme Corp                                    │  │
│  │  Created:    Mar 03,  10:22 AM                            │  │
│  │  Retries:    2 of 3 (next in 8s — exponential backoff)    │  │
│  │  Error:      "Connection timeout after 30s"               │  │
│  │  Payload:    {"to":"+1234...", "body":"Welcome..."}       │  │
│  │              [Retry Now]  [Move to Failed]  [Delete]      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 20. Encryption & Secrets (Phase 8)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Security > Encryption                               │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  [RBAC     ] │  Credential Encryption (AES-256-GCM)             │
│  [Encrypt ●] │  ┌──────────────────────────────────────────┐    │
│  [Rate Limit]│  │ Status:  🟢 Active                       │    │
│  [Webhooks ] │  │ Algorithm: AES-256-GCM                   │    │
│              │  │ Key Status: Configured ✓                 │    │
│              │  │ Last Rotated: Feb 15, 2026               │    │
│              │  │                      [Rotate Key]        │    │
│              │  └──────────────────────────────────────────┘    │
│              │                                                  │
│              │  Encrypted Secrets                               │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Name               │ Provider  │ Status  │    │
│              │  ├────────────────────┼───────────┼─────────┤    │
│              │  │ twilio-sms-secret  │ Twilio    │ 🔒 Enc  │    │
│              │  │ ses-api-key        │ Amazon    │ 🔒 Enc  │    │
│              │  │ gupshup-wa-cred    │ Gupshup   │ 🔒 Enc  │    │
│              │  │ fcm-service-acct   │ Firebase  │ 🔒 Enc  │    │
│              │  │ vapid-private-key  │ WebPush   │ 🔒 Enc  │    │
│              │  └────────────────────┴───────────┴─────────┘    │
│              │                                                  │
│              │  ⚠ Rotating encryption keys will re-encrypt all  │
│              │    secrets. This may take a few minutes.          │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 21. Rate Limiting (Phase 8)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Security > Rate Limiting                            │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  [RBAC     ] │  Per-Tenant Rate Limits                          │
│  [Encrypt  ] │                                                  │
│  [Rate ●   ] │  Global Defaults                                 │
│  [Webhooks ] │  ┌──────────────────────────────────────────┐    │
│              │  │ Plan       │ Requests/min │ Burst │ Store │    │
│              │  ├────────────┼──────────────┼───────┼───────┤    │
│              │  │ Starter    │      100     │  150  │ Redis │    │
│              │  │ Growth     │      500     │  750  │ Redis │    │
│              │  │ Enterprise │    2,000     │ 3,000 │ Redis │    │
│              │  └────────────┴──────────────┴───────┴───────┘    │
│              │                                                  │
│              │  Current Activity                                │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Tenant       │ Plan   │ Req/min │ Status │    │
│              │  ├──────────────┼────────┼─────────┼────────┤    │
│              │  │ Acme Corp    │ Growth │  42/500 │ 🟢 OK  │    │
│              │  │ Beta Inc     │ Enterp │ 180/2K  │ 🟢 OK  │    │
│              │  │ Gamma LLC    │ Starter│  98/100 │ 🟡 High│    │
│              │  │ Delta Co     │ Growth │ 501/500 │ 🔴 Limit│   │
│              │  └──────────────┴────────┴─────────┴────────┘    │
│              │                                                  │
│              │  Redis Connection: 🟢 Connected (redis:6379)     │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 22. Webhook Configuration (Phase 8)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Security > Webhooks                 [+ Add Webhook] │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  [RBAC     ] │  Webhook Endpoints                               │
│  [Encrypt  ] │  ┌──────────────────────────────────────────┐    │
│  [Rate Limit]│  │ URL                   │ Events  │ Status │    │
│  [Webhooks●] │  ├───────────────────────┼─────────┼────────┤    │
│              │  │ https://api.acme/hook │ All     │ 🟢 OK  │    │
│              │  │ https://slack.com/w.. │ Failure │ 🟢 OK  │    │
│              │  └───────────────────────┴─────────┴────────┘    │
│              │                                                  │
│              │  Signature Verification                          │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ Method:    [HMAC-SHA256 ▼]               │    │
│              │  │ Secret:    [whsec_****...k2m  ] [👁]     │    │
│              │  │ Header:    [X-Signature        ]         │    │
│              │  │ Verify:    [✓ Enabled]                   │    │
│              │  └──────────────────────────────────────────┘    │
│              │                                                  │
│              │  Inbound Webhook Providers                       │
│              │  ┌──────────────────────────────────────────┐    │
│              │  │ • Twilio (auto-verified)     🟢 Active   │    │
│              │  │ • Gupshup (HMAC-SHA256)      🟢 Active   │    │
│              │  │ • Custom (configurable)      🟢 Active   │    │
│              │  └──────────────────────────────────────────┘    │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 23. A/B Testing (Phase 10)

```
┌─────────────────────────────────────────────────────────────────┐
│  Broadcasts > Holiday Promo > A/B Test           [Save] [Start] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Test Configuration                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Test Name:     [Holiday Subject Test         ]            │  │
│  │ Metric:        [Open Rate ▼]                              │  │
│  │ Test %:        [20%     ] of segment (remaining 80% gets  │  │
│  │                winner after test concludes)                │  │
│  │ Duration:      [4 hours ▼]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Variants                                        [+ Add Variant]│
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          │ Variant A (Control)  │ Variant B              │  │
│  ├──────────┼──────────────────────┼────────────────────────┤  │
│  │ Subject  │ Holiday Sale: 50% Off│ 🎄 Your Gift Inside!  │  │
│  │ Template │ holiday_v1           │ holiday_v2             │  │
│  │ Split    │ 50%                  │ 50%                    │  │
│  │ Sent     │ 1,200                │ 1,200                  │  │
│  │ Opens    │ 312 (26.0%)          │ 408 (34.0%) ← winner  │  │
│  │ Clicks   │ 89 (7.4%)            │ 124 (10.3%)           │  │
│  └──────────┴──────────────────────┴────────────────────────┘  │
│                                                                 │
│  🏆 Variant B is winning with 34% open rate (+8% vs control)   │
│  Status: ▶ Running │ Auto-select winner in: 1h 23m              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 24. Campaign Scheduler (Phase 10)

```
┌─────────────────────────────────────────────────────────────────┐
│  Broadcasts > Schedule Manager                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Calendar View                           [Month ▼] [Mar 2026]   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Mon    │ Tue    │ Wed    │ Thu    │ Fri    │ Sat  │ Sun   │  │
│  ├────────┼────────┼────────┼────────┼────────┼──────┼───────┤  │
│  │        │        │        │        │        │  1   │   2   │  │
│  │   3    │   4    │   5    │   6    │   7    │  8   │   9   │  │
│  │        │ 📧 Wlcm│        │        │        │      │       │  │
│  │  10    │  11    │  12    │  13    │  14    │ 15   │  16   │  │
│  │        │        │ 📱 Sale│        │        │💬 Pro│       │  │
│  │  17    │  18    │  19    │  20    │  21    │ 22   │  23   │  │
│  │        │ 🔔 App │        │        │        │      │       │  │
│  │  24    │  25    │  26    │  27    │  28    │ 29   │  30   │  │
│  │        │        │        │ 📧 News│        │      │       │  │
│  └────────┴────────┴────────┴────────┴────────┴──────┴───────┘  │
│                                                                 │
│  Scheduled Broadcasts                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Date        │ Time   │ Name         │ Channel│ Segment   │  │
│  ├─────────────┼────────┼──────────────┼────────┼───────────┤  │
│  │ Mar 4       │ 09:00  │ Welcome Q2   │ 📧     │ New Users │  │
│  │ Mar 12      │ 14:00  │ Flash Sale   │ 📱     │ VIP       │  │
│  │ Mar 15      │ 10:00  │ Holiday Promo│ 💬     │ All       │  │
│  │ Mar 18      │ 08:00  │ App Update   │ 🔔     │ Mobile    │  │
│  │ Mar 27      │ 11:00  │ Newsletter   │ 📧     │ Opted-In  │  │
│  └─────────────┴────────┴──────────────┴────────┴───────────┘  │
│                                                                 │
│  Timezone: [Workspace Default (UTC) ▼]   [+ Schedule New]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 25. Ad-hoc Lists & Quick Send (New Feature)

```
┌─────────────────────────────────────────────────────────────────┐
│  Broadcasts > Ad-hoc Send                    [+ New Ad-hoc Send]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Add Recipients                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Source: [● Upload CSV  ○ Manual Entry  ○ Paste List]      │  │
│  │                                                           │  │
│  │ ┌─ CSV Upload ──────────────────────────────────────────┐ │  │
│  │ │  [📁 Choose File]  or drag & drop                     │ │  │
│  │ │                                                       │ │  │
│  │ │  Required columns: email OR phone (at least one)      │ │  │
│  │ │  Optional columns: firstName, lastName, any custom    │ │  │
│  │ │                                                       │ │  │
│  │ │  Template: [📥 Download CSV Template]                 │ │  │
│  │ └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │ ┌─ OR Manual Entry ─────────────────────────────────────┐ │  │
│  │ │  [+ Add Recipient]                                    │ │  │
│  │ │  ┌────────────────┬───────────────┬──────────────┐    │ │  │
│  │ │  │ Email          │ Phone         │ Name         │    │ │  │
│  │ │  ├────────────────┼───────────────┼──────────────┤    │ │  │
│  │ │  │ john@acme.com  │ +1234567890   │ John Doe     │    │ │  │
│  │ │  │ sara@beta.io   │ +0987654321   │ Sara Smith   │    │ │  │
│  │ │  │ [            ] │ [           ] │ [          ] │    │ │  │
│  │ │  └────────────────┴───────────────┴──────────────┘    │ │  │
│  │ └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │ ┌─ OR Paste List ──────────────────────────────────────┐  │  │
│  │ │  Paste emails/phones, one per line:                   │  │  │
│  │ │  ┌─────────────────────────────────────────────────┐  │  │  │
│  │ │  │ john@acme.com                                   │  │  │  │
│  │ │  │ sara@beta.io                                    │  │  │  │
│  │ │  │ +1234567890                                     │  │  │  │
│  │ │  └─────────────────────────────────────────────────┘  │  │  │
│  │ └───────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Preview: 47 recipients loaded   [3 duplicates removed]         │
│                                                                 │
│  Step 2: Choose Channel & Template                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Channel:  [Email ▼]     Template: [Flash Sale v2 ▼]      │  │
│  │ Schedule: [● Send Now   ○ Schedule for later]             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 3: Review & Send                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Recipients:  47                                           │  │
│  │ Channel:     📧 Email                                     │  │
│  │ Template:    Flash Sale v2                                │  │
│  │ Timing:      Immediately                                  │  │
│  │ Est. Cost:   $0.05 (47 × $0.001/email)                    │  │
│  │                                                           │  │
│  │ ☑ Save as reusable list: [Flash Sale March ___]           │  │
│  │                                                           │  │
│  │         [◀ Back]              [Send Now]                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 26. Saved Lists

```
┌─────────────────────────────────────────────────────────────────┐
│  Broadcasts > Saved Lists                       [+ Upload New]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [🔍 Search lists...]                                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ List Name          │ Recipients │ Created   │ Used │Action│  │
│  ├────────────────────┼────────────┼───────────┼──────┼──────┤  │
│  │ Flash Sale March   │  47        │ Mar 03    │  1×  │ ⚙ 🗑 │  │
│  │ VIP Beta Testers   │ 120        │ Feb 28    │  3×  │ ⚙ 🗑 │  │
│  │ Event Attendees    │  85        │ Feb 15    │  2×  │ ⚙ 🗑 │  │
│  │ Partner Contacts   │  32        │ Jan 20    │  0×  │ ⚙ 🗑 │  │
│  └────────────────────┴────────────┴───────────┴──────┴──────┘  │
│                                                                 │
│  Click any list → [Send Broadcast to this list]                 │
│                   [View/Edit Recipients]                        │
│                   [Export CSV]                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## App Flow 11: Campaign Manager — Ad-hoc Send to a Custom List

```
Dashboard ──▶ Broadcasts ──▶ [Ad-hoc Send]
  │                               │
  │    ┌──────────────────────────┘
  │    ▼
  │  Step 1: Add Recipients
  │  ├─ Option A: Upload CSV file (drag & drop)
  │  │    └─ System parses, deduplicates, validates emails/phones
  │  ├─ Option B: Manually add rows (email + phone + name)
  │  └─ Option C: Paste a list (one email/phone per line)
  │         │
  │         ▼
  │  Preview: "47 recipients loaded, 3 duplicates removed"
  │         │
  │         ▼
  │  Step 2: Select channel (Email/SMS/WhatsApp) + template
  │  ├─ Choose: Send Now or Schedule
  │  └─ Optionally save list for re-use
  │         │
  │         ▼
  │  Step 3: Review & Confirm
  │  ├─ Total recipients, channel, template, estimated cost
  │  └─ [Send Now]
  │         │
  │         ▼
  │  Analytics ──▶ Track delivery for this ad-hoc broadcast
  │         │
  │         ▼
  └──▶ Saved Lists ──▶ List appears for future re-use
```

---

## 27. Real-Time Engagement Dashboard (New Feature)

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics > Engagement Dashboard            [🔴 Live] [⏸ Pause]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Period: [Last 7 days ▼]  Channel: [All ▼]  [↻ Refresh]       │
│                                                                 │
│  ┌─ Overall Metrics ──────────────────────────────────────────┐ │
│  │  📤 Sent    📬 Delivered   👁 Opened    🖱 Clicked          │ │
│  │  12,450     11,820         4,230        1,105               │ │
│  │             94.9% ✅       35.8%        26.1%               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Channel Breakdown ────────────────────────────────────────┐ │
│  │ Channel   │ Sent  │ Deliv │ Opens │ Clicks│ Rate │ Status │ │
│  ├───────────┼───────┼───────┼───────┼───────┼──────┼────────┤ │
│  │ 📧 Email  │ 8,200 │ 7,954 │ 3,100 │  820  │ 97%  │ ✅     │ │
│  │ 📱 SMS    │ 2,100 │ 2,050 │  —    │  180  │ 98%  │ ✅     │ │
│  │ 💬 WhatsApp│1,500 │ 1,420 │  980  │   85  │ 95%  │ ✅     │ │
│  │ 🔔 Push   │  500  │  280  │  150  │   20  │ 56%  │ ⚠️     │ │
│  │ 🔗 Webhook│  150  │  116  │  —    │   —   │ 77%  │ ✅     │ │
│  └───────────┴───────┴───────┴───────┴───────┴──────┴────────┘ │
│                                                                 │
│  ┌─ Engagement Heatmap (Best Time to Send) ───────────────────┐ │
│  │     Mon  Tue  Wed  Thu  Fri  Sat  Sun                      │ │
│  │  6am ░    ░    ░    ░    ░    ▒    ░                        │ │
│  │  9am ▓    ▓    ▓    ▓    ▓    ░    ░                        │ │
│  │ 12pm █    ▓    █    ▓    ▓    ▒    ░                        │ │
│  │  3pm ▓    █    ▓    █    ▓    ░    ░                        │ │
│  │  6pm ▒    ▓    ▒    ▓    ▒    ░    ░                        │ │
│  │  9pm ░    ▒    ░    ▒    ░    ░    ░                        │ │
│  │                                                            │ │
│  │  ░ Low   ▒ Medium   ▓ High   █ Peak                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Live Event Timeline ──────────────────────────────────────┐ │
│  │ 🔴 Connected — streaming real-time events                  │ │
│  │                                                            │ │
│  │ 16:34:12  📧 Email Opened      john@acme.com    Flash Sale │ │
│  │ 16:34:08  💬 WA Delivered      +91-98765...     Welcome    │ │
│  │ 16:34:05  📧 Email Clicked     sara@beta.io     Newsletter │ │
│  │ 16:33:58  📱 SMS Delivered     +1-555-012...    OTP        │ │
│  │ 16:33:51  🔔 Push Clicked      user_4829       App Update  │ │
│  │ 16:33:45  📧 Email Bounced     old@gone.com     Promo ⚠️   │ │
│  │ 16:33:40  💬 WA Read           +44-7700...      Survey     │ │
│  │           ...                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ User Engagement Score (search) ───────────────────────────┐ │
│  │ [🔍 Search user by ID or email...]                         │ │
│  │                                                            │ │
│  │  User: john@acme.com                                       │ │
│  │  Score: 82/100  🔥 ON FIRE                                 │ │
│  │  ├─ Messages received:  47                                 │ │
│  │  ├─ Opened:             38  (81%)                          │ │
│  │  ├─ Clicked:            12  (32%)                          │ │
│  │  └─ Last engagement:    2 min ago                          │ │
│  │                                                            │ │
│  │  Levels: 🥶 Cold (0-24) │ 🌤 Warm (25-49)                  │ │
│  │          🔥 Hot (50-74)  │ 🔥🔥 On Fire (75-100)             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## App Flow 12: Campaign Manager — Monitor Real-Time Engagement

```
Dashboard ──▶ Analytics ──▶ Engagement Dashboard
  │                              │
  │    ┌─────────────────────────┘
  │    ▼
  │  Overall Metrics (auto-refresh or live via SSE)
  │  ├─ Delivery rate, open rate, click rate
  │  └─ Per-channel breakdown table
  │         │
  │         ▼
  │  Engagement Heatmap
  │  ├─ Day × Hour grid showing peak engagement times
  │  └─ Use to optimize send schedules
  │         │
  │         ▼
  │  Live Event Timeline (SSE stream)
  │  ├─ Real-time feed: opens, clicks, deliveries, bounces
  │  ├─ Filterable by channel
  │  └─ 🔴 Live indicator with pause/resume
  │         │
  │         ▼
  │  User Engagement Score
  │  ├─ Search any user → see their 0-100 score
  │  ├─ Levels: cold / warm / hot / on_fire
  │  └─ Engagement history: messages, opens, clicks
```

---

## Page Index (All 27 Pages)

| # | Page | Route | Phase | Description |
|---|------|-------|-------|-------------|
| 1 | Dashboard | `/dashboard` | — | Global metrics, charts, activity feed |
| 2 | Tenant List | `/admin/tenants` | P1 | Tenant CRUD table with filters |
| 3 | Tenant Detail | `/admin/tenants/:id` | P1 | Edit tenant, brands, workspaces |
| 4 | Journey Builder | `/journeys/:id` | — | Visual node-based flow editor |
| 5 | Broadcasts | `/broadcasts` | — | Campaign list + create form |
| 6 | Segment Builder | `/segments/:id` | — | Rule groups + preview |
| 7 | Template Editor | `/templates/:id` | — | Code editor + live preview |
| 8 | User Management | `/users` | — | User table + detail panel |
| 9 | Billing & Usage | `/admin/billing/:tenantId` | P6 | Usage meters + channel breakdown |
| 10 | Analytics | `/analytics` | P6 | Charts, channel mix, delivery stats |
| 11 | Settings & Providers | `/settings/providers` | P2-5 | Provider config, 7 channel providers |
| 12 | Admin Panel | `/admin/panel` | P7 | Platform health, tenant monitoring |
| 13 | Security & RBAC | `/settings/security/rbac` | P8 | Roles, permissions matrix |
| 14 | Subscriptions | `/public/subscriptions` | — | Public opt-in/out page |
| 15 | API Keys | `/settings/api-keys` | — | Key management |
| 16 | Login | `/login` | — | Auth with SSO support |
| 17 | Brand Management | `/admin/tenants/:id/brands` | P1 | Brand CRUD + sender config |
| 18 | Channel Registry | `/settings/channels` | P2-5 | Provider status, latency, defaults |
| 19 | DLQ Monitor | `/admin/dlq` | P9 | Dead letter queue + retry controls |
| 20 | Encryption | `/settings/security/encryption` | P8 | AES-256 key mgmt + secret inventory |
| 21 | Rate Limiting | `/settings/security/rate-limits` | P8 | Per-plan limits + live activity |
| 22 | Webhook Config | `/settings/security/webhooks` | P8 | Signature verification + endpoints |
| 23 | A/B Testing | `/broadcasts/:id/ab-test` | P10 | Variant testing + auto-winner |
| 24 | Campaign Scheduler | `/broadcasts/schedule` | P10 | Calendar view + schedule queue |
| 25 | Ad-hoc Send | `/broadcasts/adhoc` | New | CSV/manual list → quick send |
| 26 | Saved Lists | `/broadcasts/lists` | New | Reusable ad-hoc recipient lists |
| 27 | **Engagement Dashboard** | `/analytics/engagement` | **New** | Real-time metrics, heatmap, SSE stream, user scores |


