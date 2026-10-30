# PulseBoard — Architecture Diagrams

This document collects all architecture diagrams for **PulseBoard**, a real-time infrastructure health monitoring platform. Each diagram is provided as a [Mermaid](https://mermaid.js.org/) diagram (rendered automatically on GitHub/GitLab) plus a short explanation.

**Services covered:**
- API Gateway (Node.js + Express) — routing & auth enforcement
- Auth Service (Node.js + JWT) — user authentication
- Health Checker (Node.js) — periodic service pings, publishes results
- Metrics Collector (Node.js) — CPU, memory, response time
- Alert Manager (Node.js) — consumes health results, triggers alerts
- Frontend (React dashboard)
- Message Queue (Redis)
- Database (PostgreSQL / DynamoDB)
- Observability (CloudWatch)

---

## Table of Contents

1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [CI/CD Pipeline Flow](#2-cicd-pipeline-flow)
3. [Event-Driven Flow](#3-event-driven-flow)
4. [Kubernetes Deployment Architecture](#4-kubernetes-deployment-architecture)
5. [Data Flow Diagram](#5-data-flow-diagram)
6. [Security Architecture](#6-security-architecture)

---

## 1. System Architecture Diagram

High-level view of every PulseBoard component and how they connect at runtime.

```mermaid
flowchart LR
  subgraph Client["Client Layer"]
    U[User / Browser]
    FE[React Dashboard]
  end

  subgraph Edge["Edge / Ingress"]
    LB[Load Balancer / Ingress]
  end

  subgraph Cluster["Kubernetes Cluster (EKS)"]
    GW[API Gateway<br/>Node.js + Express]
    AUTH[Auth Service<br/>Node.js + JWT]
    HC[Health Checker<br/>Node.js]
    MC[Metrics Collector<br/>Node.js]
    AM[Alert Manager<br/>Node.js]
  end

  subgraph Data["Data & Messaging"]
    R[(Redis<br/>Message Queue)]
    DB[(PostgreSQL /<br/>DynamoDB)]
  end

  subgraph Obs["Observability"]
    CW[CloudWatch<br/>Logs / Metrics / Alarms]
  end

  subgraph Targets["Registered Target Services"]
    TS[External services<br/>being monitored]
  end

  U --> FE
  FE --> LB
  LB --> GW
  GW --> AUTH
  GW --> HC
  GW --> MC
  GW --> AM
  HC -->|ping| TS
  HC -->|publish health result| R
  R -->|consume| AM
  MC -->|store metrics| DB
  AM -->|persist alerts| DB
  GW -->|read / write| DB
  AUTH -->|users / sessions| DB
  HC -.->|telemetry| CW
  MC -.->|telemetry| CW
  AM -.->|telemetry| CW
  GW -.->|telemetry| CW
```

**Explanation:** Users interact with the React dashboard, which reaches the cluster through a load balancer / ingress. The API Gateway is the single entry point and delegates to the Auth Service for JWT validation and to the other services for domain work. The Health Checker pings registered target services and publishes results to Redis; the Alert Manager consumes those events and persists alerts. Metrics Collector writes CPU/memory/response-time data to the database. CloudWatch receives telemetry from every service for observability.

---

## 2. CI/CD Pipeline Flow

Jenkins-driven pipeline from commit to verified deployment on EKS.

```mermaid
flowchart TD
  A[Developer Push / Pull Request] --> B[Jenkins Pipeline Triggered]
  B --> C[Checkout Source Code]
  C --> D[Install Dependencies & Lint]
  D --> E[Build Docker Images<br/>5 services + frontend]
  E --> F[Run Unit & Integration Tests]
  F -->|pass| G[Push Images to Amazon ECR]
  F -->|fail| X[Fail Build & Notify Team]
  G --> H[Update K8s Manifests / Helm Charts]
  H --> I[Deploy to EKS<br/>kubectl apply / helm upgrade]
  I --> J[Rolling Update of Deployments]
  J --> K[Smoke Tests & Health Checks]
  K -->|pass| L[Mark Release Verified]
  K -->|fail| M[Rollback to Previous Revision]
  L --> N[Notify Team / CloudWatch]
  M --> N
```

**Explanation:** Every change triggers Jenkins, which lints, builds container images for all services, and runs tests. On success images are pushed to Amazon ECR and Kubernetes manifests are updated. Jenkins then rolls out the new images to EKS and runs smoke tests; a failure triggers an automatic rollback to the previous revision. Notifications and deployment status are reported to the team and CloudWatch.

---

## 3. Event-Driven Flow

How a health check result travels from the Health Checker to a notification.

```mermaid
sequenceDiagram
  participant HC as Health Checker
  participant TS as Target Services
  participant R as Redis (Message Queue)
  participant AM as Alert Manager
  participant DB as Database
  participant N as Notification Channel

  HC->>TS: Periodic health ping (HTTP / TCP)
  TS-->>HC: Response or timeout
  HC->>HC: Evaluate status + latency
  HC->>R: Publish health result event
  R-->>AM: Deliver event
  AM->>DB: Load thresholds & alert rules
  AM->>AM: Compare result vs thresholds
  alt Threshold breached
    AM->>N: Trigger alert (email / Slack / webhook)
    AM->>DB: Persist alert record
  else Healthy
    AM->>DB: Update last-known status
  end
```

**Explanation:** The Health Checker periodically pings each registered target service and evaluates the response. It publishes a health result event to Redis. The Alert Manager consumes the event, loads the configured thresholds and rules from the database, and compares. If a threshold is breached it triggers a notification through the configured channel and stores the alert; otherwise it simply updates the last-known healthy status.

---

## 4. Kubernetes Deployment Architecture

How PulseBoard services are deployed and scaled on Kubernetes.

```mermaid
flowchart TB
  subgraph Internet
    User[User]
  end

  subgraph Cluster["EKS Cluster"]
    subgraph IngressLayer["Ingress Layer"]
      ING[Ingress Controller<br/>nginx / ALB]
    end

    subgraph AppNS["Namespace: pulseboard (application)"]
      SVC_FE[Service: frontend]
      SVC_GW[Service: api-gateway]
      SVC_AUTH[Service: auth-service]
      SVC_HC[Service: health-checker]
      SVC_MC[Service: metrics-collector]
      SVC_AM[Service: alert-manager]

      DEP_FE[Deployment: frontend]
      DEP_GW[Deployment: api-gateway]
      DEP_AUTH[Deployment: auth-service]
      DEP_HC[Deployment: health-checker]
      DEP_MC[Deployment: metrics-collector]
      DEP_AM[Deployment: alert-manager]

      HPA_GW[HPA: api-gateway]
      HPA_HC[HPA: health-checker]
      HPA_MC[HPA: metrics-collector]
    end

    subgraph DataNS["Namespace: data"]
      REDIS[StatefulSet: redis]
      PG[StatefulSet: postgres]
    end
  end

  User --> ING
  ING --> SVC_FE
  ING --> SVC_GW

  SVC_FE --> DEP_FE
  SVC_GW --> DEP_GW
  SVC_AUTH --> DEP_AUTH
  SVC_HC --> DEP_HC
  SVC_MC --> DEP_MC
  SVC_AM --> DEP_AM

  HPA_GW -.->|scale| DEP_GW
  HPA_HC -.->|scale| DEP_HC
  HPA_MC -.->|scale| DEP_MC

  DEP_GW --> SVC_AUTH
  DEP_GW --> SVC_HC
  DEP_GW --> SVC_MC
  DEP_GW --> SVC_AM
  DEP_HC --> REDIS
  DEP_AM --> REDIS
  DEP_MC --> PG
  DEP_AM --> PG
  DEP_GW --> PG
  DEP_AUTH --> PG
```

**Explanation:** An ingress controller exposes the frontend and API Gateway. Each microservice runs as a Deployment fronted by a ClusterIP Service. Horizontal Pod Autoscalers (HPA) scale the API Gateway, Health Checker, and Metrics Collector based on CPU/memory. Redis and PostgreSQL run as StatefulSets in a dedicated data namespace. Services communicate internally via DNS; only the ingress is public.

---

## 5. Data Flow Diagram

End-to-end flow of data from the user through the system and into storage.

```mermaid
flowchart LR
  U[User] --> FE[React Frontend]
  FE -->|HTTPS request| GW[API Gateway]
  GW -->|verify JWT| AUTH[Auth Service]
  AUTH -->|user / session data| DB[(Database)]
  GW -->|read / write domain data| DB

  HC[Health Checker] -->|ping| TS[Target Services]
  HC -->|publish result| R[(Redis)]
  R -->|consume event| AM[Alert Manager]
  AM -->|persist alert| DB
  AM -->|notify| N[Notification Channel]

  MC[Metrics Collector] -->|store metrics| DB
  MC -->|metrics stream| CW[CloudWatch]

  GW -->|logs / metrics| CW
  HC -->|logs / metrics| CW
  AM -->|logs / metrics| CW
```

**Explanation:** User requests enter through the frontend and API Gateway, which verifies identity via the Auth Service (backed by the database). Domain reads/writes go to the database. In parallel, the Health Checker pings target services and streams results through Redis to the Alert Manager, which persists alerts and notifies. The Metrics Collector stores performance metrics in the database and emits them to CloudWatch; all services also emit logs/metrics to CloudWatch.

---

## 6. Security Architecture

Network policies, RBAC, secrets management, and audit controls.

```mermaid
flowchart TB
  subgraph Edge["Edge Security"]
    WAF[WAF / Rate Limiting]
    TLS[TLS Termination at Ingress]
  end

  subgraph Network["Network Segmentation"]
    NP[NetworkPolicies<br/>pod-to-pod allow-list]
    PRIV[Private Subnets<br/>for data tier]
  end

  subgraph Identity["Identity & Access"]
    JWT[JWT Authentication<br/>Auth Service]
    MFA[MFA + Password Policy]
    RBAC[Kubernetes RBAC<br/>Roles / ClusterRoles]
    SA[ServiceAccounts<br/>per workload]
  end

  subgraph Secrets["Secrets & Encryption"]
    K8SSEC[Kubernetes Secrets]
    AWSSEC[AWS Secrets Manager /<br/>SSM Parameter Store]
    KMS[KMS Encryption<br/>at rest & in transit]
  end

  subgraph Audit["Audit & Compliance"]
    CT[CloudTrail]
    CW[CloudWatch Logs / Alarms]
    PSS[Pod Security Standards]
    IMG[Image Scanning<br/>in CI/CD]
  end

  WAF --> TLS
  TLS --> NP
  NP --> PRIV
  PRIV --> Identity
  Identity --> Secrets
  Secrets --> Audit
```

**Explanation:** Traffic is filtered by a WAF and terminated with TLS at the ingress. NetworkPolicies restrict pod-to-pod traffic to an explicit allow-list, and the data tier sits in private subnets. Identity is enforced via JWT auth with MFA, Kubernetes RBAC, and per-workload ServiceAccounts. Secrets are stored in Kubernetes Secrets backed by AWS Secrets Manager / SSM Parameter Store and encrypted with KMS. Audit and compliance are provided by CloudTrail, CloudWatch, Pod Security Standards, and image scanning in the CI/CD pipeline.

---

*Generated for the PulseBoard project. See `00-diagram-index.md` for the diagram index.*
