-- Vector similarity search function
-- This function performs cosine similarity search on material chunks
CREATE OR REPLACE FUNCTION match_material_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_material_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  material_id uuid,
  chunk_text text,
  chunk_index integer,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    material_chunks.id,
    material_chunks.material_id,
    material_chunks.chunk_text,
    material_chunks.chunk_index,
    material_chunks.metadata,
    1 - (material_chunks.embedding <=> query_embedding) as similarity
  FROM material_chunks
  WHERE 
    1 - (material_chunks.embedding <=> query_embedding) > match_threshold
    AND (filter_material_id IS NULL OR material_chunks.material_id = filter_material_id)
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Function to get material statistics
CREATE OR REPLACE FUNCTION get_material_stats(material_uuid uuid)
RETURNS TABLE (
  total_chunks integer,
  avg_chunk_length float,
  status text,
  has_embeddings boolean
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*)::integer as total_chunks,
    AVG(LENGTH(chunk_text))::float as avg_chunk_length,
    m.status,
    BOOL_AND(embedding IS NOT NULL) as has_embeddings
  FROM material_chunks mc
  JOIN ai_materials m ON m.id = mc.material_id
  WHERE mc.material_id = material_uuid
  GROUP BY m.status;
$$;

-- Function to search materials by title
CREATE OR REPLACE FUNCTION search_ai_materials(
  search_query text,
  teacher_uuid uuid
)
RETURNS SETOF ai_materials
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM ai_materials
  WHERE 
    teacher_id = teacher_uuid
    AND (
      title ILIKE '%' || search_query || '%'
      OR (metadata->>'description')::text ILIKE '%' || search_query || '%'
    )
  ORDER BY created_at DESC;
$$;

-- Function to clean up orphaned chunks (chunks without parent material)
CREATE OR REPLACE FUNCTION cleanup_orphaned_chunks()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM material_chunks
  WHERE material_id NOT IN (SELECT id FROM ai_materials);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get teacher's AI usage stats
CREATE OR REPLACE FUNCTION get_teacher_ai_stats(teacher_uuid uuid)
RETURNS TABLE (
  total_materials integer,
  total_chunks integer,
  total_questions_generated integer,
  ready_materials integer,
  processing_materials integer
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(DISTINCT am.id)::integer as total_materials,
    COUNT(mc.id)::integer as total_chunks,
    COALESCE(SUM(jsonb_array_length(agq.questions)), 0)::integer as total_questions_generated,
    COUNT(DISTINCT am.id) FILTER (WHERE am.status = 'ready')::integer as ready_materials,
    COUNT(DISTINCT am.id) FILTER (WHERE am.status = 'processing')::integer as processing_materials
  FROM ai_materials am
  LEFT JOIN material_chunks mc ON mc.material_id = am.id
  LEFT JOIN ai_generated_questions agq ON agq.material_id = am.id
  WHERE am.teacher_id = teacher_uuid;
$$;
