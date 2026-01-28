#!/bin/bash

# AI Question Generation - Test Script
# Tests Edge Functions with sample data

set -e

echo "🧪 AI Question Generation - Test Script"
echo "======================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get project URL
echo "📋 Getting project configuration..."
PROJECT_URL=$(grep VITE_SUPABASE_URL ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY ../.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$PROJECT_URL" ] || [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ Could not find Supabase credentials in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project URL: $PROJECT_URL${NC}"
echo ""

# Get user JWT token
echo "📋 You need a valid user JWT token for testing"
echo "Get it from:"
echo "  1. Login to your app"
echo "  2. Open browser DevTools → Application → Local Storage"
echo "  3. Find 'sb-*-auth-token' → Copy the 'access_token' value"
echo ""
read -p "Enter your JWT token: " USER_TOKEN
echo ""

# Base URL for functions
FUNCTIONS_URL="$PROJECT_URL/functions/v1"

# Test 1: List materials
echo -e "${BLUE}Test 1: List Materials${NC}"
echo "Endpoint: GET $FUNCTIONS_URL/list-materials"
echo ""

RESPONSE=$(curl -s -X GET \
  "$FUNCTIONS_URL/list-materials" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""

# Extract material count
MATERIAL_COUNT=$(echo "$RESPONSE" | jq -r '.materials | length' 2>/dev/null || echo "0")
echo -e "Materials found: ${GREEN}$MATERIAL_COUNT${NC}"
echo ""

# Test 2: Upload and process material (if user wants)
read -p "Do you want to test material upload? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Test 2: Upload Material${NC}"
    echo ""
    
    # Create sample text file
    echo "Creating sample material..."
    cat > /tmp/sample-material.txt << 'EOF'
Fotosintesis

Fotosintesis adalah proses pembuatan makanan yang dilakukan oleh tumbuhan hijau dengan bantuan cahaya matahari. Proses ini terjadi di kloroplas, khususnya di bagian yang mengandung klorofil.

Tahapan Fotosintesis:

1. Reaksi Terang
Reaksi terang terjadi di membran tilakoid. Pada tahap ini, energi cahaya matahari ditangkap oleh klorofil dan diubah menjadi energi kimia dalam bentuk ATP dan NADPH. Proses ini juga menghasilkan oksigen sebagai produk sampingan.

2. Reaksi Gelap (Siklus Calvin)
Reaksi gelap terjadi di stroma kloroplas. Pada tahap ini, ATP dan NADPH yang dihasilkan dari reaksi terang digunakan untuk mengubah karbon dioksida (CO2) menjadi glukosa. Proses ini tidak memerlukan cahaya secara langsung.

Faktor-faktor yang Mempengaruhi Fotosintesis:

1. Intensitas Cahaya
Semakin tinggi intensitas cahaya, semakin cepat laju fotosintesis hingga mencapai titik jenuh.

2. Konsentrasi CO2
CO2 merupakan bahan baku fotosintesis. Peningkatan konsentrasi CO2 akan meningkatkan laju fotosintesis.

3. Suhu
Suhu optimal untuk fotosintesis adalah 25-35°C. Suhu yang terlalu tinggi atau rendah akan menghambat enzim-enzim yang terlibat dalam fotosintesis.

4. Ketersediaan Air
Air diperlukan sebagai sumber elektron dalam fotosintesis. Kekurangan air akan menurunkan laju fotosintesis.

Persamaan Reaksi Fotosintesis:
6CO2 + 6H2O + Cahaya → C6H12O6 + 6O2

Manfaat Fotosintesis:
- Menghasilkan oksigen untuk respirasi makhluk hidup
- Menghasilkan makanan (glukosa) untuk tumbuhan
- Mengurangi CO2 di atmosfer
- Menjaga keseimbangan ekosistem
EOF
    
    echo "Sample material created: /tmp/sample-material.txt"
    echo ""
    
    # First, upload to Supabase Storage
    echo "Note: You need to manually upload the file to Supabase Storage first"
    echo "Then insert record to ai_materials table"
    echo "Then run process-material function"
    echo ""
    echo "See: supabase/functions/README.md for manual testing instructions"
fi
echo ""

# Test 3: Generate questions (if materials exist)
if [ "$MATERIAL_COUNT" -gt 0 ]; then
    read -p "Do you want to test question generation? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}Test 3: Generate Questions${NC}"
        echo ""
        
        # Get first material ID
        MATERIAL_ID=$(echo "$RESPONSE" | jq -r '.materials[0].id' 2>/dev/null)
        
        if [ -z "$MATERIAL_ID" ] || [ "$MATERIAL_ID" = "null" ]; then
            echo -e "${RED}❌ No valid material ID found${NC}"
        else
            echo "Using material ID: $MATERIAL_ID"
            echo ""
            echo "Generating 5 questions..."
            
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
            
            echo "Response:"
            echo "$GENERATE_RESPONSE" | jq '.' || echo "$GENERATE_RESPONSE"
            echo ""
            
            # Check if successful
            if echo "$GENERATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Questions generated successfully!${NC}"
                QUESTION_COUNT=$(echo "$GENERATE_RESPONSE" | jq -r '.questions | length')
                echo "Generated $QUESTION_COUNT questions"
            else
                echo -e "${RED}❌ Question generation failed${NC}"
            fi
        fi
    fi
fi
echo ""

echo -e "${GREEN}🎉 Testing complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check function logs: supabase functions logs <function-name>"
echo "  2. View in dashboard: https://supabase.com/dashboard"
echo "  3. Proceed to frontend integration"
echo ""
