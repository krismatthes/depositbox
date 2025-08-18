#!/bin/bash

echo "🔧 Fixing npm permissions and installing dependencies..."

# Create a temporary npm cache directory
export NPM_CONFIG_CACHE="/tmp/npm-cache-$(date +%s)"
mkdir -p "$NPM_CONFIG_CACHE"

echo "📦 Installing root dependencies..."
npm install --cache "$NPM_CONFIG_CACHE"

echo "📦 Installing API dependencies..."
cd apps/api
npm install --cache "$NPM_CONFIG_CACHE"
cd ../..

echo "📦 Installing Web dependencies..."
cd apps/web  
npm install --cache "$NPM_CONFIG_CACHE"
cd ../..

echo "✅ All dependencies installed successfully!"
echo "🚀 You can now run: npm run dev"

# Clean up temp cache
rm -rf "$NPM_CONFIG_CACHE"