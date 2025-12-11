-- Restore core RLS policies for Users, Organizations, and User Roles
-- These were dropped during the schema migration aid and need to be re-enabled

-- Enable RLS (just in case)
alter table users enable row level security;
alter table organizations enable row level security;
alter table user_roles enable row level security;

-- USERS Table
create policy "Users can view their own user record"
  on users for select
  using (auth.uid()::text = id);

create policy "Users can update their own user record"
  on users for update
  using (auth.uid()::text = id);

-- Note: Insert policy is usually not needed if handled by Service Role (RPC), 
-- but if inserting directly from client:
create policy "Users can insert their own user record"
  on users for insert
  with check (auth.uid()::text = id);


-- ORGANIZATIONS Table
create policy "Users can view their own organization"
  on organizations for select
  using (
    id in (
      select organization_id from user_roles 
      where user_id = auth.uid()::text
    )
    OR
    id in (
      select organization_id from users
      where id = auth.uid()::text
    )
  );

-- USER ROLES Table
create policy "Users can view roles in their organization"
  on user_roles for select
  using (
    organization_id in (
      select organization_id from users
      where id = auth.uid()::text
    )
  );

-- Also allow viewing own role specifically (redundant but safe)
create policy "Users can view their own roles"
  on user_roles for select
  using (user_id = auth.uid()::text);
