#!/usr/bin/env bash
# Smoke test for PulseBoard
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
NAMESPACE="${NAMESPACE:-pulseboard}"

echo "Running PulseBoard smoke tests..."
echo "Base URL: $BASE_URL"
echo ""

# Test 1: API Gateway health
echo "→ Testing API Gateway health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ API Gateway healthy (HTTP $HTTP_CODE)"
else
    echo "  ❌ API Gateway unhealthy (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 2: Auth service health (via gateway)
echo "→ Testing Auth Service..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Auth Service healthy (HTTP $HTTP_CODE)"
else
    echo "  ❌ Auth Service unhealthy (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 3: Health Checker
echo "→ Testing Health Checker..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8082/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Health Checker healthy (HTTP $HTTP_CODE)"
else
    echo "  ❌ Health Checker unhealthy (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 4: Metrics Collector
echo "→ Testing Metrics Collector..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8083/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Metrics Collector healthy (HTTP $HTTP_CODE)"
else
    echo "  ❌ Metrics Collector unhealthy (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 5: Alert Manager
echo "→ Testing Alert Manager..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8084/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Alert Manager healthy (HTTP $HTTP_CODE)"
else
    echo "  ❌ Alert Manager unhealthy (HTTP $HTTP_CODE)"
    exit 1
fi

echo ""
echo "All smoke tests passed! ✅"
