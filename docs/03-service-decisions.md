# 03 · Service Decisions — PulseBoard

**Status:** 🟡 Draft v0.1

---

## Decision 1: Node.js vs Go / Java / Python

| Aspect | Node.js (Chosen) | Go | Java (Spring Boot) | Python (FastAPI) |
|---|---|---|---|---|
| **Startup time** | Fast (~1s) | Very fast (~0.1s) | Slow (~5-10s) | Fast (~1-2s) |
| **Memory footprint** | ~50MB | ~10MB | ~200MB+ | ~50MB |
| **Concurrency** | Event loop (single-threaded, async) | Goroutines (lightweight threads) | Thread pool | Asyncio (single-threaded) |
| **Ecosystem** | Massive (npm) | Growing | Mature (Spring) | Large (pip) |
| **Learning curve** | Low (JS is universal) | Medium | High | Low |
| **Container image size** | ~150MB (Alpine) | ~10MB (scratch) | ~300MB+ | ~150MB (Alpine) |
| **Team familiarity** | High (JS is everywhere) | Medium | High (enterprise) | High (data/ML) |

**Decision: Node.js**

**Why:** The user already knows JavaScript from GameHub. Using Node.js means zero context switching. The event loop is perfect for I/O-bound services (health checking, proxying, alerting). Container images are small enough on Alpine. The npm ecosystem has everything we need (express, ioredis, pg, axios).

**Why not Go:** Better performance and smaller images, but steeper learning curve and less familiarity. Would be a better choice for a high-throughput production system, but overkill for v1.

**Why not Java:** Too heavy for microservices. Spring Boot startup time and memory footprint are significant. Better suited for enterprise monoliths.

**Why not Python:** Good for data/ML but less ideal for high-concurrency I/O services. FastAPI is great but the ecosystem for K8s operators is smaller.

---

## Decision 2: Redis vs SQS / RabbitMQ / Kafka

| Aspect | Redis (Chosen) | AWS SQS | RabbitMQ | Kafka |
|---|---|---|---|---|
| **Setup complexity** | Low (single container) | Low (managed) | Medium | High |
| **Latency** | Sub-ms | ~10-50ms | ~1-5ms | ~5-20ms |
| **Persistence** | Optional (RDB/AOF) | Durable (managed) | Durable | Durable |
| **Pub/Sub** | Native | Via SNS | Native | Native |
| **Cost** | Free (self-hosted) | Pay per request | Free (self-hosted) | Expensive (managed) |
| **Local dev** | docker-compose (1 line) | Needs AWS account | docker-compose | docker-compose (heavy) |
| **Scaling** | Manual (cluster mode) | Automatic (managed) | Manual (cluster) | Manual (complex) |

**Decision: Redis**

**Why:** Redis gives us both pub/sub (for event-driven health results) and caching in one service. It's trivial to run locally via docker-compose. For v1, we don't need the durability guarantees of SQS or the throughput of Kafka. Redis pub/sub is more than sufficient for health check results.

**Why not SQS:** Would add AWS dependency for local dev. Health check results don't need durable queuing — if a result is lost, the next check (30s later) will re-publish.

**Why not RabbitMQ:** More complex to configure. Redis is simpler and does everything we need.

**Why not Kafka:** Massive overkill. Kafka is for high-throughput event streaming (millions of events/sec). We're publishing ~10 health results per minute.

---

## Decision 3: PostgreSQL vs DynamoDB / MongoDB

| Aspect | PostgreSQL (Chosen) | DynamoDB | MongoDB |
|---|---|---|---|
| **Query flexibility** | Full SQL (joins, aggregations, window functions) | Limited (partition key + sort key) | Flexible (document queries) |
| **Schema** | Strict (migrations) | Schemaless | Schemaless |
| **Transactions** | ACID (full) | ACID (single table) | ACID (multi-doc, since 4.0) |
| **Cost** | Free (self-hosted) or RDS (~$15/month) | Pay per request (free tier: 25GB) | Free (self-hosted) or Atlas |
| **Local dev** | docker-compose (1 line) | DynamoDB Local (Java) | docker-compose (1 line) |
| **Relational data** | Native (foreign keys, joins) | No (denormalize everything) | No (embed or reference) |
| **Time-series queries** | Good (with indexes) | Good (with sort key) | Good (with indexes) |

**Decision: PostgreSQL**

**Why:** Our data is inherently relational (users → services → metrics → alerts). We need joins for dashboard queries (e.g., "show me all unhealthy services with their latest metrics"). PostgreSQL handles this natively. It's also the most common database in German enterprise environments.

**Why not DynamoDB:** Would require denormalizing all data. Querying "all metrics for service X in the last hour" requires a GSI. Overkill for our data model.

**Why not MongoDB:** Schemaless is nice for prototyping but makes data integrity harder. PostgreSQL's strict schema + migrations give us confidence in data correctness.

---

## Decision 4: EKS vs ECS / Fargate

| Aspect | EKS (Chosen) | ECS (EC2) | Fargate |
|---|---|---|---|
| **Orchestration** | Kubernetes (industry standard) | AWS proprietary | AWS proprietary |
| **Portability** | High (K8s runs anywhere) | Low (AWS only) | Low (AWS only) |
| **Learning value** | Very high (K8s is universal) | Medium | Low |
| **Cost** | Control plane: $0.10/hr (~$73/month) | Free (EC2 cost only) | Pay per task (~$0.04/vCPU/hr) |
| **Complexity** | High (K8s learning curve) | Medium | Low |
| **Auto-scaling** | HPA (metrics-based) | Service Auto Scaling | Built-in |
| **Ecosystem** | Massive (Helm, operators, CRDs) | AWS-only tools | AWS-only tools |

