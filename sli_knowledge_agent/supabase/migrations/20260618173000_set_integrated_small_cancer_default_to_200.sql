begin;

update raw_upload.rider_runtime_seed
set default_selected_amount = '200만원',
    default_enabled = true,
    operator_note = '통합소액암 디폴트 가입금액 200만원으로 조정'
where product_rider_code = 'A0102';

update guide_ops.rider_runtime_seed
set default_selected_amount = '200만원',
    default_enabled = true,
    operator_note = '통합소액암 디폴트 가입금액 200만원으로 조정'
where product_rider_code = 'A0102';

update raw_upload.rider_option_catalog
set option_group_type = 'selectable_amount',
    is_default_option = false,
    operator_note = '통합소액암 디폴트 200만원 반영용 선택지 재구성'
where product_rider_code = 'A0102'
  and option_order = 1;

insert into raw_upload.rider_option_catalog (
  product_rider_code,
  datajs_rider_id,
  major_category,
  middle_category,
  minor_category,
  option_group_type,
  option_order,
  option_label_raw,
  option_value_normalized,
  is_joinable_option,
  is_default_option,
  operator_note
)
select
  'A0102',
  'integrated-small-cancer',
  '암',
  '암 진단',
  '통합소액암',
  'selectable_amount',
  2,
  '200만원',
  '200만원',
  true,
  true,
  '통합소액암 디폴트 가입금액 200만원으로 조정'
where not exists (
  select 1
  from raw_upload.rider_option_catalog
  where product_rider_code = 'A0102'
    and option_order = 2
);

update raw_upload.rider_option_catalog
set option_group_type = 'selectable_amount',
    option_label_raw = '200만원',
    option_value_normalized = '200만원',
    is_joinable_option = true,
    is_default_option = true,
    operator_note = '통합소액암 디폴트 가입금액 200만원으로 조정'
where product_rider_code = 'A0102'
  and option_order = 2;

update guide_ops.rider_option_catalog
set option_group_type = 'selectable_amount',
    is_default_option = false,
    operator_note = '통합소액암 디폴트 200만원 반영용 선택지 재구성'
where product_rider_code = 'A0102'
  and option_order = 1;

insert into guide_ops.rider_option_catalog (
  product_rider_code,
  datajs_rider_id,
  major_category,
  middle_category,
  minor_category,
  option_group_type,
  option_order,
  option_label_raw,
  option_value_normalized,
  is_joinable_option,
  is_default_option,
  operator_note
)
select
  'A0102',
  'integrated-small-cancer',
  '암',
  '암 진단',
  '통합소액암',
  'selectable_amount',
  2,
  '200만원',
  '200만원',
  true,
  true,
  '통합소액암 디폴트 가입금액 200만원으로 조정'
where not exists (
  select 1
  from guide_ops.rider_option_catalog
  where product_rider_code = 'A0102'
    and option_order = 2
);

update guide_ops.rider_option_catalog
set option_group_type = 'selectable_amount',
    option_label_raw = '200만원',
    option_value_normalized = '200만원',
    is_joinable_option = true,
    is_default_option = true,
    operator_note = '통합소액암 디폴트 가입금액 200만원으로 조정'
where product_rider_code = 'A0102'
  and option_order = 2;

commit;
