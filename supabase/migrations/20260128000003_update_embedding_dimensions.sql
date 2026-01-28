-- Update embedding dimension from 768 to 3072 for gemini-embedding-001
-- Note: Both HNSW and IVFFlat have 2000 dimension limits in pgvector
-- For 3072 dimensions, we'll use brute-force search (no index)

-- Drop existing function that depends on the column
DROP FUNCTION IF EXISTS match_material_chunks(vector(768), float, int, uuid);

-- Drop the HNSW index created in the original schema
DROP INDEX IF EXISTS idx_material_chunks_embedding;

-- Alter the embedding column dimension
ALTER TABLE material_chunks 
ALTER COLUMN embedding TYPE vector(3072);

-- NOTE: No index for 3072 dimensions - both HNSW and IVFFlat max out at 2000
-- Vector search will use brute-force (slower but accurate)
-- For better performance with large datasets, consider:
-- 1. Using a smaller embedding model (768 dimensions)
-- 2. Implementing custom sharding/partitioning
-- 3. Using external vector database (Pinecone, Qdrant, etc.)

-- Recreate the vector similarity search function with new dimensions
CREATE OR REPLACE FUNCTION match_material_chunks(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_material_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  material_id uuid,
  chunk_text text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    material_chunks.id,
    material_chunks.material_id,
    material_chunks.chunk_text,
    material_chunks.chunk_index,
    material_chunks.metadata,
    1 - (material_chunks.embedding <=> query_embedding) as similarity
  FROM material_chunks
  WHERE 
    (filter_material_id IS NULL OR material_chunks.material_id = filter_material_id)
    AND 1 - (material_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY material_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
