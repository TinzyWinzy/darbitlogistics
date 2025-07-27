#!/bin/bash

# Fresh DarLogistics Vercel Deployment
echo "🚀 Deploying DarLogistics to Vercel (Fresh Setup)..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set up environment variables (see FRESH_DEPLOYMENT.md)"
echo "3. Test your API endpoints"
echo "4. Your app will be available at: https://your-app.vercel.app"
echo ""
echo "🔧 Required Environment Variables:"
echo "- DATABASE_URL"
echo "- JWT_SECRET"
echo "- NODE_ENV=production" 