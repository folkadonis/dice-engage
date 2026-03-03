<p align="center">
  <h1 align="center">🎲 Dice Engage</h1>
</p>

---

<h3 align="center">Multi-Tenant Omnichannel Customer Engagement Platform</h3>

<p align="center">
  <a href="#features">Features</a> • <a href="#channels">Channels</a> • <a href="#architecture">Architecture</a> • <a href="#getting-started">Getting Started</a> • <a href="#api-reference">API</a> • <a href="#database">Database</a> • <a href="#deployment">Deployment</a> • <a href="#ui-pages">UI Pages</a> • <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="K8s" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

**Dice Engage** is a production-ready, multi-tenant omnichannel SaaS platform for customer engagement. Send broadcasts, automate user journeys, upload ad-hoc contact lists, and track real-time audience engagement across **5 channels** with **10+ provider integrations** — all with built-in billing, analytics, RBAC, encryption, and a global admin panel.

---

## Features

### 🏢 Phase 1 — Multi-Tenancy & Brand Management

| Feature | Description |
|---------|-------------|
| **Tenant Hierarchy** | `Tenant → Brand → Workspace` with complete data isolation |
| **Tenant Lifecycle** | Create, suspend, activate, and cancel tenants via API |
| **Plan Tiers** | **Starter** (10K msgs/mo), **Growth** (100K), **Enterprise** (unlimited) |
| **Brand Management** | Multiple brands per tenant with sender configuration and timezone |
| **Workspace Assignment** | Assign workspaces to specific tenants and brands |

### 📨 Phase 2–5 — Omnichannel Messaging

5 communication channels with 10+ provider integrations:

| # | Channel | Providers | User Identifier | Ad-hoc Send? |
|---|---------|-----------|----------------|-------------|
| 1 | 📧 **Email** | SendGrid, Amazon SES, Resend, PostMark, SMTP, MailChimp, Gmail | `email` | ✅ |
| 2 | 📱 **SMS** | Twilio, Gupshup | `phone` | ✅ |
| 3 | 💬 **WhatsApp** | Twilio WhatsApp, Gupshup WhatsApp | `phone` | ✅ |
| 4 | 🔔 **Mobile Push** | Firebase FCM | `deviceToken` (SDK opt-in) | ❌ Segment only |
| 5 | 🔗 **Webhook** | Custom HTTP endpoint | `userId`/`email`/`phone` | ✅ |

**Tenant Admins** bring their own provider credentials (Twilio API key, SMTP password, etc.) — Super Admins never see tenant secrets.

### 🔄 Phase 6 — Automation & Campaigns

| Feature | Description |
|---------|-------------|
| **Journey Builder** | Visual drag-and-drop workflow editor for automated multi-step campaigns |
| **Broadcasts** | One-time or scheduled mass messaging to segments |
| **Segments** | Advanced user segmentation with multi-condition rule groups (AND/OR) |
| **Templates** | HTML/MJML message templates with live preview and variable injection |
| **Subscription Groups** | Per-channel OptIn/OptOut management |
| **A/B Testing** | Variant testing with statistical significance and auto-winner selection |
| **Campaign Scheduler** | Calendar view with timezone-aware scheduling queue |

### 💰 Phase 6 — Billing & Analytics

| Feature | Description |
|---------|-------------|
| **Message Cost Tracking** | Micros-precision cost per message (1,000,000 micros = $1 USD) |
| **Per-Channel Pricing** | Configurable rates: Email $0.001, SMS $0.01, WhatsApp $0.05, Push $0.0001 |
| **Usage Aggregation** | Monthly usage summaries with automatic period detection and upsert |
| **Channel Breakdown** | Analytics with date range filtering, workspace filtering |
| **Plan Limit Enforcement** | Hard limits per plan tier with overage protection |

### 📊 Phase 7 — Admin Super Panel

| Feature | Description |
|---------|-------------|
| **Global Dashboard** | Total tenants, active/suspended counts, message volumes, revenue |
| **Tenant Monitoring** | View all tenants with current usage stats, manage plans |
| **Plan Assignment** | Upgrade/downgrade tenants between plan tiers |
| **Provider Health** | Real-time status of all channel providers (healthy/degraded/down) |
| **Volume Metrics** | Time-series message volume with configurable granularity |

