# PulseBoard Runbook

## Overview

This runbook covers common failure scenarios and their resolution procedures.

---

## Scenario 1: High 5xx Error Rate

**Alarm:** `pulseboard-high-5xx-rate`

**Symptoms:**
- CloudWatch alarm triggered
- Users reporting errors
- API returning 500/502/503 responses

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n pulseboard

# Check recent logs
kubectl logs -n pulseboard -l app=api-gateway --tail=50

# Check CloudWatch Logs Insights
# Query: SOURCE '/pulseboard/pulseboard' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20
```

**Resolution:**
1. Identify which service is returning 5xx (check logs)
2. If pod is crash-looping: `kubectl describe pod <pod-name> -n pulseboard`
3. If resource exhaustion: scale up `kubectl scale deployment/api-gateway --replicas=3 -n pulseboard`
4. If bad deployment: `kubectl rollout undo deployment/api-gateway -n pulseboard`
5. Verify recovery: `kubectl rollout status deployment/api-gateway -n pulseboard`

---

## Scenario 2: High Latency

**Alarm:** `pulseboard-high-latency`

**Symptoms:**
- API responses slow (> 1.5s p99)
- Users experiencing delays

**Diagnosis:**
```bash
# Check pod resource usage
kubectl top pods -n pulseboard

# Check DB connections
kubectl exec -n pulseboard deploy/api-gateway -- wget -qO- http://localhost:8080/ready

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace PulseBoard/pulseboard \
  --metric-name ApiLatency --statistics p99 --period 300 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)
```

**Resolution:**
1. If CPU high: scale up replicas
2. If DB slow: check PostgreSQL connections, add index if needed
3. If memory high: increase memory limits in deployment
4. If external dependency slow: check health checker results

---

## Scenario 3: Pod Crash Loop

**Symptoms:**
- Pod status shows `CrashLoopBackOff`
- Pod restarts repeatedly

**Diagnosis:**
```bash
# Describe the pod
kubectl describe pod <pod-name> -n pulseboard

# Check logs (including previous container)
kubectl logs <pod-name> -n pulseboard --previous

# Check events
kubectl get events -n pulseboard --sort-by='.lastTimestamp'
```

**Resolution:**
1. Check logs for error (missing env var, DB connection failure, etc.)
2. Verify secrets are mounted: `kubectl get secret pulseboard-secrets -n pulseboard -o yaml`
3. Verify configmap: `kubectl get configmap pulseboard-config -n pulseboard -o yaml`
4. If resource limits too low: increase in deployment manifest
5. If image pull failure: check ECR permissions and image tag

---

## Scenario 4: Health Checker Not Reporting

**Symptoms:**
- No health results in Redis
- Alert Manager not receiving messages
- Services show "unknown" status

**Diagnosis:**
```bash
# Check health checker pod
kubectl get pods -n pulseboard -l app=health-checker

# Check Redis connectivity
kubectl exec -n pulseboard deploy/health-checker -- wget -qO- http://localhost:8082/ready

# Check Redis pub/sub
kubectl exec -n pulseboard deploy/redis -- redis-cli PUBSUB CHANNELS
```

**Resolution:**
1. Restart health checker: `kubectl rollout restart deployment/health-checker -n pulseboard`
2. Verify Redis is running: `kubectl get pods -n pulseboard -l app=redis`
3. Check REDIS_URL in configmap
4. Verify network policy allows health-checker → redis traffic

---

## Scenario 5: Full Rollback

**When:** A bad deployment needs to be reverted immediately.

**Procedure:**
```bash
# Rollback all services
kubectl rollout undo deployment/api-gateway -n pulseboard
kubectl rollout undo deployment/auth-service -n pulseboard
kubectl rollout undo deployment/health-checker -n pulseboard
kubectl rollout undo deployment/metrics-collector -n pulseboard
kubectl rollout undo deployment/alert-manager -n pulseboard

# Verify rollback
kubectl rollout status deployment/api-gateway -n pulseboard
kubectl get pods -n pulseboard

# Run smoke test
./scripts/smoke-test.sh
```

**Post-rollback:**
1. Identify the bad commit from Jenkins build
2. Fix the issue in a new commit
3. Let Jenkins pipeline deploy the fix
4. Document the incident in the runbook

---

## Scenario 6: Database Connection Failure

**Symptoms:**
- Readiness probes failing
- Services returning 503
- Logs show "connection refused" or "timeout"

**Diagnosis:**
```bash
# Check PostgreSQL pod
kubectl get pods -n pulseboard -l app=postgres

# Check DB connectivity from a service pod
kubectl exec -n pulseboard deploy/api-gateway -- \
  wget -qO- http://localhost:8080/ready

# Check PostgreSQL logs
kubectl logs -n pulseboard -l app=postgres --tail=50
```

**Resolution:**
1. If pod crashed: K8s will auto-restart. Wait 30s.
2. If PVC issue: check `kubectl get pvc -n pulseboard`
3. If connection pool exhausted: restart the affected service
4. If data corruption: restore from backup

---

## Emergency Contacts

| Role | Contact | When To Escalate |
|---|---|---|
| On-call engineer | cijostany6@gmail.com | Any production issue |
| AWS support | AWS Console → Support | Infrastructure issues |
| DNS/Domain | Registrar dashboard | Domain not resolving |

---

## Useful Commands Cheat Sheet

```bash
# Pod status
kubectl get pods -n pulseboard -o wide

# Service endpoints
kubectl get svc -n pulseboard

# Ingress status
kubectl get ingress -n pulseboard

# HPA status
kubectl get hpa -n pulseboard

# Network policies
kubectl get networkpolicy -n pulseboard

# Recent events
kubectl get events -n pulseboard --sort-by='.lastTimestamp' | tail -20

# Pod logs (follow)
kubectl logs -f deployment/api-gateway -n pulseboard

# Exec into pod
kubectl exec -it deployment/api-gateway -n pulseboard -- /bin/sh

# Scale manually
kubectl scale deployment/api-gateway --replicas=3 -n pulseboard

# Force restart
kubectl rollout restart deployment/api-gateway -n pulseboard

# Check rollout history
kubectl rollout history deployment/api-gateway -n pulseboard
```
