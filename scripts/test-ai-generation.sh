#!/bin/bash

# AI Question Generation - Quick Test Script
# Tests Edge Functions with sample material

set -e

echo "🧪 AI Question Generation - Quick Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get environment variables
PROJECT_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$PROJECT_URL" ] || [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ Could not find Supabase credentials in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project URL: $PROJECT_URL${NC}"
echo ""

# Check if user is logged in (need JWT token)
echo -e "${YELLOW}⚠️  You need a valid JWT token to test${NC}"
echo "Get it from:"
echo "  1. Login to your app"
echo "  2. Open DevTools → Application → Local Storage"
echo "  3. Find 'sb-*-auth-token' → Copy 'access_token'"
echo ""
read -p "Enter your JWT token: " USER_TOKEN
echo ""

# Base URL
FUNCTIONS_URL="$PROJECT_URL/functions/v1"

# Test 1: Check if functions are deployed
echo -e "${BLUE}Test 1: Checking deployed functions${NC}"
echo "Verifying Edge Functions are accessible..."
echo ""

# Try to call list-materials (should work even with empty result)
RESPONSE=$(curl -s -X GET \
  "$FUNCTIONS_URL/list-materials" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "success\|materials"; then
    echo -e "${GREEN}✅ Edge Functions deployed and accessible${NC}"
else
    echo -e "${RED}❌ Edge Functions not accessible${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 2: Upload sample material (manual step)
echo -e "${BLUE}Test 2: Upload Material${NC}"
echo "📝 Manual Test Required:"
echo ""
echo "1. Open your app: $PROJECT_URL"
echo "2. Go to QuestionBank → AI Generation tab"
echo "3. Click 'Upload Material'"
echo "4. Upload file: test-fotosintesis.txt"
echo "5. Title: 'Test Fotosintesis'"
echo "6. Wait for processing to complete (~30-60s)"
echo ""
read -p "Press Enter after material is uploaded and processed..."
echo ""

# Test 3: Get materials
echo -e "${BLUE}Test 3: Fetching uploaded materials${NC}"

MATERIALS_RESPONSE=$(curl -s -X GET \
  "$FUNCTIONS_URL/list-materials" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json")

echo "$MATERIALS_RESPONSE" | jq '.' 2>/dev/null || echo "$MATERIALS_RESPONSE"
echo ""

# Extract first ready material ID
MATERIAL_ID=$(echo "$MATERIALS_RESPONSE" | jq -r '.materials[] | select(.status == "ready") | .id' | head -n 1)

if [ -z "$MATERIAL_ID" ] || [ "$MATERIAL_ID" = "null" ]; then
    echo -e "${YELLOW}⚠️  No ready materials found${NC}"
    echo "Please ensure material processing completed successfully"
    exit 1
fi

echo -e "${GREEN}✅ Found ready material: $MATERIAL_ID${NC}"
echo ""

# Test 4: Generate questions
echo -e "${BLUE}Test 4: Generating questions${NC}"
echo "Calling generate-questions Edge Function..."
echo "This may take 30-60 seconds..."
echo ""

GENERATE_RESPONSE=$(curl -s -X POST \
  "$FUNCTIONS_URL/generate-questions" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"materialId\": \"$MATERIAL_ID\",
    \"numQuestions\": 5,
    \"difficulty\": \"medium\",
    \"topic\": \"fotosintesis\"
  }")

echo ""
if echo "$GENERATE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Questions generated successfully!${NC}"
    echo ""
    
    # Count questions
    QUESTION_COUNT=$(echo "$GENERATE_RESPONSE" | jq -r '.questions | length' 2>/dev/null || echo "0")
    echo -e "${GREEN}Generated $QUESTION_COUNT questions${NC}"
    echo ""
    
    # Show first question as example
    echo -e "${BLUE}Example Question:${NC}"
    echo "$GENERATE_RESPONSE" | jq -r '.questions[0]' 2>/dev/null || echo "Could not parse"
    echo ""
else
    echo -e "${RED}❌ Question generation failed${NC}"
    echo "Response:"
    echo "$GENERATE_RESPONSE" | jq '.' 2>/dev/null || echo "$GENERATE_RESPONSE"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Tests Complete!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Edge Functions deployed"
echo "  ✅ Material uploaded and processed"
echo "  ✅ Questions generated successfully"
echo ""
echo "Next steps:"
echo "  1. Check question quality in the app"
echo "  2. Test save to question bank"
echo "  3. Verify questions can be used in exams"
echo ""
