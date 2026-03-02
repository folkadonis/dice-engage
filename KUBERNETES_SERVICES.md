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
- `dittofeed-lite` (web app)
- `admin-cli` (worker utility)
- `dittofeed-ch` (ClickHouse)
- `temporal` (Temporal server)
- managed PostgreSQL database (`dittofeed-db`)

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

