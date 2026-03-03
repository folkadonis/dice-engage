<p align="center">
  <h1 align="center">🎲 Dice Engage</h1>
</p>

---

<h3 align="center">Multi-Tenant Omnichannel Customer Engagement Platform</h3>

<p align="center">
  <a href="#features">Features</a> • <a href="#channels">Channels</a> • <a href="#architecture">Architecture</a> • <a href="#getting-started">Getting Started</a> • <a href="#api-reference">API</a> • <a href="#deployment">Deployment</a> • <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

**Dice Engage** is a production-ready, multi-tenant omnichannel SaaS platform for customer engagement. Send broadcasts, automate user journeys, and engage customers across **7 channels** with **10 provider integrations** — all with built-in billing, analytics, RBAC, and a global admin panel.

## Features

### 🏢 Multi-Tenancy
- **Tenant → Brand → Workspace** hierarchy with full data isolation
- Tenant lifecycle management (create, suspend, activate, cancel)
- Per-tenant plan tiers: **Starter** (10K msgs/mo), **Growth** (100K), **Enterprise** (unlimited)
- Brand-level sender configuration with timezone support

### 📨 Omnichannel Messaging
| Channel | Providers | Status |
|---------|-----------|--------|
| **Email** | SMTP, Amazon SES | ✅ Production |
| **SMS** | Twilio, Gupshup | ✅ Production |
| **WhatsApp** | Twilio, Gupshup | ✅ Production |
| **Mobile Push** | Firebase FCM | ✅ Production |
| **Web Push** | VAPID | ✅ Production |
| **RCS** | Generic (SMS fallback) | ✅ Production |
| **Webhook** | Custom | ✅ Production |

### 🔄 Automation & Campaigns
- **Journey Builder** — Visual drag-and-drop workflow editor
- **Broadcasts** — One-time mass messaging with scheduling
- **Segments** — Advanced user segmentation with multiple operators
- **Templates** — HTML/MJML message templates with low-code editor
- **Subscription Groups** — OptIn/OptOut management per channel

### 💰 Billing & Analytics
- Real-time message cost tracking (micros precision: 1,000,000 micros = $1)
- Per-channel pricing with configurable rates
- Monthly usage aggregation with automatic upsert
- Channel breakdown analytics with date range filtering
- Plan limit enforcement with overage protection

### 🛡️ Security
- **AES-256-GCM encryption** for provider credentials at rest
- **Tenant-scoped RBAC** with 4 roles: Owner, Admin, Editor, Viewer
- **Per-tenant rate limiting** (configurable by plan tier, Redis-ready)
- **Webhook signature verification** (Twilio + generic HMAC-SHA256)

### 📊 Admin Super Panel
- Global dashboard with tenant counts, message volumes, revenue metrics
- Tenant management with usage stats and plan assignment
- Provider health monitoring via Channel Registry
- Time-series message volume analytics

### 🔧 Infrastructure
- **Dead Letter Queue** with exponential backoff + jitter retry
- **Docker Compose** extension for Redis + Worker services
- **Helm charts** with horizontal autoscaling (Workers 2–10, API 2–8)
- Production-grade resource limits and health checks

## Channels

```
┌─────────────────────────────────────────────────────┐
│                  Dice Engage                        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Email   │  │   SMS    │  │    WhatsApp       │  │
│  │ SMTP/SES │  │ Twilio/  │  │  Twilio/Gupshup  │  │
│  └──────────┘  │ Gupshup  │  └──────────────────┘  │
│                └──────────┘                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Push    │  │ Web Push │  │   RCS (+ SMS     │  │
│  │ Firebase │  │  VAPID   │  │    fallback)     │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Webhook (Custom)                   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        API Layer                           │
│  Fastify + TypeBox Validation + Tenant RBAC Middleware      │
├───────────┬──────────┬───────────┬────────────┬────────────┤
│ Tenants   │ Billing  │  Admin    │  Journeys  │  Webhooks  │
│ Controller│Controller│  Panel    │ Segments   │ Controller │
│           │          │Controller │ Broadcasts │            │
├───────────┴──────────┴───────────┴────────────┴────────────┤
│                    Service Layer                            │
│  Tenant CRUD │ Billing │ Channel Registry │ Security       │
├────────────────────────────────────────────────────────────┤
│                   Channel Abstraction                      │
│  ChannelProvider Interface → 10 Provider Adapters          │
├────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  Drizzle ORM │ PostgreSQL │ 37 Tables │ 18 Enums          │
├────────────────────────────────────────────────────────────┤
│                  Infrastructure                             │
│  Redis (Rate Limit) │ Worker (DLQ) │ Docker │ Kubernetes   │
└────────────────────────────────────────────────────────────┘
```

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

