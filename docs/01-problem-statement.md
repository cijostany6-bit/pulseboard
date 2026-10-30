# 01 · Problem Statement — PulseBoard

**Status:** 🟡 Draft v0.1 · **Owner:** Cijo Stany John · **Started:** 2026-10-30
**Codename:** `PulseBoard`

---

## 1. One-line summary

A self-hosted, real-time infrastructure health monitoring platform that continuously
checks service health, collects metrics, and alerts teams when something breaks —
built for small teams that can't afford Datadog or PagerDuty.

---

## 2. The Problem

Most small engineering teams run multiple microservices but have **no visibility** into
whether those services are actually healthy. They find out something is broken when a
customer complains or when a downstream system fails.

### What's Broken Today

| Pain Point | Impact |
|---|---|
| **No health visibility** | Services can be down for hours before anyone notices |
| **No alerting** | Teams rely on manual checks or customer reports |
| **Expensive tools** | Datadog, PagerDuty, New Relic cost $15-50/host/month — too much for small teams |
| **Complex setup** | Enterprise monitoring requires dedicated SREs to configure and maintain |
| **Siloed data** | Logs in one place, metrics in another, alerts in a third |
| **No rollback visibility** | When a deploy breaks something, there's no clear signal of what changed |

### Who Faces This Problem

- **Small engineering teams** (2-10 developers) running microservices on Kubernetes
- **Startups** that need production-grade monitoring without enterprise pricing
- **DevOps engineers** who want to demonstrate operational maturity in interviews
- **Freelancers/consultants** managing multiple client environments

---

## 3. Why Existing Solutions Don't Work For Small Teams

| Solution | Problem |
|---|---|
| **Datadog** | $15-23/host/month. A 5-service setup costs $75-115/month. Too expensive for small teams. |
| **PagerDuty** | $21/user/month. Alerting only — no metrics, no logs, no dashboards. |
| **New Relic** | Free tier is limited. Full observability requires paid tier at $99+/month. |
| **Prometheus + Grafana** | Free but requires self-hosting, configuration, and maintenance. Steep learning curve. |
| **AWS CloudWatch** | Good but scattered. No unified "health dashboard" out of the box. Alarms are per-metric, not per-service. |
| **Manual checking** | `curl` in a cron job. No history, no trends, no alerting. |

---

## 4. What PulseBoard Solves

PulseBoard provides a **unified, self-hosted health monitoring platform** that:

1. **Continuously checks** the health of all registered services (HTTP endpoints)
2. **Collects metrics** (CPU, memory, response time) from each service
3. **Aggregates** health status and metrics into a single dashboard
4. **Alerts** teams via Slack/Email when services go unhealthy or breach thresholds
5. **Stores history** so teams can see trends and patterns over time
6. **Runs on Kubernetes** with auto-scaling, so it scales with your infrastructure

---

## 5. Target Audience

| Audience | Need |
|---|---|
| Small engineering teams | Affordable, self-hosted monitoring |
| DevOps engineers | Portfolio project demonstrating operational skills |
| Startups | Production-grade monitoring without enterprise pricing |
| Interview candidates | A project that shows "I know how to run systems, not just deploy them" |

---

## 6. Success Criteria

| # | Criteria | How We Verify |
|---|---|---|
| S1 | All 5 services report health status | Health checker returns healthy for all |
| S2 | Unhealthy service triggers alert within 60 seconds | Alert manager sends notification |
| S3 | Metrics are collected and queryable | Metrics API returns data |
| S4 | Dashboard shows real-time service health | Frontend renders health status |
| S5 | System survives a pod restart without data loss | K8s recreates pod, health checks resume |
| S6 | Rolling update deploys new version with zero downtime | `kubectl rollout status` succeeds, no 5xx spike |
| S7 | Rollback works | `kubectl rollout undo` restores previous version |
| S8 | All services run as non-root with least privilege | K8s security context verified |
| S9 | CI/CD pipeline builds, pushes, and deploys automatically | Jenkins pipeline succeeds end-to-end |
| S10 | Observability shows logs, metrics, and alarms | CloudWatch dashboard renders data |

---

## 7. Non-Goals (v1)

- No multi-tenancy (single team/organization)
- No custom alerting rules UI (hardcoded rules in v1)
- No mobile app (web dashboard only)
- No PagerDuty/Slack integration beyond basic webhook (v2)
- No distributed tracing (v2)
- No log aggregation across services (CloudWatch handles this)

---

## 8. Open Questions

| # | Question | Status |
|---|---|---|
| Q1 | Should health checker use active polling or passive (service pushes health)? | ⏳ Active polling for v1 |
| Q2 | Redis vs SQS for message queue? | ⏳ Redis for local dev, SQS for production option |
| Q3 | PostgreSQL vs DynamoDB for metrics storage? | ⏳ PostgreSQL for relational queries |
| Q4 | Should we support custom health check endpoints per service? | ⏳ Yes, configurable URL |
| Q5 | Alert channels beyond Slack/Email? | ⏳ Slack + Email for v1 |