### 🛡️ Phase 8 — Security & RBAC

| Feature | Description |
|---------|-------------|
| **AES-256-GCM Encryption** | All provider credentials encrypted at rest with random IV per operation |
| **Tenant-Scoped RBAC** | 4 roles: **Owner**, **Admin**, **Editor**, **Viewer** with granular permissions |
| **Per-Tenant Rate Limiting** | Configurable by plan tier, in-memory store (Redis-ready for production) |
| **Webhook Verification** | Twilio signature validation + generic HMAC-SHA256 for custom webhooks |
| **API Key Management** | Admin API keys for programmatic access with scoping |

**Permissions Matrix:**

| Capability | Owner | Admin | Editor | Viewer |
|------------|-------|-------|--------|--------|
| Manage team members | ✅ | ✅ | ❌ | ❌ |
| Configure providers & secrets | ✅ | ✅ | ❌ | ❌ |
| Create/edit campaigns | ✅ | ✅ | ✅ | ❌ |
| View analytics & reports | ✅ | ✅ | ✅ | ✅ |

### 🔧 Phase 9 — Dead Letter Queue (DLQ)

| Feature | Description |
|---------|-------------|
| **Failed Message Capture** | All failed sends automatically captured with full context |
| **Exponential Backoff** | Retry with jitter: `min(baseDelay × 2^attempt + jitter, maxDelay)` |
| **Configurable Retries** | Default 3 attempts, configurable via `DLQ_MAX_RETRIES` |
| **Admin Monitoring** | DLQ dashboard with queue depth, retry controls, and error inspection |
| **Manual Retry** | Retry individual failed messages or batch-retry all |

### 🧪 Phase 10 — A/B Testing & Campaign Scheduling

| Feature | Description |
|---------|-------------|
| **Variant Testing** | Create up to 5 message variants per broadcast |
| **Traffic Splitting** | Configurable percentage split (e.g., 50/30/20) |
| **Auto-Winner** | Automatically select winning variant based on open/click rates |
| **Statistical Confidence** | Results include confidence intervals and significance |
| **Campaign Scheduler** | Calendar view with scheduled send times and timezone support |

### 📋 Ad-hoc Lists & Quick Send (New)

Upload a CSV, paste a list, or manually enter contacts — then send a one-time broadcast without needing pre-built segments.

| Feature | Description |
|---------|-------------|
| **CSV Upload** | Drag & drop CSV with auto-column detection (email, phone, firstName, lastName) |
| **Manual Entry** | Add recipients one by one via form |
| **Paste List** | Paste emails/phones one per line — auto-detects format |
| **Deduplication** | Automatic duplicate removal by email+phone combination |
| **Batch Insert** | Recipients inserted in batches of 500 for performance |
| **Save for Reuse** | Optionally save any ad-hoc list for future campaigns |
| **Delivery Tracking** | Per-recipient status tracking (pending → sent → failed) |
| **Cost Estimation** | Show estimated send cost before confirming |

**Minimum required:** Just an `email` OR `phone` — that's all you need to send.

### 📈 Real-Time Engagement Tracking (New)

Full cross-channel engagement monitoring with live event streaming.

**20 Engagement Events Tracked:**

| Channel | Events |
|---------|--------|
| 📧 **Email** | Delivered, Opened, Clicked, Bounced, Dropped, Marked Spam |
| 📱 **SMS** | Delivered, Failed, Clicked |
| 💬 **WhatsApp** | Delivered, Read, Replied, Failed |
| 🔔 **Push** | Delivered, Clicked, Dismissed, Failed |
| 🔗 **Webhook** | Delivered, Failed |
| 📤 **General** | Sent, Failed, Skipped |

**Engagement Features:**

| Feature | Description |
|---------|-------------|
| **Channel Metrics** | Aggregated stats per channel: sent, delivered, opened, clicked + calculated rates |
| **Engagement Heatmap** | Day-of-week × hour-of-day grid showing peak engagement times for send optimization |
| **Live Event Timeline** | Real-time feed of opens, clicks, deliveries, bounces via Server-Sent Events (SSE) |
| **Per-User Scoring** | 0-100 engagement score with levels: 🥶 Cold (0-24), 🌤 Warm (25-49), 🔥 Hot (50-74), 🔥🔥 On Fire (75-100) |
| **SSE Real-Time Stream** | `EventSource` API — connect from any frontend for live updates |
| **Broadcast-Level Stats** | Filter engagement by specific broadcast or journey |

