#!/usr/bin/env bash
# Build all Docker images for PulseBoard services
set -euo pipefail

REGISTRY="${ECR_REGISTRY:-localhost:5000}"
TAG="${IMAGE_TAG:-latest}"

SERVICES=("api-gateway" "auth-service" "health-checker" "metrics-collector" "alert-manager")

echo "Building PulseBoard Docker images..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo ""

for svc in "${SERVICES[@]}"; do
    echo "→ Building $svc..."
    docker build -t "$REGISTRY/pulseboard/$svc:$TAG" "services/$svc"
    echo "  ✅ $svc built"
    echo ""
done

echo "All images built successfully!"
echo ""
echo "To push to ECR:"
echo "  aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin $REGISTRY"
echo "  for svc in \${SERVICES[@]}; do docker push $REGISTRY/pulseboard/\$svc:$TAG; done"
