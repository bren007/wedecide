-- Fix for "Function Search Path Mutable" warning
-- This ensures the function runs with a fixed search_path, preventing potential hijacking.

ALTER FUNCTION public.get_user_organization_id() SET search_path = public;