```javascript
// Connect to real-time engagement stream
const source = new EventSource('/api/admin/engagement/stream?workspaceId=xxx');
source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { type: "engagement", channel: "Email", eventType: "opened", userId: "..." }
  updateDashboard(data);
};
```

---

## Channels

```
┌─────────────────────────────────────────────────────┐
│                  Dice Engage                        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Email   │  │   SMS    │  │    WhatsApp       │  │
│  │ SMTP/SES │  │ Twilio/  │  │  Twilio/Gupshup  │  │
│  │ SendGrid │  │ Gupshup  │  │                   │  │
│  │ Resend   │  │          │  │                   │  │
│  │ PostMark │  │          │  │                   │  │
│  │ MailChimp│  │          │  │                   │  │
│  │ Gmail    │  │          │  │                   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │  Push    │  │      Webhook (Custom HTTP)       │ │
│  │ Firebase │  │                                  │ │
│  │   FCM    │  │                                  │ │
│  └──────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        API Layer                           │
│  Fastify + TypeBox Validation + Tenant RBAC Middleware      │
├──────────┬──────────┬───────────┬────────────┬─────────────┤
│ Tenants  │ Billing  │  Admin    │ Ad-hoc     │ Engagement  │
│Controller│Controller│  Panel    │ Lists      │ Controller  │
│          │          │Controller │ Controller │ (SSE)       │
├──────────┴──────────┴───────────┴────────────┴─────────────┤
│                    Service Layer                            │
│  Tenant CRUD  │ Billing │ Security │ Ad-hoc Lists          │
│  Brand CRUD   │ DLQ     │ RBAC     │ Engagement Tracking   │
├────────────────────────────────────────────────────────────┤
│                   Channel Abstraction                      │
│  ChannelProvider Interface → 10+ Provider Adapters         │
├────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  Drizzle ORM │ PostgreSQL │ 39 Tables │ 19 Enums          │
├────────────────────────────────────────────────────────────┤
│                  Infrastructure                             │
│  Redis (Rate Limit) │ Worker (DLQ) │ Docker │ Kubernetes   │
└────────────────────────────────────────────────────────────┘
```

### User Roles

