-- Lock down raw_upload as internal-only storage.
-- Intention:
-- 1. raw_upload is a landing zone for source CSV-shaped tables.
-- 2. The app should not read raw_upload directly.
-- 3. anon/authenticated should not access raw_upload tables.
-- 4. service_role can remain available for trusted backend/admin workflows.

revoke all on schema raw_upload from anon, authenticated;
grant usage on schema raw_upload to service_role;

revoke all on all tables in schema raw_upload from anon, authenticated;
grant all on all tables in schema raw_upload to service_role;

alter default privileges for role postgres in schema raw_upload
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema raw_upload
  grant all on tables to service_role;

alter table raw_upload.rider_catalog enable row level security;
alter table raw_upload.term_dictionary enable row level security;
alter table raw_upload.comparison_mapping enable row level security;
alter table raw_upload.event_guidance enable row level security;
alter table raw_upload.rider_display_copy enable row level security;
alter table raw_upload.rider_helper enable row level security;
alter table raw_upload.rider_option_catalog enable row level security;
alter table raw_upload.rider_runtime_seed enable row level security;
alter table raw_upload.consult_template enable row level security;
alter table raw_upload.ui_surface_mapping enable row level security;
alter table raw_upload.datajs_recomposition_mapping enable row level security;
