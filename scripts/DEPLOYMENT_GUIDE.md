# AI Question Generation - Deployment & Testing Guide

## Prerequisites

Before deploying, make sure you have:

- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Supabase project linked: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Gemini API key from https://aistudio.google.com/app/apikey
- [ ] Supabase Service Role Key from Dashboard → Settings → API

---

## Quick Start

### 1. Make scripts executable
```bash
chmod +x scripts/deploy-ai.sh
chmod +x scripts/test-functions.sh
```

### 2. Deploy everything
```bash
cd /home/renjerpink/Documents/Pemrograman/JS/classroom-companion
./scripts/deploy-ai.sh
```

The script will:
- ✅ Check Supabase CLI
- ✅ Deploy database migrations (pgvector + tables)
- ✅ Set environment secrets
- ✅ Deploy all Edge Functions
- ✅ Verify deployment

### 3. Test functions
```bash
./scripts/test-functions.sh
```

The script will:
- ✅ Test `list-materials` endpoint
- ✅ Create sample material for testing
- ✅ Test `generate-questions` endpoint
- ✅ Display results

---

## Manual Deployment Steps

If you prefer manual deployment:

### Step 1: Link Project (if not done)
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref:
- Go to Supabase Dashboard
- Your URL: `https://YOUR_PROJECT_REF.supabase.co`

### Step 2: Deploy Migrations
```bash
cd /home/renjerpink/Documents/Pemrograman/JS/classroom-companion
supabase db push
```

This creates:
- `ai_materials` table
- `material_chunks` table with vector(768) embeddings
- `ai_generated_questions` table
- Vector search functions
- Indexes for performance

### Step 3: Set Secrets
```bash
# Set Gemini API Key
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Set Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get keys:
- **Gemini**: https://aistudio.google.com/app/apikey
- **Service Role**: Dashboard → Settings → API → `service_role` key

### Step 4: Deploy Functions
```bash
cd /home/renjerpink/Documents/Pemrograman/JS/classroom-companion

# Deploy all at once
supabase functions deploy

# Or deploy individually
supabase functions deploy process-material --no-verify-jwt
supabase functions deploy generate-questions
supabase functions deploy list-materials
```

### Step 5: Verify Deployment
```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs process-material --limit 50
```

---

## Testing Edge Functions

### Method 1: Using Test Script
```bash
./scripts/test-functions.sh
```

### Method 2: Manual cURL Tests

#### Test 1: List Materials
```bash
# Get your JWT token from browser (after login)
# DevTools → Application → Local Storage → sb-*-auth-token → access_token

export USER_TOKEN="your-jwt-token"
export PROJECT_URL="https://your-project.supabase.co"

curl -X GET \
  "$PROJECT_URL/functions/v1/list-materials" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" | jq
```

#### Test 2: Process Material
```bash
# First, create material record in database
# Then call process function

curl -X POST \
  "$PROJECT_URL/functions/v1/process-material" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "your-material-uuid",
    "chunkSize": 500,
    "chunkOverlap": 50
  }' | jq
```

#### Test 3: Generate Questions
```bash
curl -X POST \
  "$PROJECT_URL/functions/v1/generate-questions" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "your-material-uuid",
    "numQuestions": 10,
    "difficulty": "medium",
    "topic": "fotosintesis"
  }' | jq
```

### Method 3: Using Supabase Dashboard

1. Go to **Edge Functions** in dashboard
2. Click on function name
3. Click **Invoke** tab
4. Enter request body
5. Click **Send Request**

---

## Local Development

### Serve functions locally
```bash
# Requires Docker
supabase start
supabase functions serve
```

Functions will be available at:
- `http://localhost:54321/functions/v1/process-material`
- `http://localhost:54321/functions/v1/generate-questions`
- `http://localhost:54321/functions/v1/list-materials`

### Watch logs
```bash
supabase functions logs --follow
```

---

## Troubleshooting

### Error: "Unauthorized"
- Check JWT token is valid (login again)
- Verify token is not expired
- Ensure user has teacher role

### Error: "GEMINI_API_KEY not configured"
```bash
# Set the secret
supabase secrets set GEMINI_API_KEY=your-key

# Redeploy function
supabase functions deploy generate-questions
```

### Error: "Material not found"
- Verify material was created in `ai_materials` table
- Check material status is 'ready' before generating questions
- Run `process-material` first to create chunks

### Error: "pgvector extension not found"
```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Check function logs
```bash
# View recent logs
supabase functions logs process-material --limit 100

# Follow logs real-time
supabase functions logs generate-questions --follow
```

---

## Monitoring

### Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to:
   - **Edge Functions** → View invocations, errors, logs
   - **Database** → Check tables and data
   - **Logs** → View all activity

### Function Metrics
```bash
# View function statistics
supabase functions list
```

Shows:
- Deployment status
- Version
- Last updated
- Invocation count

---

## Next Steps After Deployment

1. ✅ Verify migrations: Check tables in Database tab
2. ✅ Test with sample data: Use test script
3. ✅ Monitor logs: Check for errors
4. ✅ Optimize prompts: Improve question quality
5. ⏭️ Build frontend: QuestionBank UI integration

---

## Quick Reference

### Common Commands
```bash
# Deploy
supabase db push                              # Migrations
supabase functions deploy                     # All functions
supabase secrets set KEY=value                # Set secret

# Test
./scripts/test-functions.sh                   # Run tests
supabase functions logs <name>                # View logs

# Local Dev
supabase start                                # Start local
supabase functions serve                      # Serve locally
supabase db reset                             # Reset DB
```

### Important URLs
- Gemini API: https://aistudio.google.com/app/apikey
- Supabase Dashboard: https://supabase.com/dashboard
- Edge Functions Docs: https://supabase.com/docs/guides/functions

### Need Help?
- Check logs: `supabase functions logs <function-name>`
- Test locally: `supabase functions serve`
- Check status: `supabase status`
