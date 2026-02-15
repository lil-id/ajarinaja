-- Create the storage bucket for question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add image_url column to questions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'image_url') THEN
        ALTER TABLE public.questions ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Add image_url column to assignment_questions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_questions' AND column_name = 'image_url') THEN
        ALTER TABLE public.assignment_questions ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Add image_url column to question_bank table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_bank' AND column_name = 'image_url') THEN
        ALTER TABLE public.question_bank ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Set up RLS policies for the question-images bucket

-- Allow public read access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'question-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'question-images' AND
  auth.uid() = owner
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'question-images' AND
  auth.uid() = owner
);
