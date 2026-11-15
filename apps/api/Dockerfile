FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy manifests
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY apps/api/prisma ./apps/api/prisma/
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Copy API source code
COPY apps/api ./apps/api/

# Build TypeScript
RUN npm --workspace=apps/api run build

EXPOSE 4000

# Runtime configuration is strictly injected via environment variables at container launch
CMD ["sh", "-c", "npx prisma db push --schema=apps/api/prisma/schema.prisma --accept-data-loss && node apps/api/dist/server.js"]
