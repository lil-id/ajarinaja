#!/bin/bash

# Supabase Migration Helper Script
# Helps migrate from Lovable Supabase to your own account

set -e

echo "🔄 Supabase Migration Helper"
echo "============================"
echo ""
echo "This script will help you migrate from Lovable Supabase to your own account."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check CLI
echo -e "${BLUE}Step 1: Checking Supabase CLI${NC}"
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    npm install supabase --save-dev
fi
echo -e "${GREEN}✅ Supabase CLI ready${NC}"
echo ""

# Step 2: Login
echo -e "${BLUE}Step 2: Login to Supabase${NC}"
echo "This will open your browser for authentication."
read -p "Press Enter to continue..."
npx supabase login
echo -e "${GREEN}✅ Logged in${NC}"
echo ""

# Step 3: Get project ref
echo -e "${BLUE}Step 3: Link Your New Project${NC}"
echo ""
echo "Get your project ref from:"
echo "  Supabase Dashboard → Settings → General → Reference ID"
echo ""
read -p "Enter your new project ref: " PROJECT_REF
echo ""

# Link project
echo "Linking project..."
npx supabase link --project-ref "$PROJECT_REF"
echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Step 4: Update .env
echo -e "${BLUE}Step 4: Update Environment Variables${NC}"
echo ""
echo "Get these from: Dashboard → Settings → API"
echo ""
read -p "Enter your new Project URL: " PROJECT_URL
read -p "Enter your new Anon Key: " ANON_KEY
read -p "Enter your Service Role Key: " SERVICE_KEY

# Backup old .env
if [ -f .env ]; then
    cp .env .env.backup
    echo "Backed up old .env to .env.backup"
fi

# Update .env
cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$PROJECT_URL
VITE_SUPABASE_ANON_KEY=$ANON_KEY

# DO NOT COMMIT THESE TO GIT
EOF

echo -e "${GREEN}✅ .env updated${NC}"
echo ""

# Create Edge Functions .env.local
echo "Creating Edge Functions .env.local..."
mkdir -p supabase/functions
cat > supabase/functions/.env.local << EOF
SUPABASE_URL=$PROJECT_URL
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
GEMINI_API_KEY=your-gemini-api-key-here
EOF

echo -e "${GREEN}✅ Edge Functions .env.local created${NC}"
echo -e "${YELLOW}⚠️  Don't forget to add your GEMINI_API_KEY!${NC}"
echo ""

# Step 5: Deploy migrations
echo -e "${BLUE}Step 5: Deploy Database Migrations${NC}"
echo ""
read -p "Deploy all migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx supabase db push
    echo -e "${GREEN}✅ Migrations deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped migrations. Run 'supabase db push' later.${NC}"
fi
echo ""

# Step 6: Set secrets
echo -e "${BLUE}Step 6: Configure Secrets${NC}"
echo ""
read -p "Set secrets for Edge Functions? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Gemini API Key: " GEMINI_KEY
    
    npx supabase secrets set GEMINI_API_KEY="$GEMINI_KEY"
    npx supabase secrets set PRIVATE_SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
    
    echo -e "${GREEN}✅ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped secrets. Set them later with 'supabase secrets set'${NC}"
fi
echo ""

# Step 7: Deploy functions
echo -e "${BLUE}Step 7: Deploy Edge Functions${NC}"
echo ""
read -p "Deploy all Edge Functions now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx supabase functions deploy
    echo -e "${GREEN}✅ Functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped functions. Run './scripts/deploy-ai.sh' later.${NC}"
fi
echo ""

# Step 8: Deploy seed-data function (optional)
echo -e "${BLUE}Step 8: Deploy Data Seeder${NC}"
echo ""
echo "The seed-data function will populate your database with:"
echo "  - Test accounts (teacher & student)"
echo "  - Sample courses"
echo "  - Sample exams & questions"
echo "  - Sample assignments"
echo "  - Badges & academic periods"
echo ""
read -p "Deploy seed-data function? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx supabase functions deploy seed-data
    echo -e "${GREEN}✅ Seed-data function deployed${NC}"
    
    # Ask if user wants to run seeder now
    echo ""
    read -p "Run data seeder now to populate sample data? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running seeder..."
        echo "This may take 30-60 seconds..."
        
        # Call seed-data function
        SEED_RESPONSE=$(curl -s -X POST \
          "$PROJECT_URL/functions/v1/seed-data" \
          -H "Authorization: Bearer $SERVICE_KEY" \
          -H "Content-Type: application/json")
        
        # Check response
        if echo "$SEED_RESPONSE" | grep -q "success"; then
            echo -e "${GREEN}✅ Sample data seeded successfully!${NC}"
            
            # Extract test account credentials if available
            TEACHER_EMAIL=$(echo "$SEED_RESPONSE" | grep -o '"teacher_email":"[^"]*"' | cut -d'"' -f4)
            STUDENT_EMAIL=$(echo "$SEED_RESPONSE" | grep -o '"student_email":"[^"]*"' | cut -d'"' -f4)
            
            if [ ! -z "$TEACHER_EMAIL" ]; then
                echo ""
                echo "📝 Test Accounts Created:"
                echo "  Teacher: $TEACHER_EMAIL"
                echo "  Student: $STUDENT_EMAIL"
                echo "  Password: demo123 (for both)"
            fi
        else
            echo -e "${YELLOW}⚠️  Warning: Seeder may have failed. Check response:${NC}"
            echo "$SEED_RESPONSE"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipped seeding. You can run it later by calling:${NC}"
        echo "  curl -X POST '$PROJECT_URL/functions/v1/seed-data' \\"
        echo "    -H 'Authorization: Bearer \$SERVICE_ROLE_KEY'"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped seed-data deployment.${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update GEMINI_API_KEY in: supabase/functions/.env.local"
echo "  2. Create storage buckets in dashboard (avatars, thumbnails, materials)"
echo "  3. Test with seeded accounts (if you ran seeder):"
echo "     - Teacher: teacher@demo.com / Password: demo123"
echo "     - Student: student@demo.com / Password: demo123"
echo "  4. Or register new accounts: npm run dev"
echo "  5. Test AI functions: ./scripts/test-functions.sh"
echo ""
echo "Files updated:"
echo "  ✅ .env (backed up to .env.backup)"
echo "  ✅ supabase/functions/.env.local"
echo ""
echo "Migration guide: MIGRATION_GUIDE.md"
echo ""
