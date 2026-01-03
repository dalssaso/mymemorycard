FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files and lockfile
COPY package.json ./
COPY bun.lock ./

# Install dependencies fresh in container
RUN bun install

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY drizzle ./drizzle

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
