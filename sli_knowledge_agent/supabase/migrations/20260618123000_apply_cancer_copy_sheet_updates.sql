begin;

update guide_ops.category_navigation
set chip_summary = '진단, 치료',
  major_description = '대한민국 사망률 1위 암! 대비 특약을 모았어요!',
  updated_at = now(),
  updated_by = 'codex'
where major_category = '암';

update raw_upload.rider_display_copy
set display_description = case product_rider_code
  when 'A0101' then '암 종류가 달라지면 다시 보장받을 수 있어요.'
  when 'A0102' then '통합암을 가입하면 자동으로 보장받아요.'
  when 'A0103' then '암 종류와 상관없이 처음 1번 보장받아요.'
  when 'A0104' then '일반암을 가입하면 자동으로 보장받아요.'
  when 'A0201' then '검사, 수술, 방사선·약물치료, 재활까지 넓게 보장받아요.'
  when 'A0202' then '비급여, 전액 본인부담 진료까지 보장받을 수 있어요.'
  when 'A0203' then '수술, 방사선·약물치료 보장받아요.'
  when 'A0204' then '소액암 진단 후 수술, 방사선·약물치료 보장받아요.'
  when 'A0205' then '상급종합병원에서 받은 수술, 방사선·약물치료 보장받아요.'
  when 'A0206' then '소액암 진단 후 상급종합병원에서 받은 수술, 방사선·약물치료 보장받아요.'
  when 'A0207' then '연간 치료 횟수가 2회 이상이면 보장받아요.'
  when 'A0208' then '소액암 관련 연간 치료 횟수가 2회 이상이면 보장받아요.'
  when 'A0209' then ''
  when 'A0210' then ''
  when 'A0301' then ''
  when 'A0302' then ''
  when 'A0303' then ''
  when 'A0304' then ''
  when 'A0305' then '통합암과 더불어 보장받을 수 있어요.'
  else display_description
end
where product_rider_code in (
  'A0101','A0102','A0103','A0104','A0201','A0202','A0203','A0204','A0205','A0206',
  'A0207','A0208','A0209','A0210','A0301','A0302','A0303','A0304','A0305'
);

update guide_ops.rider_display_copy
set display_description = case product_rider_code
  when 'A0101' then '암 종류가 달라지면 다시 보장받을 수 있어요.'
  when 'A0102' then '통합암을 가입하면 자동으로 보장받아요.'
  when 'A0103' then '암 종류와 상관없이 처음 1번 보장받아요.'
  when 'A0104' then '일반암을 가입하면 자동으로 보장받아요.'
  when 'A0201' then '검사, 수술, 방사선·약물치료, 재활까지 넓게 보장받아요.'
  when 'A0202' then '비급여, 전액 본인부담 진료까지 보장받을 수 있어요.'
  when 'A0203' then '수술, 방사선·약물치료 보장받아요.'
  when 'A0204' then '소액암 진단 후 수술, 방사선·약물치료 보장받아요.'
  when 'A0205' then '상급종합병원에서 받은 수술, 방사선·약물치료 보장받아요.'
  when 'A0206' then '소액암 진단 후 상급종합병원에서 받은 수술, 방사선·약물치료 보장받아요.'
  when 'A0207' then '연간 치료 횟수가 2회 이상이면 보장받아요.'
  when 'A0208' then '소액암 관련 연간 치료 횟수가 2회 이상이면 보장받아요.'
  when 'A0209' then ''
  when 'A0210' then ''
  when 'A0301' then ''
  when 'A0302' then ''
  when 'A0303' then ''
  when 'A0304' then ''
  when 'A0305' then '통합암과 더불어 보장받을 수 있어요.'
  else display_description
end,
  updated_at = now(),
  updated_by = 'codex'
where product_rider_code in (
  'A0101','A0102','A0103','A0104','A0201','A0202','A0203','A0204','A0205','A0206',
  'A0207','A0208','A0209','A0210','A0301','A0302','A0303','A0304','A0305'
);

