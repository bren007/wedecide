-- Migration: Add Invitation Table and invite_user RPC
-- This supports the "Human-in-the-loop" invitation flow where admins generate a link.

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  invited_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Members can view invitations for their own organization
DROP POLICY IF EXISTS "Users can view org invitations" ON public.invitations;
CREATE POLICY "Users can view org invitations" ON public.invitations 
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()::text));

-- Policy 2: Chairs/Admins can UPDATE invitations (e.g. revoke them)
DROP POLICY IF EXISTS "Admins can update org invitations" ON public.invitations;
CREATE POLICY "Admins can update org invitations" ON public.invitations 
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()::text) 
    AND 
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid()::text AND ur.role IN ('admin', 'chair'))
  );

-- RPC to generate a secure invitation token
CREATE OR REPLACE FUNCTION public.invite_user(p_email text, p_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id text;
  v_token text;
  v_result json;
BEGIN
  -- 1. Get the organization of the caller
  SELECT organization_id INTO v_org_id FROM public.users WHERE id = auth.uid()::text;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User does not belong to an organization.';
  END IF;

  -- 2. Check if caller has admin/chair role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()::text 
    AND organization_id = v_org_id 
    AND role IN ('admin', 'chair')
  ) THEN
    -- Allow global admins to invite for their OWN org too, or should we allow them to invite for ANY org?
    -- For now, keep it strictly to the caller's org for safety.
    RAISE EXCEPTION 'Unauthorized: Only admins or chairs can invite users.';
  END IF;

  -- 3. Generate a secure random token
  v_token := md5(random()::text || clock_timestamp()::text);

  -- 4. Create the invitation record
  INSERT INTO public.invitations (
    email,
    role,
    organization_id,
    token,
    invited_by,
    expires_at
  )
  VALUES (
    p_email,
    p_role,
    v_org_id,
    v_token,
    auth.uid()::text,
    now() + interval '7 days'
  );

  -- 5. Return success data
  SELECT json_build_object(
    'success', true,
    'token', v_token
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_user TO authenticated;
