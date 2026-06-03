# Build Stage for Frontend Client
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build Stage for Backend Server
FROM node:24-alpine AS server-builder
# Install openssl and compatibility libraries for Prisma engine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build
# Compile database and run seeder during image build phase
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma db push --accept-data-loss && node dist/prisma/seed.js

# Production Environment
FROM node:24-alpine
# Install openssl and compatibility libraries for Prisma engine
RUN apk add --no-cache openssl libc6-compat
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

# Start the server instantly (the seeded database is already bundled in the image)
CMD ["node", "dist/src/index.js"]
