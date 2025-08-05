#!/bin/bash

echo "🎮 Fight or Die - Development Environment"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "📦 Building and starting development environment..."
echo ""

# Build custom SpacetimeDB image if needed
if [[ ! -z $(docker images -q fight-or-die-spacetimedb:latest) ]]; then
    echo "Building SpacetimeDB image..."
    docker build -f Dockerfile.spacetimedb -t fight-or-die-spacetimedb:latest .
fi

# Update docker-compose to use our custom image
sed -i 's|image: clockworklabs/spacetimedb:latest|image: fight-or-die-spacetimedb:latest|' docker-compose.yml

# Start services
docker-compose up

echo ""
echo "✅ Development environment is running!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the servers."