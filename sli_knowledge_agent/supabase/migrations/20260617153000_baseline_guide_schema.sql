-- Baseline schema snapshot for sli_knowledge_agent
-- Source project: hgmauxdtuqhpkqxapdlk
-- Captured on: 2026-06-17
--
-- Notes:
-- 1. This baseline is hand-authored from the current live schema and app contract.
-- 2. It is meant to establish a reproducible starting point for future migrations.
-- 3. The app reads the public.guide_app_* views directly via Supabase REST.
-- 4. raw_upload currently exists as a landing schema for CSV-shaped source tables.
-- 5. Security note: the live project currently has a raw_upload RLS exposure warning.
--    This baseline preserves the structural split, but future migrations should review
--    schema exposure, grants, and RLS for raw_upload before broader production use.

create schema if not exists raw_upload;
create schema if not exists guide_ops;

create table if not exists raw_upload.rider_catalog (
  product_rider_code text primary key,
  major_category text,
  middle_category text,
  minor_category text,
  datajs_rider_id text,
  datajs_section text,
  datajs_label text,
  linked_term_ids text,
  linked_comparison_id text,
  operator_note text,
  source_file text default 'rider_catalog_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.term_dictionary (
  term_id text primary key,
  term_label text,
  aliases_csv text,
  matched_minor_categories_csv text,
  used_in_surface text,
  plain_summary text,
  why_it_matters text,
  fit_case text,
  caution text,
  detail_example text,
  compare_target_ids_csv text,
  legal_notice text,
  operator_note text,
  source_file text default 'term_dictionary_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.comparison_mapping (
  comparison_id text primary key,
  difference_point_1 text,
  difference_point_2 text,
  difference_point_3 text,
  left_fit_case text,
  left_title text,
  legal_notice text,
  operator_note text,
  right_fit_case text,
  right_title text,
  used_in_surface text,
  source_file text default 'comparison_mapping_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.event_guidance (
  event_id text primary key,
  linked_behavior text,
  message_template text,
  operator_note text,
  title_template text,
  trigger_condition text,
  trigger_type text,
  used_in_surface text,
  source_file text default 'event_guidance_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.rider_display_copy (
  product_rider_code text primary key,
  consult_topic text,
  copy_status text,
  datajs_rider_id text,
  display_description text,
  major_category text,
  middle_category text,
  minor_category text,
  operator_note text,
  source_tooltip_plain text,
  source_file text default 'rider_display_copy_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.rider_helper (
  product_rider_code text primary key,
  datajs_rider_id text,
  helper_text text,
  operator_note text,
  rider_label text,
  used_in_surface text,
  source_file text default 'rider_helper_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.rider_option_catalog (
  product_rider_code text not null,
  datajs_rider_id text,
  major_category text,
  middle_category text,
  minor_category text,
  option_group_type text not null,
  option_order integer not null,
  option_label_raw text,
  option_value_normalized text,
  is_joinable_option boolean,
  is_default_option boolean,
  operator_note text,
  source_file text default 'rider_option_catalog_normalized.csv',
  uploaded_at timestamptz not null default now(),
  primary key (product_rider_code, option_group_type, option_order)
);

create table if not exists raw_upload.rider_runtime_seed (
  product_rider_code text primary key,
  datajs_rider_id text,
  datajs_label text,
  default_selected_amount text,
  default_enabled boolean,
  display_monthly_premium_krw integer,
  runtime_source_type text,
  operator_note text,
  source_file text default 'rider_runtime_seed_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.consult_template (
  template_id text primary key,
  context_block_title text,
  dynamic_field_1_label text,
  dynamic_field_1_source text,
  dynamic_field_2_label text,
  dynamic_field_2_source text,
  dynamic_field_3_label text,
  dynamic_field_3_source text,
  dynamic_field_4_label text,
  dynamic_field_4_source text,
  intro_copy text,
  legal_notice text,
  operator_note text,
  primary_cta text,
  title text,
  used_in_surface text,
  source_file text default 'consult_template_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.ui_surface_mapping (
  surface_id text primary key,
  surface_name text,
  screen_position text,
  trigger text,
  primary_source_file text,
  primary_source_key text,
  primary_source_fields text,
  secondary_source_file text,
  secondary_source_key text,
  secondary_source_fields text,
  render_target_in_code text,
  operator_edit_guide text,
  source_file text default 'ui_surface_mapping_normalized.csv',
  uploaded_at timestamptz not null default now()
);

create table if not exists raw_upload.datajs_recomposition_mapping (
  datajs_object text not null,
  datajs_field_or_path text not null,
  source_file text,
  join_key text,
  source_columns text,
  recomposition_rule text,
  notes text,
  uploaded_at timestamptz not null default now(),
  primary key (datajs_object, datajs_field_or_path)
);

