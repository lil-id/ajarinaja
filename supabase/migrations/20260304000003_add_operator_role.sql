-- Migration: Add 'operator' to app_role enum
-- This MUST be in a separate migration from any policy/query that uses 'operator'
-- because PostgreSQL does not allow using a new enum value in the same transaction
-- as ALTER TYPE ... ADD VALUE (SQLSTATE 55P04).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'operator'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'operator';
  END IF;
END
$$;
