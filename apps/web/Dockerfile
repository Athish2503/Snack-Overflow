FROM node:20-alpine

WORKDIR /app

# Copy manifests
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install

# Copy web source code
COPY apps/web ./apps/web/

# Next.js build
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm --workspace=apps/web run build

EXPOSE 3000

CMD ["npm", "--workspace=apps/web", "run", "start"]
