# Kubernetes services/pods to run Dice Engage

This repository does not include native Kubernetes manifests, but the required runtime components are defined in `docker-compose.yaml`, `docker-compose.lite.yaml`, and `render.yaml`.

## Full application mode (separate app services)

Application pods/services:
- `dashboard` (web UI)
- `api` (backend API)
- `worker` (background/Temporal worker)
- `admin-cli` (maintenance job/utility pod)

Infrastructure pods/services:
- `postgres` (primary relational DB)
- `temporal` (workflow orchestration backend)
- `clickhouse-server` (analytics/event storage)

Optional pods/services (environment/profile dependent):
- `kafka` + `kafka-setup` (event streaming profile)
- `temporal-ui` (Temporal visibility UI)
- `otel-collector`, `zipkin`, `prometheus`, `grafana` (observability profile)
- `mail-server` (local SMTP testing)
- `blob-storage` (local S3-compatible storage for development)

## Lite mode (single app process)

Application pods/services:
- `lite` (combined app experience)
- `admin-cli` (optional maintenance pod)

Infrastructure pods/services:
- `postgres`
- `temporal`
- `clickhouse-server`

Optional pods/services:
- `temporal-ui`
- `blob-storage`

## Render mapping

The Render template confirms the minimum production topology as:
- `dice-engage-lite` (web app)
- `admin-cli` (worker utility)
- `dice-engage-ch` (ClickHouse)
- `temporal` (Temporal server)
- managed PostgreSQL database (`dice-engage-db`)

## Kubernetes implementation hint

For Kubernetes, model these as:
- Deployments/StatefulSets for each long-running pod above.
- ClusterIP Services for in-cluster connectivity (`postgres`, `temporal`, `clickhouse`, app services).
- Ingress/LoadBalancer for externally exposed app endpoints (`dashboard` or `lite`, optionally `api`).
- PersistentVolumeClaims for `postgres` and `clickhouse` data.

## Free/low-cost deployment options

If your goal is "free as possible", these are the most practical options:

1. Local machine (fully free)
   - Run `docker-compose.lite.yaml` on your own laptop/desktop.
   - Best for evaluation, demos, and development.
   - No cloud bill, but uptime depends on your machine.

2. Single small VM + Docker Compose (can be free on some providers)
   - Use `docker-compose.lite.yaml` on one Linux VM.
   - Works well with providers that offer always-free or trial compute.
   - Cheapest real internet-accessible setup if Kubernetes is not required.

3. Single-node Kubernetes (k3s/microk8s/minikube)
   - Run the `lite` app + Postgres + Temporal + ClickHouse on one node.
   - Good if you specifically want Kubernetes practice with minimal cost.

4. Hybrid free-tier approach
   - Host app (`lite`) on a free web/container tier where available.
   - Move stateful dependencies (`postgres`, `clickhouse`) to managed free tiers or your own VM.
   - Note: free tiers often sleep, limit storage/CPU, or expire.

### Important practical note

For reliable production workloads, this stack usually outgrows strict free tiers because Temporal + ClickHouse + Postgres are stateful and memory/storage heavy. Use lite mode first, then scale up to paid infrastructure when usage increases.

## If you want to monetize with campaigns for multiple brands

If you plan to run campaigns for different client brands, use this rollout path.

### Recommended deployment model

1. Start with one shared platform (lowest cost)
   - One `dashboard`/`api`/`worker` stack (or `lite` stack) serving multiple brands.
   - Separate brands logically at the application/workspace level.

2. Isolate data and secrets per brand
   - Use per-brand API keys, sender identities, and credential sets.
   - Keep secrets in Kubernetes Secrets and scope access by namespace/RBAC.

3. Add traffic controls before paid campaigns scale
   - Configure rate limits and queue/backpressure policies in worker processing.
   - Reserve resources/limits per deployment to avoid one brand impacting others.

4. Move heavy dependencies to managed services when revenue grows
   - Postgres and ClickHouse are the first services to bottleneck.
   - Keep Temporal healthy with stable storage and enough memory headroom.

### Minimal production baseline for monetized usage

For paid campaigns, avoid strict free-tier hosting. Run at least:
- app: `dashboard` + `api` + `worker` (or `lite` for simpler operations)
- data/workflows: `postgres` + `clickhouse-server` + `temporal`
- observability: `prometheus` + `grafana` (or equivalent managed monitoring)

### Multi-brand scaling strategy

- Early stage: single cluster, single environment, logical tenant isolation.
- Growth stage: separate namespaces per brand tier (or per region).
- Enterprise stage: dedicated environment/cluster for high-volume brands.

This lets you start lean, prove campaign ROI, and progressively isolate high-value customers without rebuilding the stack.
