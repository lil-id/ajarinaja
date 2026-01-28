-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ai_materials table to store uploaded materials
CREATE TABLE IF NOT EXISTS ai_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'excel', 'docx', 'txt')),
  file_size INTEGER, -- in bytes
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  error_message TEXT,
  total_chunks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create material_chunks table to store text chunks with embeddings
CREATE TABLE IF NOT EXISTS material_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES ai_materials(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768), -- Gemini embedding dimension
  metadata JSONB DEFAULT '{}', -- {page: 1, section: "Introduction", etc.}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique chunk per material
  UNIQUE(material_id, chunk_index)
);

-- Create ai_generated_questions table to store generation history
CREATE TABLE IF NOT EXISTS ai_generated_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES ai_materials(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]', -- Array of question objects
  parameters JSONB DEFAULT '{}', -- {difficulty, count, topic, etc.}
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_materials_teacher 
  ON ai_materials(teacher_id);

CREATE INDEX IF NOT EXISTS idx_ai_materials_course 
  ON ai_materials(course_id);

CREATE INDEX IF NOT EXISTS idx_ai_materials_status 
  ON ai_materials(status);

CREATE INDEX IF NOT EXISTS idx_material_chunks_material 
  ON material_chunks(material_id);

-- Vector similarity index using HNSW (better than IVFFlat for small-medium datasets)
CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding 
  ON material_chunks 
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_teacher 
  ON ai_generated_questions(teacher_id);

CREATE INDEX IF NOT EXISTS idx_ai_generated_questions_material 
  ON ai_generated_questions(material_id);

-- Enable Row Level Security
ALTER TABLE ai_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_materials
CREATE POLICY "Teachers can view their own materials"
  ON ai_materials FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own materials"
  ON ai_materials FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own materials"
  ON ai_materials FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own materials"
  ON ai_materials FOR DELETE
  USING (auth.uid() = teacher_id);

-- RLS Policies for material_chunks (automatically inherit from ai_materials)
CREATE POLICY "Teachers can view chunks of their materials"
  ON material_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_materials 
      WHERE ai_materials.id = material_chunks.material_id 
      AND ai_materials.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert chunks for their materials"
  ON material_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_materials 
      WHERE ai_materials.id = material_chunks.material_id 
      AND ai_materials.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete chunks of their materials"
  ON material_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ai_materials 
      WHERE ai_materials.id = material_chunks.material_id 
      AND ai_materials.teacher_id = auth.uid()
    )
  );

-- RLS Policies for ai_generated_questions
CREATE POLICY "Teachers can view their own generated questions"
  ON ai_generated_questions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own generated questions"
  ON ai_generated_questions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own generated questions"
  ON ai_generated_questions FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own generated questions"
  ON ai_generated_questions FOR DELETE
  USING (auth.uid() = teacher_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_ai_materials_timestamp
  BEFORE UPDATE ON ai_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_materials_updated_at();