create table if not exists guide_ops.rider_catalog (
  product_rider_code text primary key,
  major_category text,
  middle_category text,
  minor_category text,
  datajs_rider_id text,
  datajs_section text,
  datajs_label text,
  linked_term_ids text,
  linked_comparison_id text,
  operator_note text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'rider_catalog_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.term_dictionary (
  term_id text primary key,
  term_label text,
  aliases_csv text,
  matched_minor_categories_csv text,
  used_in_surface text,
  plain_summary text,
  why_it_matters text,
  fit_case text,
  caution text,
  detail_example text,
  compare_target_ids_csv text,
  legal_notice text,
  operator_note text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'term_dictionary_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.comparison_mapping (
  comparison_id text primary key,
  difference_point_1 text,
  difference_point_2 text,
  difference_point_3 text,
  left_fit_case text,
  left_title text,
  legal_notice text,
  operator_note text,
  right_fit_case text,
  right_title text,
  used_in_surface text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'comparison_mapping_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.event_guidance (
  event_id text primary key,
  linked_behavior text,
  message_template text,
  operator_note text,
  title_template text,
  trigger_condition text,
  trigger_type text,
  used_in_surface text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'event_guidance_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.rider_display_copy (
  product_rider_code text primary key,
  consult_topic text,
  copy_status text,
  datajs_rider_id text,
  display_description text,
  major_category text,
  middle_category text,
  minor_category text,
  operator_note text,
  source_tooltip_plain text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'rider_display_copy_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.rider_helper (
  product_rider_code text primary key,
  datajs_rider_id text,
  helper_text text,
  operator_note text,
  rider_label text,
  used_in_surface text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'rider_helper_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.rider_option_catalog (
  product_rider_code text not null,
  datajs_rider_id text,
  major_category text,
  middle_category text,
  minor_category text,
  option_group_type text not null,
  option_order integer not null,
  option_label_raw text,
  option_value_normalized text,
  is_joinable_option boolean,
  is_default_option boolean,
  operator_note text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'rider_option_catalog_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex',
  primary key (product_rider_code, option_group_type, option_order)
);

