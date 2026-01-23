# =====================
# BUILD STAGE
# =====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma FIRST so prisma generate can find schema
COPY prisma ./prisma

# Install dependencies (will run prisma generate safely now)
RUN npm install

# Copy rest of source
COPY . .

# Build app
RUN npm run build


# =====================
# PRODUCTION STAGE
# =====================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy prisma schema so postinstall doesn't fail
COPY --from=builder /app/prisma ./prisma

# Install production deps only
RUN npm install --omit=dev

# Copy built output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Prisma runtime client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
CMD ["node", "dist/index.js"]
