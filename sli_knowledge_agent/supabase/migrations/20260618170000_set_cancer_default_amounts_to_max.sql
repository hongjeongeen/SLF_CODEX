begin;

update raw_upload.rider_runtime_seed
set default_selected_amount = case product_rider_code
    when 'A0101' then '3,000만원'
    when 'A0103' then '3,000만원'
    when 'A0104' then '200만원'
    when 'A0201' then '8,000만원'
    when 'A0202' then '8,000만원'
    when 'A0203' then '1,000만원'
    when 'A0204' then '200만원'
    when 'A0205' then '1,000만원'
    when 'A0206' then '200만원'
    when 'A0207' then '1,000만원'
    when 'A0208' then '200만원'
    when 'A0209' then '3,000만원'
    when 'A0210' then '3,000만원'
    when 'A0301' then '5,000만원'
    when 'A0302' then '1,000만원'
    when 'A0303' then '5,000만원'
    when 'A0304' then '8,000만원'
    when 'A0305' then '2,000만원'
    else default_selected_amount
  end,
  default_enabled = case
    when product_rider_code in ('A0101','A0103','A0104','A0201','A0202','A0203','A0204','A0205','A0206','A0207','A0208','A0209','A0210','A0301','A0302','A0303','A0304','A0305') then true
    else default_enabled
  end,
  runtime_source_type = case
    when product_rider_code in ('A0104','A0208','A0302','A0303','A0304','A0305') then 'prototype_seed_static'
    else runtime_source_type
  end,
  operator_note = case product_rider_code
    when 'A0301' then '이미 최대값이므로 유지'
    when 'A0102' then operator_note
    else '암 섹션 최대 가입금액 기본값으로 조정'
  end
where product_rider_code like 'A%';

update guide_ops.rider_runtime_seed
set default_selected_amount = case product_rider_code
    when 'A0101' then '3,000만원'
    when 'A0103' then '3,000만원'
    when 'A0104' then '200만원'
    when 'A0201' then '8,000만원'
    when 'A0202' then '8,000만원'
    when 'A0203' then '1,000만원'
    when 'A0204' then '200만원'
    when 'A0205' then '1,000만원'
    when 'A0206' then '200만원'
    when 'A0207' then '1,000만원'
    when 'A0208' then '200만원'
    when 'A0209' then '3,000만원'
    when 'A0210' then '3,000만원'
    when 'A0301' then '5,000만원'
    when 'A0302' then '1,000만원'
    when 'A0303' then '5,000만원'
    when 'A0304' then '8,000만원'
    when 'A0305' then '2,000만원'
    else default_selected_amount
  end,
  default_enabled = case
    when product_rider_code in ('A0101','A0103','A0104','A0201','A0202','A0203','A0204','A0205','A0206','A0207','A0208','A0209','A0210','A0301','A0302','A0303','A0304','A0305') then true
    else default_enabled
  end,
  runtime_source_type = case
    when product_rider_code in ('A0104','A0208','A0302','A0303','A0304','A0305') then 'prototype_seed_static'
    else runtime_source_type
  end,
  operator_note = case product_rider_code
    when 'A0301' then '이미 최대값이므로 유지'
    when 'A0102' then operator_note
    else '암 섹션 최대 가입금액 기본값으로 조정'
  end
where product_rider_code like 'A%';

update raw_upload.rider_option_catalog
set is_default_option = case
    when product_rider_code = 'A0101' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0103' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0201' and option_value_normalized = '8,000만원' then true
    when product_rider_code = 'A0202' and option_value_normalized = '8,000만원' then true
    when product_rider_code = 'A0203' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0204' and option_value_normalized = '200만원' then true
    when product_rider_code = 'A0205' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0206' and option_value_normalized = '200만원' then true
    when product_rider_code = 'A0207' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0208' and option_value_normalized = '200만원' then true
    when product_rider_code = 'A0209' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0210' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0301' and option_value_normalized = '5,000만원' then true
    when product_rider_code = 'A0302' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0303' and option_value_normalized = '5,000만원' then true
    else false
  end
where product_rider_code in (
  'A0101','A0103','A0201','A0202','A0203','A0204','A0205','A0206','A0207','A0208','A0209','A0210','A0301','A0302','A0303'
);

update guide_ops.rider_option_catalog
set is_default_option = case
    when product_rider_code = 'A0101' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0103' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0201' and option_value_normalized = '8,000만원' then true
    when product_rider_code = 'A0202' and option_value_normalized = '8,000만원' then true
    when product_rider_code = 'A0203' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0204' and option_value_normalized = '200만원' then true
    when product_rider_code = 'A0205' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0206' and option_value_normalized = '200만원' then true
    when product_rider_code = 'A0207' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0208' and option_value_normalized = '200만원' then true
    when product_rider_code = 'A0209' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0210' and option_value_normalized = '3,000만원' then true
    when product_rider_code = 'A0301' and option_value_normalized = '5,000만원' then true
    when product_rider_code = 'A0302' and option_value_normalized = '1,000만원' then true
    when product_rider_code = 'A0303' and option_value_normalized = '5,000만원' then true
    else false
  end
where product_rider_code in (
  'A0101','A0103','A0201','A0202','A0203','A0204','A0205','A0206','A0207','A0208','A0209','A0210','A0301','A0302','A0303'
);

commit;
