#!/bin/bash

echo "🚀 Deploying Oro India Platform..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Please run this script from the cbse-prep-platform directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Installing Vercel CLI..."
npm install -g vercel

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🎉 Next steps:"
echo "1. Go to vercel.com/dashboard"
echo "2. Find your oro-india project"
echo "3. Add environment variables in Settings"
echo "4. Redeploy if needed"
echo ""
echo "🌟 Your Oro India platform is now live!"