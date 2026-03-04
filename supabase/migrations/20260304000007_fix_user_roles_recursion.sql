-- Migration: Fix infinite recursion in user_roles policy
-- Context: The previous policy "Operators can view all user roles" queried public.user_roles directly,
-- which triggered the SELECT policy recursively (SQLSTATE 42P17).
-- Fix: Use the established public.has_role() function which is SECURITY DEFINER 
-- and bypasses RLS, preventing the recursion.

DROP POLICY IF EXISTS "Operators can view all user roles" ON public.user_roles;

CREATE POLICY "Operators can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'operator')
  );
