-- Phase 8.5: Global Administration
-- Adds global admin flag to separate AlturaGov employees from tenant admins.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_global_admin BOOLEAN DEFAULT false NOT NULL;

-- Mark an initial user as global admin if needed? (We'll let them set it manually if they want)
-- UPDATE users SET is_global_admin = true WHERE email like '%@alturagov.com';
