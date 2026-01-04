FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files and lockfile
COPY package.json ./
COPY bun.lock ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY drizzle ./drizzle

RUN DEBIAN_FRONTEND=noninteractive apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
