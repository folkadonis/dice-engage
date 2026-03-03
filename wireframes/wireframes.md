# Dice Engage — UI Wireframes

All pages share a common layout: **Sidebar** (left) + **Header** (top) + **Content** (center).

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

## Page Index

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Dashboard | `/dashboard` | Global metrics, charts, activity feed |
| 2 | Tenant List | `/admin/tenants` | CRUD table with filters |
| 3 | Tenant Detail | `/admin/tenants/:id` | Edit tenant, brands, workspaces |
| 4 | Journey Builder | `/journeys/:id` | Visual node-based flow editor |
| 5 | Broadcasts | `/broadcasts` | Campaign list + create form |
| 6 | Segment Builder | `/segments/:id` | Rule groups + preview |
| 7 | Template Editor | `/templates/:id` | Code editor + live preview |
| 8 | User Management | `/users` | User table + detail panel |
| 9 | Billing & Usage | `/admin/billing/:tenantId` | Usage meters + channel breakdown |
| 10 | Analytics | `/analytics` | Charts, channel mix, delivery stats |
| 11 | Settings | `/settings` | Provider config, 7 channel providers |
| 12 | Admin Panel | `/admin/panel` | Platform health, tenant monitoring |
| 13 | Security & RBAC | `/settings/security` | Roles, permissions matrix |
| 14 | Subscriptions | `/public/subscriptions` | Public opt-in/out page |
| 15 | API Keys | `/settings/api-keys` | Key management |
| 16 | Login | `/login` | Auth with SSO support |
