#!/usr/bin/env bash
# Tear down PulseBoard
set -euo pipefail

echo "Tearing down PulseBoard..."

# Stop docker-compose
if [ -f docker-compose.yml ]; then
    echo "→ Stopping docker-compose..."
    docker-compose down -v --remove-orphans 2>/dev/null || true
fi

# Delete K8s resources
if command -v kubectl &> /dev/null; then
    echo "→ Deleting K8s resources..."
    kubectl delete namespace pulseboard --ignore-not-found=true 2>/dev/null || true
fi

# Remove built images
echo "→ Removing Docker images..."
docker images --format '{{.Repository}}:{{.Tag}}' | grep pulseboard | xargs -r docker rmi 2>/dev/null || true

echo ""
echo "PulseBoard torn down. ✅"
