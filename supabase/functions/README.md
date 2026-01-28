# AI Question Generation - Edge Functions

## Functions Created

### 1. `process-material`
Processes uploaded material files and generates embeddings.

**Endpoint**: `POST /functions/v1/process-material`

**Request Body**:
```json
{
  "materialId": "uuid",
  "chunkSize": 500,      // optional, default: 500
  "chunkOverlap": 50     // optional, default: 50
}
```

**Process**:
1. Downloads file from Supabase Storage
2. Extracts text (currently supports .txt, PDF coming soon)
3. Smart chunking by paragraphs
4. Generates embeddings using Gemini Embedding API
5. Stores chunks + embeddings in database

**Response**:
```json
{
  "success": true,
  "materialId": "uuid",
  "totalChunks": 45,
  "chunks": [...]
}
```

---

### 2. `generate-questions`
Generates questions using RAG (Retrieval Augmented Generation).

**Endpoint**: `POST /functions/v1/generate-questions`

**Request Body**:
```json
{
  "materialId": "uuid",
  "numQuestions": 10,
  "difficulty": "medium",
  "topic": "Photosynthesis",
  "questionTypes": ["multiple_choice"]
}
```

**Process**:
1. Creates query embedding for topic
2. Performs vector similarity search on chunks
3. Retrieves top-k relevant chunks
4. Sends context + prompt to Gemini
5. Parses structured JSON response
6. Saves questions to database

**Response**:
```json
{
  "success": true,
  "generationId": "uuid",
  "questions": [...],
  "metadata": {
    "materialTitle": "...",
    "chunksUsed": 5,
    "parameters": {...}
  }
}
```

---

### 3. `list-materials`
Lists teacher's uploaded materials with statistics.

**Endpoint**: `GET /functions/v1/list-materials?search=&status=`

**Query Parameters**:
- `search`: Filter by title/description
- `status`: Filter by status (processing, ready, error, all)

**Response**:
```json
{
  "success": true,
  "materials": [...],
  "stats": {
    "total_materials": 10,
    "total_chunks": 450,
    "total_questions_generated": 100,
    "ready_materials": 8,
    "processing_materials": 2
  }
}
```

---

## Setup Instructions

### 1. Environment Variables

Create `.env.local` in the `functions` directory:

```bash
cd supabase/functions
cp .env.example .env.local
```

Fill in your values:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

**Get Gemini API Key**:
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key
3. Copy and paste into `.env.local`

### 2. Deploy Functions

**Using Supabase CLI**:
```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy individually
npx supabase functions deploy process-material
npx supabase functions deploy generate-questions
npx supabase functions deploy list-materials
```

### 3. Set Environment Secrets

**Via CLI**:
```bash
npx supabase secrets set GEMINI_API_KEY=your-api-key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Via Dashboard**:
1. Go to Supabase Dashboard → Edge Functions
2. Click on function name
3. Navigate to "Secrets" tab
4. Add secrets

---

## Testing Functions

### Test `process-material`

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/process-material' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "materialId": "uuid-of-material",
    "chunkSize": 500,
    "chunkOverlap": 50
  }'
```

### Test `generate-questions`

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/generate-questions' \
  -H 'Authorization: Bearer YOUR_USER_JWT' \
  -H 'Content-Type: application/json' \
  -d '{
    "materialId": "uuid-of-material",
    "numQuestions": 5,
    "difficulty": "medium",
    "topic": "Fotosintesis"
  }'
```

### Test `list-materials`

```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/list-materials?status=ready' \
  -H 'Authorization: Bearer YOUR_USER_JWT'
```

---

## Error Handling

All functions return consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common errors:
- `401 Unauthorized`: Missing or invalid auth token
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Material not found
- `500 Internal Server Error`: Gemini API or database error

---

## CORS Support

All functions include CORS headers for frontend integration:
```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}
```

---

## Next Steps

1. ✅ Deploy functions to Supabase
2. ⏭️ Test with sample data
3. ⏭️ Build frontend integration
4. ⏭️ Add PDF processing support
5. ⏭️ Optimize prompts for better question quality
