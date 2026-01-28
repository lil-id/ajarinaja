#!/bin/bash

# AI Question Generation - Deployment Script
# This script deploys database migrations and Edge Functions to Supabase

set -e  # Exit on error

echo "🚀 AI Question Generation - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Please install: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Step 1: Check if linked to project
echo "📋 Step 1: Checking project link..."
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✅ Connected to Supabase${NC}"
else
    echo -e "${YELLOW}⚠️  Not linked to a project${NC}"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi
echo ""

# Step 2: Deploy migrations
echo "📋 Step 2: Deploying database migrations..."
echo "This will create:"
echo "  - pgvector extension"
echo "  - ai_materials table"
echo "  - material_chunks table (with vector embeddings)"
echo "  - ai_generated_questions table"
echo "  - SQL functions for vector search"
echo ""
read -p "Continue with migration deployment? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo -e "${GREEN}✅ Migrations deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping migrations${NC}"
fi
echo ""

# Step 3: Set up environment secrets
echo "📋 Step 3: Setting up environment secrets..."
echo ""
echo "You need to set the following secrets:"
echo "  1. GEMINI_API_KEY - Get from https://aistudio.google.com/app/apikey"
echo "  2. SUPABASE_SERVICE_ROLE_KEY - Get from Dashboard → Settings → API"
echo ""
read -p "Do you have these keys ready? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your Gemini API Key: " GEMINI_KEY
    read -p "Enter your Supabase Service Role Key: " SERVICE_KEY
    
    echo ""
    echo "Setting secrets..."
    supabase secrets set GEMINI_API_KEY="$GEMINI_KEY"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
    
    echo -e "${GREEN}✅ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping secrets setup${NC}"
    echo "You can set them later with:"
    echo "  supabase secrets set GEMINI_API_KEY=your-key"
    echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key"
fi
echo ""

# Step 4: Deploy Edge Functions
echo "📋 Step 4: Deploying Edge Functions..."
echo "This will deploy:"
echo "  - process-material (PDF processing + embeddings)"
echo "  - generate-questions (RAG-based generation)"
echo "  - list-materials (List teacher's materials)"
echo ""
read -p "Deploy all functions now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Deploying process-material..."
    supabase functions deploy process-material --no-verify-jwt
    
    echo "Deploying generate-questions..."
    supabase functions deploy generate-questions
    
    echo "Deploying list-materials..."
    supabase functions deploy list-materials
    
    echo -e "${GREEN}✅ All functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping function deployment${NC}"
    echo "You can deploy later with:"
    echo "  supabase functions deploy"
fi
echo ""

# Step 5: Verify deployment
echo "📋 Step 5: Verifying deployment..."
echo ""
echo "Checking functions..."
supabase functions list
echo ""

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run test script: ./scripts/test-functions.sh"
echo "  2. Check function logs: supabase functions logs"
echo "  3. Monitor: https://supabase.com/dashboard"
echo ""