create table if not exists guide_ops.rider_runtime_seed (
  product_rider_code text primary key,
  datajs_rider_id text,
  datajs_label text,
  default_selected_amount text,
  default_enabled boolean,
  display_monthly_premium_krw integer,
  runtime_source_type text,
  operator_note text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'rider_runtime_seed_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.consult_template (
  template_id text primary key,
  context_block_title text,
  dynamic_field_1_label text,
  dynamic_field_1_source text,
  dynamic_field_2_label text,
  dynamic_field_2_source text,
  dynamic_field_3_label text,
  dynamic_field_3_source text,
  dynamic_field_4_label text,
  dynamic_field_4_source text,
  intro_copy text,
  legal_notice text,
  operator_note text,
  primary_cta text,
  title text,
  used_in_surface text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'consult_template_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.ui_surface_mapping (
  surface_id text primary key,
  surface_name text,
  screen_position text,
  trigger text,
  primary_source_file text,
  primary_source_key text,
  primary_source_fields text,
  secondary_source_file text,
  secondary_source_key text,
  secondary_source_fields text,
  render_target_in_code text,
  operator_edit_guide text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  source_file text not null default 'ui_surface_mapping_normalized.csv',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.datajs_recomposition_mapping (
  datajs_object text not null,
  datajs_field_or_path text not null,
  source_file text,
  join_key text,
  source_columns text,
  recomposition_rule text,
  notes text,
  is_active boolean not null default true,
  version_tag text not null default 'ver3',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex',
  primary key (datajs_object, datajs_field_or_path)
);

create table if not exists guide_ops.term_aliases (
  term_id text not null,
  alias text not null,
  sort_order integer not null,
  primary key (term_id, alias)
);

create table if not exists guide_ops.term_comparison_links (
  term_id text not null,
  comparison_id text not null,
  sort_order integer not null,
  primary key (term_id, comparison_id)
);

create table if not exists guide_ops.rider_term_links (
  product_rider_code text not null,
  term_id text not null,
  sort_order integer not null,
  primary key (product_rider_code, term_id)
);

create table if not exists guide_ops.category_navigation (
  major_category text primary key,
  major_label text not null,
  chip_summary text,
  major_description text,
  major_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex'
);

create table if not exists guide_ops.category_group_mapping (
  major_category text not null,
  middle_category text not null,
  middle_label text not null,
  middle_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text default 'codex',
  primary key (major_category, middle_category)
);

alter table guide_ops.rider_display_copy
  drop constraint if exists rider_display_copy_product_rider_code_fkey,
  add constraint rider_display_copy_product_rider_code_fkey
  foreign key (product_rider_code) references guide_ops.rider_catalog(product_rider_code);

alter table guide_ops.rider_helper
  drop constraint if exists rider_helper_product_rider_code_fkey,
  add constraint rider_helper_product_rider_code_fkey
  foreign key (product_rider_code) references guide_ops.rider_catalog(product_rider_code);

alter table guide_ops.rider_option_catalog
  drop constraint if exists rider_option_catalog_product_rider_code_fkey,
  add constraint rider_option_catalog_product_rider_code_fkey
  foreign key (product_rider_code) references guide_ops.rider_catalog(product_rider_code);

alter table guide_ops.rider_runtime_seed
  drop constraint if exists rider_runtime_seed_product_rider_code_fkey,
  add constraint rider_runtime_seed_product_rider_code_fkey
  foreign key (product_rider_code) references guide_ops.rider_catalog(product_rider_code);

alter table guide_ops.term_aliases
  drop constraint if exists term_aliases_term_id_fkey,
  add constraint term_aliases_term_id_fkey
  foreign key (term_id) references guide_ops.term_dictionary(term_id);

alter table guide_ops.term_comparison_links
  drop constraint if exists term_comparison_links_term_id_fkey,
  add constraint term_comparison_links_term_id_fkey
  foreign key (term_id) references guide_ops.term_dictionary(term_id),
  drop constraint if exists term_comparison_links_comparison_id_fkey,
  add constraint term_comparison_links_comparison_id_fkey
  foreign key (comparison_id) references guide_ops.comparison_mapping(comparison_id);

alter table guide_ops.rider_term_links
  drop constraint if exists rider_term_links_product_rider_code_fkey,
  add constraint rider_term_links_product_rider_code_fkey
  foreign key (product_rider_code) references guide_ops.rider_catalog(product_rider_code),
  drop constraint if exists rider_term_links_term_id_fkey,
  add constraint rider_term_links_term_id_fkey
  foreign key (term_id) references guide_ops.term_dictionary(term_id);

alter table guide_ops.category_group_mapping
  drop constraint if exists category_group_mapping_major_category_fkey,
  add constraint category_group_mapping_major_category_fkey
  foreign key (major_category) references guide_ops.category_navigation(major_category);

alter table guide_ops.rider_catalog enable row level security;
alter table guide_ops.term_dictionary enable row level security;
alter table guide_ops.comparison_mapping enable row level security;
alter table guide_ops.event_guidance enable row level security;
alter table guide_ops.rider_display_copy enable row level security;
alter table guide_ops.rider_helper enable row level security;
alter table guide_ops.rider_option_catalog enable row level security;
alter table guide_ops.rider_runtime_seed enable row level security;
alter table guide_ops.consult_template enable row level security;
alter table guide_ops.ui_surface_mapping enable row level security;
alter table guide_ops.datajs_recomposition_mapping enable row level security;
alter table guide_ops.term_aliases enable row level security;
alter table guide_ops.term_comparison_links enable row level security;
alter table guide_ops.rider_term_links enable row level security;
alter table guide_ops.category_navigation enable row level security;
alter table guide_ops.category_group_mapping enable row level security;

drop policy if exists guide_public_read_category_group_mapping on guide_ops.category_group_mapping;
create policy guide_public_read_category_group_mapping
  on guide_ops.category_group_mapping
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_category_navigation on guide_ops.category_navigation;
create policy guide_public_read_category_navigation
  on guide_ops.category_navigation
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_comparison_mapping on guide_ops.comparison_mapping;
create policy guide_public_read_comparison_mapping
  on guide_ops.comparison_mapping
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_consult_template on guide_ops.consult_template;
create policy guide_public_read_consult_template
  on guide_ops.consult_template
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_event_guidance on guide_ops.event_guidance;
create policy guide_public_read_event_guidance
  on guide_ops.event_guidance
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_rider_catalog on guide_ops.rider_catalog;
create policy guide_public_read_rider_catalog
  on guide_ops.rider_catalog
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_rider_display_copy on guide_ops.rider_display_copy;
create policy guide_public_read_rider_display_copy
  on guide_ops.rider_display_copy
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_rider_helper on guide_ops.rider_helper;
create policy guide_public_read_rider_helper
  on guide_ops.rider_helper
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_rider_option_catalog on guide_ops.rider_option_catalog;
create policy guide_public_read_rider_option_catalog
  on guide_ops.rider_option_catalog
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_rider_runtime_seed on guide_ops.rider_runtime_seed;
create policy guide_public_read_rider_runtime_seed
  on guide_ops.rider_runtime_seed
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists guide_public_read_term_dictionary on guide_ops.term_dictionary;
create policy guide_public_read_term_dictionary
  on guide_ops.term_dictionary
  for select
  to anon, authenticated
  using (is_active);

create or replace view public.guide_app_categories
with (security_invoker = true) as
select
  major_category,
  major_label,
  chip_summary,
  major_description,
  major_order,
  is_active
from guide_ops.category_navigation
where is_active;

create or replace view public.guide_app_category_groups
with (security_invoker = true) as
select
  major_category,
  middle_category,
  middle_label,
  middle_order,
  is_active
from guide_ops.category_group_mapping
where is_active;

create or replace view public.guide_app_comparisons
with (security_invoker = true) as
select
  comparison_id,
  concat_ws(' vs ', nullif(left_title, ''), nullif(right_title, '')) as title,
  left_title,
  right_title,
  left_fit_case,
  right_fit_case,
  difference_point_1,
  difference_point_2,
  difference_point_3,
  legal_notice,
  used_in_surface,
  version_tag
from guide_ops.comparison_mapping
where is_active;

create or replace view public.guide_app_consult_template
with (security_invoker = true) as
select
  template_id,
  title,
  intro_copy,
  context_block_title,
  primary_cta,
  legal_notice,
  used_in_surface,
  version_tag
from guide_ops.consult_template
where is_active;

create or replace view public.guide_app_guide_messages
with (security_invoker = true) as
select
  event_id,
  trigger_type,
  trigger_condition,
  title_template,
  message_template,
  linked_behavior,
  used_in_surface,
  version_tag
from guide_ops.event_guidance
where is_active;

create or replace view public.guide_app_rider_options
with (security_invoker = true) as
select
  product_rider_code,
  datajs_rider_id as rider_id,
  option_group_type,
  option_order,
  option_label_raw,
  option_value_normalized,
  coalesce(is_joinable_option, false) as is_joinable_option,
  coalesce(is_default_option, false) as is_default_option,
  version_tag
from guide_ops.rider_option_catalog
where is_active;

create or replace view public.guide_app_riders
with (security_invoker = true) as
select
  rc.product_rider_code,
  rc.major_category,
  rc.middle_category,
  rc.minor_category,
  rc.datajs_rider_id as rider_id,
  coalesce(nullif(rc.datajs_section, ''), '기타') as section,
  coalesce(nullif(rc.datajs_label, ''), rc.product_rider_code) as label,
  coalesce(nullif(rc.linked_term_ids, ''), '') as linked_term_ids,
  coalesce(nullif(rc.linked_comparison_id, ''), '') as linked_comparison_id,
  coalesce(rdc.display_description, '') as description,
  coalesce(rdc.consult_topic, '') as consult_topic,
  coalesce(rdc.source_tooltip_plain, '') as source_tooltip_plain,
  coalesce(rh.helper_text, '') as helper_text,
  nullif(rrs.default_selected_amount, '') as default_selected_amount,
  coalesce(rrs.default_enabled, false) as default_enabled,
  coalesce(rrs.display_monthly_premium_krw, 0) as display_monthly_premium_krw,
  rc.version_tag
from guide_ops.rider_catalog rc
left join guide_ops.rider_display_copy rdc using (product_rider_code)
left join guide_ops.rider_helper rh using (product_rider_code)
left join guide_ops.rider_runtime_seed rrs using (product_rider_code)
where rc.is_active;

create or replace view public.guide_app_terms
with (security_invoker = true) as
select
  term_id,
  term_label,
  aliases_csv,
  plain_summary,
  why_it_matters,
  fit_case,
  caution,
  legal_notice,
  compare_target_ids_csv,
  detail_example,
  used_in_surface,
  version_tag
from guide_ops.term_dictionary
where is_active;

grant usage on schema guide_ops to anon, authenticated, service_role;

grant select on table guide_ops.category_group_mapping to anon, authenticated;
grant select on table guide_ops.category_navigation to anon, authenticated;
grant select on table guide_ops.comparison_mapping to anon, authenticated;
grant select on table guide_ops.consult_template to anon, authenticated;
grant select on table guide_ops.event_guidance to anon, authenticated;
grant select on table guide_ops.rider_catalog to anon, authenticated;
grant select on table guide_ops.rider_display_copy to anon, authenticated;
grant select on table guide_ops.rider_helper to anon, authenticated;
grant select on table guide_ops.rider_option_catalog to anon, authenticated;
grant select on table guide_ops.rider_runtime_seed to anon, authenticated;
grant select on table guide_ops.term_dictionary to anon, authenticated;

grant select on table public.guide_app_categories to anon, authenticated, service_role;
grant select on table public.guide_app_category_groups to anon, authenticated, service_role;
grant select on table public.guide_app_comparisons to anon, authenticated, service_role;
grant select on table public.guide_app_consult_template to anon, authenticated, service_role;
grant select on table public.guide_app_guide_messages to anon, authenticated, service_role;
grant select on table public.guide_app_rider_options to anon, authenticated, service_role;
grant select on table public.guide_app_riders to anon, authenticated, service_role;
grant select on table public.guide_app_terms to anon, authenticated, service_role;