| Role | Responsibilities |
|------|-----------------|
| **Super Admin** | Create tenants, assign plans, global rate limits, DLQ monitoring, platform encryption keys. **Cannot** configure tenant-level providers. |
| **Tenant Admin** | Configure their own channel providers (bring own Twilio/SMTP keys), manage RBAC, secrets, API keys, webhooks, brands. |
| **Campaign Manager** | Build journeys, create broadcasts, manage segments, use ad-hoc lists, view analytics. |
| **Viewer** | Read-only access to analytics and reports. |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** 14+ (or [Neon](https://neon.tech) for serverless)
- **Redis** (optional, for production rate limiting)

### Installation

```bash
# Clone the repository
git clone https://github.com/folkadonis/dice-engage.git
cd dice-engage

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, CREDENTIAL_ENCRYPTION_KEY, etc.

# Run database migrations
node migrations/run_migration.js "$DATABASE_URL" "migrations/001_full_schema.sql"
node migrations/run_migration.js "$DATABASE_URL" "migrations/002_adhoc_lists.sql"
node migrations/run_migration.js "$DATABASE_URL" "migrations/003_engagement_tracking.sql"

# Start development server
yarn dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `CREDENTIAL_ENCRYPTION_KEY` | AES-256 key (64 hex chars) for encrypting provider secrets | ✅ |
| `REDIS_URL` | Redis connection for production rate limiting | Optional |
| `WORKER_CONCURRENCY` | Parallel worker threads (default: 4) | Optional |
| `DLQ_MAX_RETRIES` | Max retry attempts before DLQ (default: 3) | Optional |

---

## API Reference

Full OpenAPI 3.0 specification: [`swagger.yaml`](./swagger.yaml)

### All Endpoint Groups

| Prefix | Tag | Endpoints | Description |
|--------|-----|-----------|-------------|
| `/api/admin/tenants` | Tenants | 8 | Tenant CRUD, suspend/activate, workspace assignment |
| `/api/admin/tenants/:id/brands` | Brands | 4 | Brand CRUD + sender configuration |
| `/api/admin/billing` | Billing | 3 | Usage tracking, plan limits, channel analytics |
| `/api/admin/panel` | Admin Panel | 5 | Dashboard, tenant monitoring, plan mgmt, provider health |
| `/api/admin/adhoc-lists` | Ad-hoc Lists | 8 | CSV upload, parse, create, send, delivery stats |
| `/api/admin/engagement` | Engagement | 6 | Summary, timeline, heatmap, user score, channels, SSE stream |
| `/api/journeys` | Journeys | 3+ | Journey CRUD and management |
| `/api/broadcasts` | Broadcasts | 3+ | Broadcast campaign management |
| `/api/segments` | Segments | 3+ | Segment builder and user targeting |
| `/api/content` | Content | 3+ | Template management |
| `/api/users` | Users | 3+ | User lookup and management |
| `/api/events` | Events | 2+ | Event tracking and ingestion |
| `/api/settings` | Settings | 2+ | Workspace settings |
| `/api/secrets` | Secrets | 2+ | Provider secret management |
| `/api/integrations` | Integrations | 2+ | Third-party integrations |
| `/api/subscription-groups` | Subscriptions | 2+ | OptIn/OptOut management |
| `/api/admin-keys` | API Keys | 2+ | Admin API key management |
| `/api/webhooks` | Webhooks | 2+ | Provider callback handling |
| `/api/public/*` | Public | 4 | Subscription management, webhooks (no auth) |
| `/internal-api/debug` | Debug | 1 | Internal debugging |

**Total: 60+ API endpoints**

### Quick Examples

```bash
# Create a tenant
curl -X POST http://localhost:3001/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "planType": "Growth"}'

# Upload ad-hoc list and send
curl -X POST http://localhost:3001/api/admin/adhoc-lists \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "...",
    "name": "Flash Sale March",
    "recipients": [
      {"email": "john@acme.com", "firstName": "John"},
      {"email": "sara@beta.io", "phone": "+1234567890"}
    ],
    "channel": "Email",
    "savedForReuse": true
  }'

# Parse CSV before creating list
curl -X POST http://localhost:3001/api/admin/adhoc-lists/parse-csv \
  -H "Content-Type: application/json" \
  -d '{"csvContent": "email,phone,firstName\njohn@acme.com,+1234567890,John\nsara@beta.io,,Sara"}'

# Get engagement summary
curl "http://localhost:3001/api/admin/engagement/summary?workspaceId=xxx&channel=Email"

# Get user engagement score
curl "http://localhost:3001/api/admin/engagement/user/john@acme.com?workspaceId=xxx"

# Real-time SSE stream (use EventSource in browser)
curl -N "http://localhost:3001/api/admin/engagement/stream?workspaceId=xxx"

# Check billing usage
curl http://localhost:3001/api/admin/billing/usage/{tenantId}

# Admin dashboard overview
curl http://localhost:3001/api/admin/panel/dashboard
```

---

## Database

**39 tables** and **19 enums** organized across 8 domains:

| Domain | Tables | Description |
|--------|--------|-------------|
| **Multi-Tenant** | `Tenant`, `Brand`, `Workspace`, `WorkspaceMember`, `WorkspaceMemberRole`, `WorkspaceMembeAccount`, `WorkspaceRelation`, `WorkspaceOccupantSetting` | Tenant hierarchy and team management |
| **Billing** | `MessageLog`, `BillingUsage` | Message cost tracking and usage aggregation |
| **Messaging** | `MessageTemplate`, `EmailTemplate`, `EmailProvider`, `DefaultEmailProvider`, `SmsProvider`, `DefaultSmsProvider`, `WhatsappProvider`, `DefaultWhatsappProvider` | Templates and provider configuration |
| **Automation** | `Journey`, `Broadcast`, `Segment`, `SegmentAssignment`, `SubscriptionGroup`, `SubscriptionManagementTemplate` | Campaign workflows and segmentation |
| **User Data** | `UserProperty`, `UserPropertyAssignment`, `UserPropertyIndex`, `UserJourneyEvent` | User attributes and event tracking |
| **Platform** | `Secret`, `WriteKey`, `OauthToken`, `AdminApiKey`, `Feature`, `Integration`, `ComponentConfiguration`, `ComputedPropertyPeriod`, `SegmentIOConfiguration` | Platform configuration |
| **Ad-hoc Lists** | `AdhocList`, `AdhocListRecipient` | Ad-hoc recipient lists and delivery tracking |
| **Engagement** | Extended `MessageLog` with delivery lifecycle columns | Opens, clicks, bounces, per-user scoring |

### Migrations

| File | Description |
|------|-------------|
| [`001_full_schema.sql`](./migrations/001_full_schema.sql) | Full schema: 37 tables, 18 enums, indexes, foreign keys |
| [`002_adhoc_lists.sql`](./migrations/002_adhoc_lists.sql) | `AdhocList` + `AdhocListRecipient` tables with `AdhocListStatus` enum |
| [`003_engagement_tracking.sql`](./migrations/003_engagement_tracking.sql) | Engagement lifecycle columns + indexes on `MessageLog` |

---

## UI Pages

**27 pages** with full wireframes available in [`wireframes/wireframes.md`](./wireframes/wireframes.md):

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Dashboard | `/dashboard` | Global metrics, charts, activity feed |
| 2 | Tenant List | `/admin/tenants` | Tenant CRUD table with filters |
| 3 | Tenant Detail | `/admin/tenants/:id` | Edit tenant, brands, workspaces |
| 4 | Journey Builder | `/journeys/:id` | Visual node-based flow editor |
| 5 | Broadcasts | `/broadcasts` | Campaign list + create form |
| 6 | Segment Builder | `/segments/:id` | Rule groups + preview |
| 7 | Template Editor | `/templates/:id` | Code editor + live preview |
| 8 | User Management | `/users` | User table + detail panel |
| 9 | Billing & Usage | `/admin/billing/:tenantId` | Usage meters + channel breakdown |
| 10 | Analytics | `/analytics` | Charts, channel mix, delivery stats |
| 11 | Settings & Providers | `/settings/providers` | Provider config, channel providers |
| 12 | Admin Panel | `/admin/panel` | Platform health, tenant monitoring |
| 13 | Security & RBAC | `/settings/security/rbac` | Roles, permissions matrix |
| 14 | Subscriptions | `/public/subscriptions` | Public opt-in/out page |
| 15 | API Keys | `/settings/api-keys` | Key management |
| 16 | Login | `/login` | Auth with SSO support |
| 17 | Brand Management | `/admin/tenants/:id/brands` | Brand CRUD + sender config |
| 18 | Channel Registry | `/settings/channels` | Provider status, latency, defaults |
| 19 | DLQ Monitor | `/admin/dlq` | Dead letter queue + retry controls |
| 20 | Encryption | `/settings/security/encryption` | AES-256 key management |
| 21 | Rate Limiting | `/settings/security/rate-limits` | Per-plan limits + live activity |
| 22 | Webhook Config | `/settings/security/webhooks` | Signature verification + endpoints |
| 23 | A/B Testing | `/broadcasts/:id/ab-test` | Variant testing + auto-winner |
| 24 | Campaign Scheduler | `/broadcasts/schedule` | Calendar view + schedule queue |
| 25 | Ad-hoc Send | `/broadcasts/adhoc` | CSV/manual list → quick send |
| 26 | Saved Lists | `/broadcasts/lists` | Reusable recipient lists |
| 27 | Engagement Dashboard | `/analytics/engagement` | Real-time metrics, heatmap, SSE stream |

### App Flows (12 documented)

1. Super Admin — Onboard New Tenant
2. Campaign Manager — Build & Send a Broadcast
3. Tenant Admin — First-Time Setup (configure own providers)
4. Campaign Manager — Create an Automated Journey
5. Campaign Manager — Build a Segment & Preview Users
6. Super Admin — Monitor Platform Health (Admin Panel)
7. Super Admin — Manage DLQ and Retry Failed Messages
8. Tenant Admin — Configure Security (RBAC, Encryption, Webhooks)
9. Campaign Manager — A/B Test a Broadcast
10. Campaign Manager — Schedule Future Campaigns
11. Campaign Manager — Ad-hoc Send to a Custom List
12. Campaign Manager — Monitor Real-Time Engagement

---

## Deployment

### Docker Compose

```bash
# Core services (API, Worker, Dashboard, PostgreSQL, Kafka, ClickHouse, Temporal)
docker-compose up -d

# With omnichannel extensions (Redis + Worker with resource limits)
docker-compose -f docker-compose.yml -f docker-compose.omnichannel.yml up -d
```

### Kubernetes (Helm)

```bash
# Standard deployment
helm install dice-engage ./helm -f helm/values.yaml

# With omnichannel autoscaling + Redis
helm upgrade --install dice-engage ./helm \
  -f helm/values.yaml \
  -f helm/values-omnichannel.yaml \
  --set security.credentialEncryption.key=$CREDENTIAL_ENCRYPTION_KEY
```

**Autoscaling defaults:**
- Workers: 2–10 replicas (target 70% CPU)
- API: 2–8 replicas (target 70% CPU)
- Redis: 256MB with LRU eviction

---

## Project Structure

```
dice-engage/
├── packages/
│   ├── api/                        # Fastify API server
│   │   └── src/controllers/
│   │       ├── tenantsController.ts       # Tenant & Brand CRUD
│   │       ├── billingController.ts       # Usage, limits, analytics
│   │       ├── adminPanelController.ts    # Admin dashboard & monitoring
│   │       ├── adhocListsController.ts    # Ad-hoc list endpoints
│   │       ├── engagementController.ts    # Real-time engagement + SSE
│   │       ├── broadcastsController.ts    # Campaign management
│   │       ├── journeysController.ts      # Journey automation
│   │       ├── segmentsController.ts      # Segmentation
│   │       └── ...                        # 15+ more controllers
│   ├── backend-lib/                # Core business logic
│   │   └── src/
│   │       ├── channels/           # Channel provider adapters
│   │       ├── db/
│   │       │   ├── schema.ts       # Drizzle schema (39 tables, 19 enums)
│   │       │   └── relations.ts    # Table relationships
│   │       ├── adhocLists.ts       # CSV parsing, dedup, CRUD
│   │       ├── engagementTracking.ts  # Event bus, metrics, scoring
│   │       ├── billing.ts          # Cost tracking & plan limits
│   │       ├── security.ts         # AES-256, RBAC, rate limiting
│   │       └── dlq.ts             # Dead letter queue & retries
│   └── isomorphic-lib/            # Shared types & constants
│       └── src/types.ts           # 20 engagement events, channel types
├── migrations/
│   ├── 001_full_schema.sql        # Core schema (37 tables)
│   ├── 002_adhoc_lists.sql        # Ad-hoc list tables
│   ├── 003_engagement_tracking.sql # Engagement columns + indexes
│   └── run_migration.js           # Migration runner script
├── wireframes/
│   └── wireframes.md             # 27 ASCII wireframes + 12 app flows
├── helm/                          # Kubernetes Helm charts
│   ├── values.yaml
│   └── values-omnichannel.yaml    # Autoscaling + Redis config
├── docker-compose.yml             # Core Docker Compose
├── docker-compose.omnichannel.yml # Extended services (Redis + Worker)
├── swagger.yaml                   # OpenAPI 3.0 spec (60+ endpoints)
└── docs/
    └── schema-diagram.html        # Interactive DB schema diagram
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ / TypeScript 5 |
| **API Framework** | Fastify + TypeBox validation |
| **ORM** | Drizzle ORM (type-safe, SQL-first) |
| **Database** | PostgreSQL 14+ (Neon compatible) |
| **Cache / Rate Limit** | Redis 7 (optional) |
| **Containerization** | Docker + Kubernetes (Helm) |
| **Event Streaming** | Kafka (Redpanda) |
| **Analytics** | ClickHouse |
| **Workflow Engine** | Temporal |
| **Error Handling** | neverthrow (Result types) |
| **Validation** | @sinclair/typebox |
| **Real-Time** | Server-Sent Events (SSE) |

---

## Contributing

We welcome contributions! 

```bash
# Run locally in development mode
yarn dev

# Type-check the entire project
npx tsc --noEmit

# Format code
yarn format
```

---

## License

[MIT Licensed](/LICENSE) — free forever.

---

<p align="center">
  Built with ❤️ by the Dice Engage team
</p>
