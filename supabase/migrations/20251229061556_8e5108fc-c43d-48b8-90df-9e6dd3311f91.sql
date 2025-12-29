-- Add bio column to profiles table
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Update the public_profiles view to include bio
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  name,
  avatar_url,
  bio,
  created_at
FROM public.profiles;