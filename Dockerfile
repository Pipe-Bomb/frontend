# Build context: repo root with tanstack-client checked out alongside.
# In CI, a second actions/checkout step places tanstack-client/ next to the website source.
# This lets us build tanstack-client locally so local changes are always reflected.

# Stage 1: Build tanstack-client
FROM node:24-bookworm-slim AS tanstack-builder

WORKDIR /tanstack
COPY tanstack-client/package*.json ./
RUN npm ci
COPY tanstack-client/ ./
RUN npm run build

# Stage 2: Install website dependencies (with local tanstack-client injected)
FROM node:24-bookworm-slim AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci
# Replace the GitHub-fetched package with the locally built one
COPY --from=tanstack-builder /tanstack/dist ./node_modules/pipe-bomb-tanstack-client/dist
COPY --from=tanstack-builder /tanstack/package.json ./node_modules/pipe-bomb-tanstack-client/package.json

# Stage 3: Build Next.js
FROM node:24-bookworm-slim AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_API_URL is baked at build time.
# The default (/api) works with the bundled nginx config.
# Override with --build-arg if deploying the frontend standalone.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 4: Minimal runtime image (requires output: 'standalone' in next.config.ts)
FROM node:24-bookworm-slim

WORKDIR /app

RUN addgroup --system pipebomb \
	&& adduser --system --ingroup pipebomb --no-create-home pipebomb

COPY --from=builder --chown=pipebomb:pipebomb /app/.next/standalone ./
COPY --from=builder --chown=pipebomb:pipebomb /app/.next/static ./.next/static
COPY --from=builder --chown=pipebomb:pipebomb /app/public ./public

USER pipebomb

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
