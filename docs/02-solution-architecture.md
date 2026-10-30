# 02 · Solution Architecture — PulseBoard

**Status:** 🟡 Draft v0.1 · **Owner:** Cijo Stany John

---

## 1. High-Level Solution

PulseBoard is a **microservices platform** deployed on Kubernetes (EKS) that provides
real-time health monitoring, metrics collection, and alerting. Five core services work
together behind an API gateway, backed by Redis and PostgreSQL, with a React frontend
for dashboards.

```
                        ┌─────────────┐
                        │   Ingress   │ (NGINX + TLS)
                        └──────┬──────┘
                               │
                        ┌──────┴──────┐
                        │ API Gateway │ (Node.js, port 8080)
                        └──────┬──────┘
               ┌───────────────┼───────────────┐
               │               │               │
        ┌──────┴──────┐ ┌──────┴──────┐ ┌─────┴─────┐
        │ Auth Service│ │Health Check │ │ Metrics   │
        │  (8081)     │ │   er (8082) │ │ Collector │
        └─────────────┘ └──────┬──────┘ │  (8083)   │
                               │        └─────┬─────┘
                        ┌──────┴──────┐ ┌──────┴──────┐
                        │ Alert Mgr   │ │  Redis / PG │
                        │  (8084)     │ │             │
                        └─────────────┘ └─────────────┘
```

---

## 2. Service Breakdown

| Service | Port | Responsibility | Tech | Data Store |
|---|---|---|---|---|
| **API Gateway** | 8080 | Route requests, auth middleware, rate limiting | Node.js + Express | None |
| **Auth Service** | 8081 | User registration, login, JWT issuance, token verification | Node.js + Express + JWT + bcrypt | PostgreSQL (users) |
| **Health Checker** | 8082 | Periodically ping registered services, publish results to queue | Node.js + Express + axios + ioredis | Redis (service registry) |
| **Metrics Collector** | 8083 | Collect CPU/memory/response time, store and aggregate | Node.js + Express + pg | PostgreSQL (metrics) |
| **Alert Manager** | 8084 | Consume health results, evaluate rules, trigger notifications | Node.js + Express + ioredis + nodemailer | PostgreSQL (rules, history) |
| **Frontend** | 80 (nginx) | Dashboard showing service health, metrics, alerts | React + Vite + nginx | None (API-driven) |

---

## 3. Communication Patterns

### Synchronous (REST)
```
User → API Gateway → Auth Service (verify token)
User → API Gateway → Health Checker (get status)
User → API Gateway → Metrics Collector (get metrics)
User → API Gateway → Alert Manager (get rules/history)
```

### Asynchronous (Event-Driven via Redis Pub/Sub)
```
Health Checker → Redis (publish health-results) → Alert Manager (subscribe)
```

### Why This Matters
- **Decoupling**: Health Checker doesn't know about Alert Manager. It just publishes results.
- **Independent scaling**: Health Checker can scale up without affecting Alert Manager.
- **Resilience**: If Alert Manager is down, health results queue up in Redis. No data loss.

---

## 4. Data Model

### PostgreSQL Tables

```sql
-- Users (Auth Service)
users (id, email, password_hash, role, created_at)

-- Monitored Services (Health Checker)
services (id, name, url, interval_ms, status, last_check, created_at)

-- Health Check Results (Health Checker)
health_results (id, service_name, status, response_time, checked_at)

-- Metrics (Metrics Collector)
metrics (id, service_name, cpu, memory, response_time, recorded_at)

-- Alert Rules (Alert Manager)
alert_rules (id, service_name, condition, channel, enabled, created_at)

-- Alert History (Alert Manager)
alert_history (id, service_name, message, severity, triggered_at)
```

### Redis Usage
- **Pub/Sub channel**: `health-results` (health checker → alert manager)
- **Cache**: Service registry cache (optional, for performance)

---

## 5. Deployment Strategy

### Local Development
```bash
docker-compose up -d  # All services + Redis + PostgreSQL
make smoke-test        # Verify all services healthy
```

### Kubernetes (EKS)
- Each service: 2 replicas, RollingUpdate (maxUnavailable: 0, maxSurge: 1)
- HPA for api-gateway and health-checker (scale based on CPU)
- NGINX Ingress with TLS
- Network policies: default deny, allow specific service-to-service
- RBAC: service accounts with least privilege

### CI/CD (Jenkins)
```
Git push → Jenkins webhook → Lint + Test → Build Docker images (commit SHA) → Push to ECR → Update K8s manifests → Deploy to EKS (rolling) → Post-deploy verification → Rollback on failure
```

---

## 6. Security Approach

| Layer | Implementation |
|---|---|
| **Container** | Non-root user (UID 1001), read-only root filesystem, drop ALL capabilities |
| **Network** | K8s Network Policies (default deny, allow specific) |
| **Auth** | JWT tokens, bcrypt password hashing, RBAC in K8s |
| **Secrets** | AWS Secrets Manager → K8s secrets (injected at runtime) |
| **IAM** | Least privilege. Jenkins uses instance profile. EKS uses IRSA. |
| **Image** | Trivy scan in CI. ECR scan on push. Non-root base images. |

---

## 7. Observability Approach

| Layer | Implementation |
|---|---|
| **Logs** | Structured JSON logs → CloudWatch Logs (7-day retention) |
| **Metrics** | Log-derived metrics via CloudWatch Metric Filters |
| **Alarms** | CloudWatch Alarms (5xx rate, latency p99, pod count) |
| **Dashboard** | CloudWatch Dashboard (errors, latency, logs) |
| **Alerts** | SNS → Email notification |
| **Probes** | K8s liveness (/health) and readiness (/ready) probes |

---

## 8. Infrastructure (CloudFormation)

| Stack | Resources |
|---|---|
| **vpc.yaml** | VPC, subnets (public/private), IGW, NAT gateway, route tables |
| **eks-cluster.yaml** | EKS cluster, node group, OIDC provider |
| **ecr-repos.yaml** | 5 ECR repositories with lifecycle policies |
| **iam-roles.yaml** | Jenkins role (instance profile), EKS service role (IRSA) |
| **observability.yaml** | CloudWatch log groups, metric filters, alarms, SNS topic, dashboard |

---

## 9. Scaling Strategy

| Service | Scaling Trigger | Min | Max |
|---|---|---|---|
| API Gateway | CPU > 70% | 2 | 5 |
| Health Checker | CPU > 60% | 2 | 4 |
| Auth Service | Manual (stateful) | 2 | 2 |
| Metrics Collector | Manual | 2 | 2 |
| Alert Manager | Manual | 2 | 2 |

---

## 10. Failure Modes & Recovery

| Failure | Detection | Recovery |
|---|---|---|
| Pod crash | K8s liveness probe fails → pod restarted | Automatic (K8s restarts pod) |
| Node failure | K8s reschedules pods to healthy nodes | Automatic (K8s) |
| Bad deployment | Readiness probe fails → traffic stopped | Manual rollback (`kubectl rollout undo`) |
| Database down | Readiness probe fails → traffic stopped | Manual (fix DB, pods auto-recover) |
| Redis down | Health checker can't publish → alerts delayed | Manual (fix Redis, health checks resume) |
| High 5xx rate | CloudWatch alarm triggers | Alert sent, team investigates |