**Decision: EKS**

**Why:** Kubernetes is the industry standard for container orchestration. Learning EKS gives skills that transfer to any cloud (GKE, AKS) or on-prem. German companies heavily use Kubernetes. The control plane cost ($73/month) is acceptable for a portfolio project that will be torn down after testing.

**Why not ECS:** AWS-specific. Skills don't transfer. Less impressive on a CV.

**Why not Fargate:** Even more AWS-specific. Hides the infrastructure. For a learning project, we want to see and control the nodes.

---

## Decision 5: Jenkins vs GitHub Actions / GitLab CI

| Aspect | Jenkins (Chosen) | GitHub Actions | GitLab CI |
|---|---|---|---|
| **Self-hosted** | Yes (on EC2) | No (managed) | No (managed) |
| **Learning value** | High (enterprise standard) | Medium | Medium |
| **Configuration** | Jenkinsfile (Groovy) | YAML | YAML |
| **Plugin ecosystem** | Massive (1800+ plugins) | Growing | Built-in |
| **Cost** | Free (self-hosted on EC2) | Free (2000 min/month) | Free (400 min/month) |
| **Chennai market** | Very high (most companies use Jenkins) | Growing | Low |
| **Germany market** | High (enterprise standard) | Growing | Medium |

**Decision: Jenkins**

**Why:** Jenkins is the most widely used CI/CD tool in both Chennai and German enterprise environments. Self-hosting on EC2 gives full control. The Jenkinsfile approach (pipeline as code) is a skill that transfers to any Jenkins installation. The plugin ecosystem covers everything we need (Docker, Kubernetes, AWS, ECR).

**Why not GitHub Actions:** Easier to set up but less impressive. Most freshers use GitHub Actions. Jenkins shows you can handle enterprise CI/CD.

**Why not GitLab CI:** Less common in both Chennai and German markets. Smaller plugin ecosystem.

---

## Decision 6: CloudFormation vs Terraform

| Aspect | CloudFormation (Chosen) | Terraform |
|---|---|---|
| **Provider** | AWS native | HashiCorp (multi-cloud) |
| **Language** | YAML/JSON | HCL |
| **State management** | AWS-managed (no state file) | Manual (state file in S3) |
| **Drift detection** | Built-in | `terraform plan` |
| **Rollback** | Automatic (stack rollback) | Manual |
| **Learning value** | High (AWS-specific) | Very high (multi-cloud) |
| **Chennai market** | Medium | High |
| **Germany market** | Medium | Very high |

**Decision: CloudFormation**

**Why:** AWS-native. No state file to manage. Automatic rollback on failure. The user already has experience with CloudFormation from GameHub. Consistency across portfolio projects is valuable.

**Why not Terraform:** Multi-cloud is great but adds complexity (state management, provider versions). For an AWS-focused portfolio, CloudFormation is the cleaner choice. The user can learn Terraform later.

---

## Decision 7: CloudWatch vs Prometheus + Grafana

| Aspect | CloudWatch (Chosen) | Prometheus + Grafana |
|---|---|---|
| **Setup** | AWS-managed (zero setup) | Self-hosted (Prometheus + Grafana + alertmanager) |
| **Cost** | Free tier (5GB logs, 10 metrics) | Free (self-hosted) |
| **Integration** | Native AWS (Lambda, ECS, EKS, EC2) | Requires exporters |
| **Dashboards** | Basic (CloudWatch Dashboards) | Excellent (Grafana) |
| **Alerting** | CloudWatch Alarms + SNS | Alertmanager (flexible) |
| **Learning value** | High (AWS-specific) | Very high (industry standard) |

**Decision: CloudWatch**

**Why:** Zero setup. Native AWS integration. The user already has CloudWatch experience from GameHub. For v1, CloudWatch provides everything needed (logs, metrics, alarms, dashboards). Prometheus + Grafana can be added in v2.

**Why not Prometheus + Grafana:** More impressive but adds significant complexity (Prometheus server, Grafana, alertmanager, node exporters). For a portfolio project, CloudWatch is sufficient and shows AWS-native skills.

---

## Decision 8: NGINX Ingress vs ALB Ingress

| Aspect | NGINX Ingress (Chosen) | ALB Ingress Controller |
|---|---|---|---|
| **Cost** | Free (runs on cluster) | ~$16/month (ALB cost) |
| **Features** | Full NGINX (rewrites, rate limiting, auth) | AWS-native (WAF, Shield) |
| **Portability** | High (K8s standard) | Low (AWS only) |
| **Learning value** | High (K8s standard) | Medium (AWS-specific) |
| **Complexity** | Low (Helm install) | Medium (IAM, IRSA setup) |

**Decision: NGINX Ingress**

**Why:** Free (runs inside the cluster). Full NGINX feature set. Portable (works on any K8s cluster). Standard choice for most K8s deployments. The user can learn ALB Ingress later if needed.

**Why not ALB Ingress:** Adds AWS cost and complexity. For a portfolio project, NGINX Ingress is sufficient and more portable.

---

## Summary Table

| Decision | Choice | Key Reason |
|---|---|---|
| Language/Runtime | Node.js | User familiarity, event loop for I/O |
| Message Queue | Redis | Simplicity, pub/sub + cache in one |
| Database | PostgreSQL | Relational data, SQL flexibility |
| Orchestration | EKS (Kubernetes) | Industry standard, portable |
| CI/CD | Jenkins | Enterprise standard, self-hosted |
| IaC | CloudFormation | AWS-native, no state file |
| Observability | CloudWatch | Zero setup, native AWS |
| Ingress | NGINX | Free, portable, full features |
