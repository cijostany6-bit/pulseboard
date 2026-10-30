# Architecture Decision Records — PulseBoard

---

## ADR-001: Event-Driven Health Checks via Message Queue

**Context:** Health Checker needs to notify Alert Manager when a service becomes unhealthy. Direct HTTP calls create tight coupling and synchronous dependencies.

**Decision:** Health Checker publishes results to a Redis pub/sub channel. Alert Manager subscribes and processes asynchronously.

**Consequences:**
- Health Checker and Alert Manager can scale independently
- If Alert Manager is down, health results are lost (acceptable — next check re-publishes in 30s)
- Redis becomes a single point of failure (mitigated by Redis persistence)

**Rejected:** Direct HTTP calls (tight coupling, cascading failures), SQS (AWS dependency for local dev)

**Cost:** Redis container (~50MB RAM). No additional AWS cost.

---

## ADR-002: Immutable Docker Image Tags (Commit SHA)

**Context:** Need to trace every deployment to exact source code. "latest" tag is ambiguous and makes rollbacks unreliable.

**Decision:** Tag every Docker image with the Git commit SHA (short form). Also tag with "latest" for convenience.

**Consequences:**
- Every deployment is traceable to exact commit
- Rollback is trivial (`kubectl rollout undo` or re-deploy previous SHA)
- ECR lifecycle policy keeps last 10 images (cost control)

**Rejected:** Semantic versioning (too manual for CI/CD), "latest" only (ambiguous)

**Cost:** ECR storage (~$0.10/GB/month). 10 images × ~150MB = ~1.5GB = ~$0.15/month.

---

## ADR-003: Separate Services with Independent Scaling

**Context:** Could build PulseBoard as a single monolith. But microservices allow independent scaling and deployment.

**Decision:** Split into 5 services (API Gateway, Auth, Health Checker, Metrics Collector, Alert Manager). Each has its own Dockerfile, K8s deployment, and can scale independently.

**Consequences:**
- Health Checker can scale up during high monitoring load without scaling Auth Service
- Each service can be deployed independently
- More complex (5 Dockerfiles, 5 K8s manifests, 5 ECR repos)
- Network policies needed to control service-to-service communication

**Rejected:** Monolith (simpler but doesn't demonstrate microservices skills)

**Cost:** 5 ECR repos (free), 5 K8s deployments (runs on existing EKS nodes).

---

## ADR-004: Rolling Updates with Zero Downtime

**Context:** Deploying new versions shouldn't cause service interruption.

**Decision:** Use Kubernetes RollingUpdate strategy with maxUnavailable: 0 and maxSurge: 1. New pods are created before old ones are terminated.

**Consequences:**
- Zero downtime deployments
- Requires 2x resources during rollout (temporarily)
- Readiness probes must be accurate (traffic only goes to ready pods)

**Rejected:** Recreate strategy (causes downtime), Blue/Green (requires 2x resources permanently)

**Cost:** Temporary resource spike during deploys. No persistent cost.

---

## ADR-005: Secrets in AWS Secrets Manager

**Context:** Database passwords, JWT secrets, and Slack webhooks need to be stored securely. Hardcoding in Git or Docker images is a security risk.

**Decision:** Store secrets in AWS Secrets Manager. Inject into K8s pods via K8s secrets (synced from Secrets Manager via IRSA).

**Consequences:**
- No secrets in Git or Docker images
- Secrets can be rotated without redeploying
- Requires IRSA (IAM Roles for Service Accounts) setup
- Adds AWS dependency

**Rejected:** K8s secrets only (base64, not encrypted at rest by default), environment variables in Dockerfile (visible in image layers)

**Cost:** Secrets Manager: $0.40/secret/month. 4 secrets = ~$1.60/month.

---

## ADR-006: Liveness vs Readiness Probes

**Context:** K8s needs to know when a pod is healthy (liveness) and when it can receive traffic (readiness). Getting this wrong causes cascading failures.

**Decision:**
- **Liveness probe** (`/health`): Checks if the process is alive. If it fails, K8s restarts the pod.
- **Readiness probe** (`/ready`): Checks if the pod can serve traffic (DB connected, Redis connected). If it fails, K8s stops sending traffic but doesn't restart.

**Consequences:**
- `/health` must NOT check dependencies (DB, Redis). If it does, a DB outage restarts all pods, causing cascading failure.
- `/ready` checks dependencies. During DB outage, pods stop receiving traffic but stay alive.
- Both probes must be fast (< 3s timeout).

**Rejected:** Single probe for both (causes either unnecessary restarts or traffic to unhealthy pods)

**Cost:** None. Built into K8s.

---

## ADR-007: Network Policies (Default Deny)

**Context:** By default, all pods can talk to all pods. This is a security risk. A compromised pod could access the database or other services.

**Decision:** Implement K8s Network Policies with default-deny-all, then explicitly allow only required communication paths.

**Consequences:**
- Services can only talk to services they need
- Health Checker can't access the database directly
- Alert Manager can't access Auth Service
- Adds complexity (need to define all allowed paths)
- Requires a CNI that supports Network Policies (Calico, Cilium)

**Rejected:** No network policies (insecure), allow-all (defeats the purpose)

**Cost:** None. Built into K8s (with supported CNI).

---

## ADR-008: CloudWatch for Observability (v1)

**Context:** Need logs, metrics, and alarms. Options: CloudWatch (AWS-native) or Prometheus + Grafana (industry standard).

**Decision:** Use CloudWatch for v1. Logs via CloudWatch Logs, metrics via log-derived metric filters, alarms via CloudWatch Alarms, dashboard via CloudWatch Dashboards.

**Consequences:**
- Zero setup (AWS-managed)
- Native integration with EKS, Lambda, EC2
- Basic dashboards (not as pretty as Grafana)
- Vendor lock-in (AWS-specific)
- Prometheus + Grafana can be added in v2 for richer visualization

**Rejected:** Prometheus + Grafana (adds significant complexity, self-hosted, separate alertmanager)

**Cost:** CloudWatch free tier: 5GB logs, 10 metrics, 10 alarms. Beyond that: ~$0.50/GB logs, $0.30/metric/month, $0.10/alarm/month. Estimated: ~$5-10/month for this workload.
