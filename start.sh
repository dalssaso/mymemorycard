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

# Start all services
echo "Starting all services (PostgreSQL, Redis, Backend, Frontend)..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "Application Ready!"
echo ""
echo "Access the app at: http://localhost:5173"
echo "Backend API at: http://localhost:3000"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""
