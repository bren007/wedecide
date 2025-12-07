-- Fixed RLS Policies for Signup Flow
-- The key issue: During signup, the user is NOT yet authenticated when creating the organization
-- We need to allow 'anon' role to create organizations

-- First, drop existing INSERT policies
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can create roles in their org" ON user_roles;
DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;

-- Allow ANON users to create organizations (needed during signup before auth session exists)
CREATE POLICY "Allow organization creation during signup"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Allow ANON users to insert user profiles (auth.uid() will be set by Supabase after signup)
CREATE POLICY "Allow user profile creation during signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow ANON users to create roles
CREATE POLICY "Allow role creation during signup"
  ON user_roles FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to delete organizations (for cleanup)
CREATE POLICY "Users can delete their organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));
