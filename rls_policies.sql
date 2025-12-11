-- Enable RLS
alter table decisions enable row level security;
alter table stakeholders enable row level security;
alter table documents enable row level security;

-- Decisions policies
create policy "Users can view decisions in their organization"
  on decisions for select
  using (organization_id in (
    select organization_id from users where id = auth.uid()::text
  ));

create policy "Users can create decisions in their organization"
  on decisions for insert
  with check (organization_id in (
    select organization_id from users where id = auth.uid()::text
  ));

create policy "Users can update decisions in their organization"
  on decisions for update
  using (organization_id in (
    select organization_id from users where id = auth.uid()::text
  ));

-- Document policies
create policy "Users can view documents in their organization"
  on documents for select
  using (organization_id in (
    select organization_id from users where id = auth.uid()::text
  ));
  
create policy "Users can create documents in their organization"
  on documents for insert
  with check (organization_id in (
    select organization_id from users where id = auth.uid()::text
  ));

-- Stakeholder policies
create policy "Users can view stakeholders for decisions in their organization"
  on stakeholders for select
  using (
    decision_id in (
      select id from decisions where organization_id in (
        select organization_id from users where id = auth.uid()::text
      )
    )
  );

create policy "Users can create stakeholders"
  on stakeholders for insert
  with check (
    decision_id in (
      select id from decisions where organization_id in (
        select organization_id from users where id = auth.uid()::text
      )
    )
  );
