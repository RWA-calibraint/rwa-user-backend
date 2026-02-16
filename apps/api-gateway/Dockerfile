# Use a lightweight Node.js base image for building
FROM public.ecr.aws/docker/library/node:22-alpine AS builder

# Use apk for Alpine Linux
RUN apk add --no-cache qpdf

# Set working directory
WORKDIR /usr/src/app

# Copy package.json files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application (Nest CLI should now be available)
RUN npm run build

# Use a separate runtime stage for a smaller final image
FROM public.ecr.aws/docker/library/node:22-alpine AS runtime

# Use apk for Alpine Linux
RUN apk add --no-cache qpdf

# Set working directory
WORKDIR /usr/src/app

# Copy only necessary files from the builder stage
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Ensure the .env file is copied with correct permissions
# COPY .env ./
# RUN chmod 644 .env

# Expose necessary ports
EXPOSE 3000

# Set environment variables correctly
ENV NODE_ENV=production

# Start the NestJS application
CMD ["node", "dist/main.js"]
