# Build Stage for Frontend Client
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build Stage for Backend Server
FROM node:24-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Production Environment
FROM node:24-alpine
WORKDIR /app

# Copy built code and configuration
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/prisma ./server/prisma

WORKDIR /app/server
RUN npm install --only=production
RUN npx prisma generate

# Environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"

# Start script: run migration/push, run seed (if db is new/empty), and start the server
# Note: seeding script will be written to check if users already exist to avoid duplicate seed failures.
CMD ["sh", "-c", "npx prisma db push && node dist/prisma/seed.js && node dist/src/index.js"]
