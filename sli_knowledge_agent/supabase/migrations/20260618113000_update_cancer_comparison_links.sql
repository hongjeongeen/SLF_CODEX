begin;

update raw_upload.rider_catalog
set linked_comparison_id = case
  when product_rider_code in ('A0102', 'A0204', 'A0205', 'A0206', 'A0209', 'A0210') then ''
  when product_rider_code = 'A0207' then 'directTreatment-vs-complexTreatment'
  when product_rider_code in ('A0301', 'A0302') then 'premiumTreatment8-vs-premiumTreatment3'
  else linked_comparison_id
end
where product_rider_code in ('A0102', 'A0204', 'A0205', 'A0206', 'A0207', 'A0209', 'A0210', 'A0301', 'A0302');

update guide_ops.rider_catalog
set linked_comparison_id = case
    when product_rider_code in ('A0102', 'A0204', 'A0205', 'A0206', 'A0209', 'A0210') then ''
    when product_rider_code = 'A0207' then 'directTreatment-vs-complexTreatment'
    when product_rider_code in ('A0301', 'A0302') then 'premiumTreatment8-vs-premiumTreatment3'
    else linked_comparison_id
  end,
  updated_at = now(),
  updated_by = 'codex'
where product_rider_code in ('A0102', 'A0204', 'A0205', 'A0206', 'A0207', 'A0209', 'A0210', 'A0301', 'A0302');

update raw_upload.term_dictionary
set compare_target_ids_csv = ''
where term_id in ('smallCancer', 'tertiaryHospital', 'antiCancerDrug', 'antiCancerRadiation');

update guide_ops.term_dictionary
set compare_target_ids_csv = '',
  updated_at = now(),
  updated_by = 'codex'
where term_id in ('smallCancer', 'tertiaryHospital', 'antiCancerDrug', 'antiCancerRadiation');

delete from raw_upload.comparison_mapping
where comparison_id in (
  'smallCancer-vs-generalCancer',
  'directTreatment-vs-drugRadiation',
  'treatment-vs-tertiaryTreatment'
);

update guide_ops.comparison_mapping
set is_active = false,
  updated_at = now(),
  updated_by = 'codex'
where comparison_id in (
  'smallCancer-vs-generalCancer',
  'directTreatment-vs-drugRadiation',
  'treatment-vs-tertiaryTreatment'
);

insert into raw_upload.comparison_mapping (
  comparison_id,
  difference_point_1,
  difference_point_2,
  difference_point_3,
  left_fit_case,
  left_title,
  legal_notice,
  operator_note,
  right_fit_case,
  right_title,
  used_in_surface
) values
  (
    'directTreatment-vs-complexTreatment',
    '암 치료는 수술, 방사선, 약물치료처럼 직접치료 자체를 연 단위로 보는 구조예요.',
    '암 복합 치료는 연간 치료 횟수가 2회 이상일 때를 따로 보는 구조예요.',
    '같은 치료 보장처럼 보여도 기준이 치료 종류인지, 여러 치료가 함께 일어난 상황인지가 달라요.',
    '직접치료가 어떤 범위를 뜻하는지 먼저 이해하고 싶을 때 보기 좋아요.',
    '암 치료',
    '직접치료 인정 범위와 연간 치료 횟수 기준은 약관을 꼭 확인해 주세요.',
    'codex update 2026-06-18',
    '여러 치료가 함께 일어나는 경우를 따로 보고 싶을 때 살펴보면 좋아요.',
    '암 복합 치료',
    'comparison_drawer'
  ),
  (
    'premiumTreatment8-vs-premiumTreatment3',
    '암 고액 치료(8종)은 고액 치료 범위를 더 넓게 묶어 보는 구조예요.',
    '암 고액 치료(3종)은 그중 일부 고액 치료만 추려서 보는 구조예요.',
    '둘 다 고액 치료 특약이지만 포함되는 치료 종류 수가 달라요.',
    '고액 치료 범위를 넓게 보고 싶을 때 살펴보면 좋아요.',
    '암 고액 치료(8종)',
    '어떤 치료가 8종과 3종에 각각 포함되는지는 약관을 꼭 확인해 주세요.',
    'codex update 2026-06-18',
    '핵심 고액 치료 몇 가지만 먼저 확인하고 싶을 때 보기 좋아요.',
    '암 고액 치료(3종)',
    'comparison_drawer'
  )
