-- Migration: Add phone_number to profiles
-- Required for: Emergency contact

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;
