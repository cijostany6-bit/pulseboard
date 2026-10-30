# Diagram Index — PulseBoard

All architecture and flow diagrams for the PulseBoard platform.

| # | Diagram | File | Description |
|---|---|---|---|
| 1 | **System Architecture** | `01-architecture-diagrams.md` (Section 1) | High-level overview of all services, data stores, and external integrations |
| 2 | **CI/CD Pipeline Flow** | `01-architecture-diagrams.md` (Section 2) | Jenkins pipeline from Git push to deployed EKS |
| 3 | **Event-Driven Flow** | `01-architecture-diagrams.md` (Section 3) | Health Checker → Redis → Alert Manager → Notification |
| 4 | **Kubernetes Deployment** | `01-architecture-diagrams.md` (Section 4) | K8s resources: Deployments, Services, Ingress, HPA, Network Policies |
| 5 | **Data Flow** | `01-architecture-diagrams.md` (Section 5) | How data flows through the system from user to database |
| 6 | **Security Architecture** | `01-architecture-diagrams.md` (Section 6) | Network policies, RBAC, secrets, IAM |

## Additional Documentation

| Document | Description |
|---|---|
| `01-problem-statement.md` | Problem, pain points, target audience, success criteria |
| `02-solution-architecture.md` | Solution overview, service breakdown, communication patterns, data model, deployment, security, observability |
| `03-service-decisions.md` | Why Node.js, Redis, PostgreSQL, EKS, Jenkins, CloudFormation, CloudWatch, NGINX |
| `decisions.md` | 8 ADRs with context, decision, consequences, rejected alternatives, cost |
| `glossary.md` | All abbreviations used in the project |
| `runbook.md` | Operational procedures for common failures |

## Diagram Tools

All diagrams are written in **Mermaid** syntax, which renders natively in:
- GitHub (markdown preview)
- VS Code (with Mermaid extension)
- Notion, Confluence, and other markdown tools

To render locally, use the [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli):
```bash
npx @mermaid-js/mermaid-cli -i docs/01-architecture-diagrams.md -o docs/diagrams.png
```
