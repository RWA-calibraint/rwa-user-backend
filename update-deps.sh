#!/bin/bash

# Update dependencies in all service package.json files
for service in api-gateway auth-service admin-service asset-service payment-service; do
  if [ -f "apps/$service/package.json" ]; then
    # Update @nestjs packages to match root
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['@nestjs/common']='11.0.5'"
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['@nestjs/config']='4.0.0'"
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['@nestjs/core']='11.0.5'"
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['@nestjs/microservices']='11.0.5'"
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['@nestjs/platform-express']='11.0.5'"
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['@nestjs/swagger']='7.3.0'"
    
    # Update other common dependencies
    npx json -I -f "apps/$service/package.json" -e "this.dependencies['reflect-metadata']='0.2.1'"
  fi
done

# Install qrcode package for asset-service
cd apps/asset-service && npm install qrcode && cd ../..

# Clean install dependencies
rm -rf node_modules
npm install

# Clean and rebuild
npm run build
