-- RPC to securely activate an invoice request and upgrade the customer's organisation
CREATE OR REPLACE FUNCTION activate_invoice_request(p_request_id uuid)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_user RECORD;
  v_tier text;
  v_is_global_admin boolean;
BEGIN
  -- Check if caller is global admin
  SELECT is_global_admin INTO v_is_global_admin FROM users WHERE id = (auth.uid())::text;
  IF v_is_global_admin IS NULL OR NOT v_is_global_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only global admins can activate licences.';
  END IF;

  -- Get request
  SELECT * INTO v_request FROM invoice_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice request not found.';
  END IF;

  IF v_request.status = 'activated' THEN
    RAISE EXCEPTION 'Invoice is already activated.';
  END IF;

  -- Attempt to find user by email
  SELECT * INTO v_user FROM users WHERE email = v_request.work_email LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found. They must sign up first before the licence can be applied to their organisation.', v_request.work_email;
  END IF;

  -- Map selected tier
  IF v_request.selected_tier LIKE '%6-Month%' THEN
    v_tier := 'pilot';
  ELSIF v_request.selected_tier LIKE '%Annual%' THEN
    v_tier := 'enterprise';
  ELSE
    v_tier := 'unknown';
  END IF;

  -- Update Organization
  UPDATE organizations 
  SET 
    subscription_tier = v_tier,
    license_tier = v_tier,
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = v_user.organization_id;

  -- Update Request
  UPDATE invoice_requests
  SET 
    status = 'activated',
    manually_activated = true,
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN json_build_object('success', true, 'organization_id', v_user.organization_id, 'tier', v_tier);
END;
$$;

GRANT EXECUTE ON FUNCTION activate_invoice_request TO authenticated;
