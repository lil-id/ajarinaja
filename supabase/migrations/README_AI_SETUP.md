# AI Question Generation - Database Setup

## Migration Files Created

### 1. `20260128000001_ai_question_generation_schema.sql`
Creates the core database schema for AI question generation:

**Tables:**
- `ai_materials` - Stores uploaded teaching materials
- `material_chunks` - Stores text chunks with vector embeddings (768-dim)
- `ai_generated_questions` - Stores generated questions history

**Features:**
- ✅ pgvector extension enabled
- ✅ HNSW indexes for fast vector similarity search
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp updates
- ✅ Foreign key constraints

### 2. `20260128000002_ai_functions.sql`
Creates SQL functions for AI operations:

**Functions:**
- `match_material_chunks()` - Vector similarity search using cosine distance
- `get_material_stats()` - Get statistics for a material
- `search_ai_materials()` - Full-text search on materials
- `cleanup_orphaned_chunks()` - Maintenance function
- `get_teacher_ai_stats()` - Teacher usage analytics

---

## Deployment Instructions

### Step 1: Apply Migrations

**Using Supabase CLI:**
```bash
# Make sure you're in the project directory
cd /home/renjerpink/Documents/Pemrograman/JS/classroom-companion

# Link to your Supabase project (if not done)
npx supabase link --project-ref <your-project-ref>

# Apply migrations
npx supabase db push
```

**Or manually via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `20260128000001_ai_question_generation_schema.sql`
3. Run the SQL
4. Copy content from `20260128000002_ai_functions.sql`
5. Run the SQL

### Step 2: Verify Setup

Run this query to verify tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%';
```

Expected output:
- ai_materials
- material_chunks
- ai_generated_questions

### Step 3: Test Vector Search

Insert test data:
```sql
-- Insert test material
INSERT INTO ai_materials (teacher_id, title, file_url, file_type, status)
VALUES (
  auth.uid(), 
  'Test Material', 
  'test.pdf', 
  'pdf', 
  'ready'
) RETURNING id;

-- Insert test chunk with mock embedding
INSERT INTO material_chunks (material_id, chunk_text, chunk_index, embedding)
VALUES (
  '<material-id-from-above>',
  'This is a test chunk about photosynthesis.',
  1,
  array_fill(0.1, ARRAY[768])::vector
);

-- Test vector search
SELECT * FROM match_material_chunks(
  array_fill(0.1, ARRAY[768])::vector,
  0.5,
  5
);
```

---

## Schema Overview

### Table: `ai_materials`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| teacher_id | UUID | Foreign key to profiles |
| course_id | UUID | Optional course association |
| title | TEXT | Material title |
| file_url | TEXT | Storage URL |
| file_type | TEXT | pdf, excel, docx, txt |
| status | TEXT | processing, ready, error |
| total_chunks | INTEGER | Number of chunks |
| metadata | JSONB | Additional metadata |

### Table: `material_chunks`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| material_id | UUID | Foreign key to ai_materials |
| chunk_text | TEXT | Text content |
| chunk_index | INTEGER | Chunk order |
| embedding | vector(768) | Gemini embedding |
| metadata | JSONB | Page, section info |

### Table: `ai_generated_questions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| material_id | UUID | Source material |
| teacher_id | UUID | Generator |
| questions | JSONB | Question array |
| parameters | JSONB | Generation config |
| status | TEXT | draft, saved |

---

## Next Steps

1. ✅ Database schema ready
2. ⏭️ Create Edge Functions for:
   - Material processing
   - Question generation
3. ⏭️ Build frontend components
4. ⏭️ Test end-to-end flow

## Security Notes

- ✅ RLS policies ensure teachers can only access their own data
- ✅ Cascading deletes prevent orphaned data
- ✅ Service role key required for Edge Functions
- ⚠️ Gemini API key should be stored in Edge Function secrets
