#!/bin/bash

echo "🎮 Fight or Die - Development Mode"
echo "================================="
echo ""
echo "Running in mock mode (no SpacetimeDB required)"
echo ""

cd frontend
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting development server..."
echo ""
echo "Game will open at: http://localhost:5173"
echo ""

# Set environment variable to use mock
export VITE_USE_MOCK=true
npm run dev