on conflict (comparison_id) do update
set difference_point_1 = excluded.difference_point_1,
  difference_point_2 = excluded.difference_point_2,
  difference_point_3 = excluded.difference_point_3,
  left_fit_case = excluded.left_fit_case,
  left_title = excluded.left_title,
  legal_notice = excluded.legal_notice,
  operator_note = excluded.operator_note,
  right_fit_case = excluded.right_fit_case,
  right_title = excluded.right_title,
  used_in_surface = excluded.used_in_surface,
  source_file = 'comparison_mapping_normalized.csv',
  uploaded_at = now();

insert into guide_ops.comparison_mapping (
  comparison_id,
  difference_point_1,
  difference_point_2,
  difference_point_3,
  left_fit_case,
  left_title,
  legal_notice,
  operator_note,
  right_fit_case,
  right_title,
  used_in_surface,
  is_active,
  version_tag,
  source_file,
  updated_by
) values
  (
    'directTreatment-vs-complexTreatment',
    '암 치료는 수술, 방사선, 약물치료처럼 직접치료 자체를 연 단위로 보는 구조예요.',
    '암 복합 치료는 연간 치료 횟수가 2회 이상일 때를 따로 보는 구조예요.',
    '같은 치료 보장처럼 보여도 기준이 치료 종류인지, 여러 치료가 함께 일어난 상황인지가 달라요.',
    '직접치료가 어떤 범위를 뜻하는지 먼저 이해하고 싶을 때 보기 좋아요.',
    '암 치료',
    '직접치료 인정 범위와 연간 치료 횟수 기준은 약관을 꼭 확인해 주세요.',
    'codex update 2026-06-18',
    '여러 치료가 함께 일어나는 경우를 따로 보고 싶을 때 살펴보면 좋아요.',
    '암 복합 치료',
    'comparison_drawer',
    true,
    'ver3',
    'comparison_mapping_normalized.csv',
    'codex'
  ),
  (
    'premiumTreatment8-vs-premiumTreatment3',
    '암 고액 치료(8종)은 고액 치료 범위를 더 넓게 묶어 보는 구조예요.',
    '암 고액 치료(3종)은 그중 일부 고액 치료만 추려서 보는 구조예요.',
    '둘 다 고액 치료 특약이지만 포함되는 치료 종류 수가 달라요.',
    '고액 치료 범위를 넓게 보고 싶을 때 살펴보면 좋아요.',
    '암 고액 치료(8종)',
    '어떤 치료가 8종과 3종에 각각 포함되는지는 약관을 꼭 확인해 주세요.',
    'codex update 2026-06-18',
    '핵심 고액 치료 몇 가지만 먼저 확인하고 싶을 때 보기 좋아요.',
    '암 고액 치료(3종)',
    'comparison_drawer',
    true,
    'ver3',
    'comparison_mapping_normalized.csv',
    'codex'
  )
on conflict (comparison_id) do update
set difference_point_1 = excluded.difference_point_1,
  difference_point_2 = excluded.difference_point_2,
  difference_point_3 = excluded.difference_point_3,
  left_fit_case = excluded.left_fit_case,
  left_title = excluded.left_title,
  legal_notice = excluded.legal_notice,
  operator_note = excluded.operator_note,
  right_fit_case = excluded.right_fit_case,
  right_title = excluded.right_title,
  used_in_surface = excluded.used_in_surface,
  is_active = true,
  version_tag = excluded.version_tag,
  source_file = excluded.source_file,
  updated_at = now(),
  updated_by = excluded.updated_by;

commit;
