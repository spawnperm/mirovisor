# Multi-stage production build for Mirovisor
# Stage 1: Build frontend assets and server bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build
RUN npx esbuild server.ts --bundle --platform=node --target=node20 --format=esm --packages=external --outfile=server.mjs

# Stage 2: Production runtime with Node.js & Express API Gateway (Non-root user)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets and server bundle
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs

# Harden container with unprivileged user
USER node

EXPOSE 3000
CMD ["node", "server.mjs"]
