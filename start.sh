#!/bin/bash

echo "GameList - Starting Development Environment"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
	echo "ERROR: Docker is not running. Please start Docker and try again."
	exit 1
fi

echo "Docker is running"
echo ""

# Start PostgreSQL and Redis
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo ""
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check PostgreSQL health
docker-compose ps postgres

echo ""
echo "Database Status:"
docker-compose exec -T postgres pg_isready -U gamelist

echo ""
echo "Next steps:"
echo ""
echo "1. Backend: cd backend && bun run dev"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Or start everything with Docker:"
echo "docker-compose up -d"
echo ""
echo "Access the app at: http://localhost:5173"
echo "Backend API at: http://localhost:3000"
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
	echo "❌ Docker is not running. Please start Docker and try again."
	exit 1
fi

echo "✅ Docker is running"
echo ""

# Start PostgreSQL and Redis
echo "🚀 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check PostgreSQL health
docker-compose ps postgres

echo ""
echo "📊 Database Status:"
docker-compose exec -T postgres pg_isready -U gamelist

echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Backend: cd backend && bun run dev"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Or start everything with Docker:"
echo "docker-compose up -d"
echo ""
echo "Access the app at: http://localhost:5173"
echo "Backend API at: http://localhost:3000"
echo ""
