-- RPC Functions for User Invitations

-- 1. invite_user (Caller: Admin)
-- Checks permissions and inserts into invitations table
CREATE OR REPLACE FUNCTION invite_user(
  p_email TEXT,
  p_role TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_token TEXT;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM users
  WHERE id = v_user_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to an organization';
  END IF;

  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id
    AND organization_id = v_org_id
    AND role IN ('admin', 'chair')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can invite users';
  END IF;

  -- Generate Token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Insert Invitation
  INSERT INTO invitations (
    organization_id,
    email,
    role,
    token,
    invited_by
  )
  VALUES (
    v_org_id,
    p_email,
    p_role,
    v_token,
    v_user_id
  );

  SELECT json_build_object(
    'success', true,
    'token', v_token
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- 2. accept_invitation (Caller: Authenticated User who just signed up)
-- Verifies token and adds user to organization
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_invite RECORD;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  v_email := (SELECT email FROM auth.users WHERE id = v_user_id);

  -- Fetch Valid Invitation
  SELECT * INTO v_invite
  FROM invitations
  WHERE token = p_token
  AND status = 'pending'
  AND expires_at > NOW();

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Verify Email Match (Optional: strictly enforce email match?)
  -- For now, allow accepting with any email as long as token is valid, 
  -- OR enforce that the signed-in user's email matches the invited email.
  -- Let's enforce it for security.
  IF v_invite.email <> v_email THEN
    RAISE EXCEPTION 'Invitation email (%) does not match your account email (%)', v_invite.email, v_email;
  END IF;

  -- Create User Record (using users table)
  INSERT INTO users (
    id,
    email,
    name,
    organization_id
  )
  VALUES (
    v_user_id,
    v_email,
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = v_user_id), -- Try to get name from metadata
    v_invite.organization_id
  );

  -- Assign Role
  INSERT INTO user_roles (
    user_id,
    organization_id,
    role
  )
  VALUES (
    v_user_id,
    v_invite.organization_id,
    v_invite.role
  );

  -- Mark Invitation Accepted
  UPDATE invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = v_invite.id;

  SELECT json_build_object(
    'success', true,
    'organization_id', v_invite.organization_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;
