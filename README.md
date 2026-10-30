# PulseBoard

Microservices platform for real-time health monitoring, metrics collection, and alerting.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Kubernetes](https://img.shields.io/badge/k8s-ready-326CE5)
![Docker](https://img.shields.io/badge/docker-compose-2496ED)

## Overview

PulseBoard is a cloud-native microservices platform that provides real-time service health monitoring, metrics aggregation, and intelligent alerting. Built for production on Kubernetes (EKS) with a CI/CD pipeline powered by Jenkins.

## Architecture

Five core microservices work together behind an API gateway, backed by Redis and PostgreSQL, with a React frontend for dashboards.

```
                    ┌─────────────┐
                    │   Ingress   │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ API Gateway │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────┴──────┐ ┌──────┴──────┐ ┌─────┴─────┐
    │ Auth Service│ │Health Check │ │ Metrics   │
    │             │ │   er        │ │ Collector │
    └─────────────┘ └──────┬──────┘ └─────┬─────┘
                           │               │
                    ┌──────┴──────┐ ┌──────┴──────┐
                    │ Alert Mgr   │ │  Redis / PG │
                    └─────────────┘ └─────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed architecture.

## Tech Stack

| Layer | Technology |
|---|---|
| Services | Node.js 20, Express |
| Frontend | React, Vite, nginx |
| Data | PostgreSQL 16, Redis 7 |
| Orchestration | Kubernetes (EKS), Helm-ready manifests |
| CI/CD | Jenkins, GitHub Actions |
| IaC | AWS CloudFormation |
| Containers | Docker (multi-stage, non-root) |
| BI / Dashboards | Amazon QuickSight |

## Quick Start (Local Dev)

```bash
# Clone
git clone https://github.com/your-org/PulseBoard.git
cd PulseBoard

# Start everything
make up

# Or manually
docker-compose up -d

# Verify
make smoke-test
```

Services will be available at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:9080
- Auth Service: http://localhost:9081
- Health Checker: http://localhost:9082
- Metrics Collector: http://localhost:9083
- Alert Manager: http://localhost:9084

## Project Structure

```
PulseBoard/
├── services/          # 5 microservices
├── frontend/          # React dashboard
├── k8s/               # Kubernetes manifests
├── infra/             # CloudFormation templates
├── jenkins/           # Jenkins pipeline
├── scripts/           # Build & ops scripts
├── docs/              # Documentation
├── docker-compose.yml
├── Makefile
└── README.md
```

## Monitoring Dashboard

PulseBoard includes an Amazon QuickSight dashboard for real-time visualization:

- **Service Health:** Green/red status for all 5 services
- **Latency Trends:** Response time over the last hour
- **Error Rates:** 5xx errors by service
- **Resource Usage:** CPU and memory utilization
- **Alert History:** Recent alerts with severity

See [docs/quicksight-setup.md](docs/quicksight-setup.md) for setup instructions.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing](docs/contributing.md)
- [QuickSight Setup](docs/quicksight-setup.md)

## License

MIT
