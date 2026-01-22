-- Add language_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language_preference text NOT NULL DEFAULT 'en';

-- Add a check constraint for valid language codes
ALTER TABLE public.profiles
ADD CONSTRAINT valid_language_preference CHECK (language_preference IN ('en', 'id'));