update raw_upload.comparison_mapping
set difference_point_1 = case comparison_id
    when 'integratedCancer-vs-generalCancer' then '통합암은 암 종류마다 1번씩 보장 받을 수 있어요.'
    when 'integratedTreatment-vs-directTreatment' then '암 통합 치료는 검사, 수술, 치료, 재활까지 넓게 보장받을 수 있어요.'
    when 'integratedTreatment-vs-nonCoveredTreatment' then '암 통합 치료는 검사, 수술, 치료, 재활까지 넓게 보장받을 수 있어요.'
    when 'directTreatment-vs-complexTreatment' then '암 치료는 진단일부터 10년 동안, 1년마다 1회 치료를 보장받아요.'
    when 'premiumTreatment8-vs-premiumTreatment3' then '암 고액 치료(3종)은 최소 절개로 정밀한 수술이 가능한 다빈치로봇 수술과 전액 본인 부담 항암 약물 치료를 보장받을 수 있어요.'
    else difference_point_1
  end,
  difference_point_2 = case comparison_id
    when 'integratedCancer-vs-generalCancer' then '일반암은 암 종류 상관없이 처음 1번만 보장 받을 수 있어요.'
    when 'integratedTreatment-vs-directTreatment' then '암 치료는 치료 목적이 분명한 수술, 방사선·약물치료까지 보장받아요.'
    when 'integratedTreatment-vs-nonCoveredTreatment' then '비급여 포함하면 건강보험 제외 대상과 전액 본인부담 구간의 진료까지 더 넓게 보장받을 수 있어요.'
    when 'directTreatment-vs-complexTreatment' then '암 복합 치료는 진단일부터 보험기간 내내 보장받을 수 있고,'
    when 'premiumTreatment8-vs-premiumTreatment3' then '암 고액 치료(8종)은 그에 더해 다양한 방사선 치료까지 보장받을 수 있어요.'
    else difference_point_2
  end,
  difference_point_3 = case comparison_id
    when 'integratedCancer-vs-generalCancer' then ''
    when 'integratedTreatment-vs-directTreatment' then ''
    when 'integratedTreatment-vs-nonCoveredTreatment' then ''
    when 'directTreatment-vs-complexTreatment' then '1년 동안 2회 이상 치료 받을 때마다, 1년에 한번씩 보장 받을 수 있어요.'
    when 'premiumTreatment8-vs-premiumTreatment3' then ''
    else difference_point_3
  end,
  legal_notice = case comparison_id
    when 'integratedCancer-vs-generalCancer' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'integratedTreatment-vs-directTreatment' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'integratedTreatment-vs-nonCoveredTreatment' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'directTreatment-vs-complexTreatment' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'premiumTreatment8-vs-premiumTreatment3' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    else legal_notice
  end,
  uploaded_at = now()
where comparison_id in (
  'integratedCancer-vs-generalCancer',
  'integratedTreatment-vs-directTreatment',
  'integratedTreatment-vs-nonCoveredTreatment',
  'directTreatment-vs-complexTreatment',
  'premiumTreatment8-vs-premiumTreatment3'
);

update guide_ops.comparison_mapping
set difference_point_1 = case comparison_id
    when 'integratedCancer-vs-generalCancer' then '통합암은 암 종류마다 1번씩 보장 받을 수 있어요.'
    when 'integratedTreatment-vs-directTreatment' then '암 통합 치료는 검사, 수술, 치료, 재활까지 넓게 보장받을 수 있어요.'
    when 'integratedTreatment-vs-nonCoveredTreatment' then '암 통합 치료는 검사, 수술, 치료, 재활까지 넓게 보장받을 수 있어요.'
    when 'directTreatment-vs-complexTreatment' then '암 치료는 진단일부터 10년 동안, 1년마다 1회 치료를 보장받아요.'
    when 'premiumTreatment8-vs-premiumTreatment3' then '암 고액 치료(3종)은 최소 절개로 정밀한 수술이 가능한 다빈치로봇 수술과 전액 본인 부담 항암 약물 치료를 보장받을 수 있어요.'
    else difference_point_1
  end,
  difference_point_2 = case comparison_id
    when 'integratedCancer-vs-generalCancer' then '일반암은 암 종류 상관없이 처음 1번만 보장 받을 수 있어요.'
    when 'integratedTreatment-vs-directTreatment' then '암 치료는 치료 목적이 분명한 수술, 방사선·약물치료까지 보장받아요.'
    when 'integratedTreatment-vs-nonCoveredTreatment' then '비급여 포함하면 건강보험 제외 대상과 전액 본인부담 구간의 진료까지 더 넓게 보장받을 수 있어요.'
    when 'directTreatment-vs-complexTreatment' then '암 복합 치료는 진단일부터 보험기간 내내 보장받을 수 있고,'
    when 'premiumTreatment8-vs-premiumTreatment3' then '암 고액 치료(8종)은 그에 더해 다양한 방사선 치료까지 보장받을 수 있어요.'
    else difference_point_2
  end,
  difference_point_3 = case comparison_id
    when 'integratedCancer-vs-generalCancer' then ''
    when 'integratedTreatment-vs-directTreatment' then ''
    when 'integratedTreatment-vs-nonCoveredTreatment' then ''
    when 'directTreatment-vs-complexTreatment' then '1년 동안 2회 이상 치료 받을 때마다, 1년에 한번씩 보장 받을 수 있어요.'
    when 'premiumTreatment8-vs-premiumTreatment3' then ''
    else difference_point_3
  end,
  legal_notice = case comparison_id
    when 'integratedCancer-vs-generalCancer' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'integratedTreatment-vs-directTreatment' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'integratedTreatment-vs-nonCoveredTreatment' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'directTreatment-vs-complexTreatment' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'premiumTreatment8-vs-premiumTreatment3' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    else legal_notice
  end,
  updated_at = now(),
  updated_by = 'codex'
where comparison_id in (
  'integratedCancer-vs-generalCancer',
  'integratedTreatment-vs-directTreatment',
  'integratedTreatment-vs-nonCoveredTreatment',
  'directTreatment-vs-complexTreatment',
  'premiumTreatment8-vs-premiumTreatment3'
);

commit;
