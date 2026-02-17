#!/bin/bash

echo "🚀 Deploying all microservices to Vercel..."
echo "============================================"

npm run build:all

SERVICES=("api-gateway" "asset-service" "auth-service" "payment-service")

for service in "${SERVICES[@]}"; do
  echo ""
  echo "📦 Deploying $service..."
  echo "----------------------------------------"
  cd "apps/$service"
  vercel --prod --yes
  cd ../..
  echo "✅ $service deployed"
done

echo ""
echo "============================================"
echo "🎉 All services deployed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  Auth:    https://rwa-auth-service.vercel.app"
echo "  Payment: https://rwa-payment-service.vercel.app"
echo "  Asset:   https://rwa-asset-service.vercel.app"
echo "  Gateway: https://rwa-api-gateway.vercel.app"
echo "============================================"