# Start development server
yarn dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `CREDENTIAL_ENCRYPTION_KEY` | AES-256 key for encrypting provider secrets | ✅ |
| `REDIS_URL` | Redis connection for rate limiting | Optional |
| `WORKER_CONCURRENCY` | Parallel worker threads (default: 4) | Optional |
| `DLQ_MAX_RETRIES` | Max retry attempts before DLQ (default: 3) | Optional |

## API Reference

Full OpenAPI 3.0 specification is available in [`swagger.yaml`](./swagger.yaml).

### Key Endpoint Groups

| Prefix | Description | Endpoints |
|--------|-------------|-----------|
| `/api/admin/tenants` | Tenant & Brand CRUD, suspension, workspace assignment | 11 |
| `/api/admin/billing` | Usage tracking, plan limits, channel analytics | 3 |
| `/api/admin/panel` | Dashboard, tenant list, plan mgmt, provider health, volume metrics | 7 |
| `/api` | Journeys, Segments, Broadcasts, Users, Events, Templates, Settings | 20+ |
| `/api/public` | Webhooks, subscription management, view-in-browser | 4 |

### Quick Examples

```bash
# Create a tenant
curl -X POST http://localhost:3001/api/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "planType": "Growth"}'

# Check billing usage
curl http://localhost:3001/api/admin/billing/usage/{tenantId}

# Get admin dashboard overview
curl http://localhost:3001/api/admin/panel/dashboard

# Check plan limits
curl "http://localhost:3001/api/admin/billing/limits/{tenantId}?channel=Email"
```

## Database Schema

**37 tables** organized across 6 domains:

| Domain | Tables |
|--------|--------|
| **Multi-Tenant** | `Tenant`, `Brand`, `Workspace`, `WorkspaceMember`, `WorkspaceMemberRole`, `WorkspaceMembeAccount`, `WorkspaceRelation`, `WorkspaceOccupantSetting` |
| **Billing** | `MessageLog`, `BillingUsage` |
| **Messaging** | `MessageTemplate`, `EmailTemplate`, `EmailProvider`, `DefaultEmailProvider`, `SmsProvider`, `DefaultSmsProvider`, `WhatsappProvider`, `DefaultWhatsappProvider` |
| **Automation** | `Journey`, `Broadcast`, `Segment`, `SegmentAssignment`, `SubscriptionGroup`, `SubscriptionManagementTemplate` |
| **User Data** | `UserProperty`, `UserPropertyAssignment`, `UserPropertyIndex`, `UserJourneyEvent` |
| **Platform** | `Secret`, `WriteKey`, `OauthToken`, `AdminApiKey`, `Feature`, `Integration`, `ComponentConfiguration`, `ComputedPropertyPeriod`, `SegmentIOConfiguration` |

Migration file: [`migrations/001_full_schema.sql`](./migrations/001_full_schema.sql)

## Deployment

### Docker Compose

```bash
# Core services
docker-compose up -d

# With omnichannel extensions (Redis + Worker)
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

**Autoscaling defaults**:
- Workers: 2–10 replicas (target 70% CPU)
- API: 2–8 replicas (target 70% CPU)
- Redis: 256MB with LRU eviction

## Project Structure

```
dice-engage/
├── packages/
│   ├── api/                    # Fastify API server
│   │   └── src/controllers/    # REST controllers
│   ├── backend-lib/            # Core business logic
│   │   └── src/
│   │       ├── channels/       # Channel provider adapters
│   │       ├── db/             # Drizzle schema & relations
│   │       ├── billing.ts      # Billing service
│   │       ├── security.ts     # Encryption, RBAC, rate limits
│   │       ├── tenants.ts      # Tenant CRUD
│   │       ├── brands.ts       # Brand CRUD
│   │       └── dlq.ts          # Dead letter queue
│   └── isomorphic-lib/         # Shared types & utilities
├── migrations/                 # SQL migration files
├── helm/                       # Kubernetes Helm charts
├── docker-compose.yml          # Core Docker Compose
├── docker-compose.omnichannel.yml  # Extended services
└── swagger.yaml                # OpenAPI 3.0 spec
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ / TypeScript 5 |
| **API Framework** | Fastify + TypeBox |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL 14+ |
| **Cache/Rate Limit** | Redis 7 |
| **Containerization** | Docker + Kubernetes (Helm) |
| **Error Handling** | neverthrow (Result types) |
| **Validation** | @sinclair/typebox |

## Contributing

We welcome contributions! Please check out the [contributing guide](https://docs.dittofeed.com/contributing/) for instructions on running the project locally and submitting PRs.

```bash
# Run locally in development mode
yarn dev

# Type-check
npx tsc --noEmit

# Format
yarn format
```

## License

[MIT Licensed](/LICENSE) — free forever.

---

<p align="center">
  Built with ❤️ by the Dice Engage team
</p>
