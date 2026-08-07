FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the Prisma schema before the rest of the app so this layer is cached
# independently (only invalidated when the schema changes)
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create a non-root user
RUN addgroup -S escv && adduser -S escv -G escv
USER escv

EXPOSE 8081

# Apply any pending schema migrations on boot, then start the API.
# `prisma migrate deploy` is a no-op when there are no pending migrations.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
