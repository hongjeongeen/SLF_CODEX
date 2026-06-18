begin;

update raw_upload.term_dictionary
set term_label = case term_id
    when 'tertiaryHospital' then '상급병원'
    else term_label
  end,
  plain_summary = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '갑상선암, 기타 피부암 등 약관에서 소액암으로 분류된 암을 말합니다.'
    when 'generalCancer' then ''
    when 'nonCovered' then '병원비를 본인이 100% 내야하는 항목을 말합니다.'
    when 'tertiaryHospital' then '의료법에서 정한 "상급종합병원"에 해당하는 병원을 말합니다.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else plain_summary
  end,
  fit_case = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '갑상선암, 기타피부암, 경계성종양, 제자리암 관련 보장을 받고 싶을 때'
    when 'generalCancer' then ''
    when 'nonCovered' then '국민건강보험공단에서 지원해주지 않아서 병원비가 천차만별인 항목까지 보장받고 싶을 때'
    when 'tertiaryHospital' then '큰 병원에서 치료 받을 경우 보장 받을 수 있어요.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else fit_case
  end,
  detail_example = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '어떤 암이 소액암으로 분류되는지는 약관을 꼭 확인해야해요.'
    when 'generalCancer' then ''
    when 'nonCovered' then '예 : 국민건강보험 대상이 아니거나 지급 기준을 넘겨 100% 본인이 병원비를 내야하는 경우'
    when 'tertiaryHospital' then '예: 서울대병원, 삼성서울병원이 대표적인 상급종합병원이에요.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else detail_example
  end,
  legal_notice = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'generalCancer' then ''
    when 'nonCovered' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'tertiaryHospital' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else legal_notice
  end,
  why_it_matters = case term_id
    when 'integratedCancer' then ''
    when 'generalCancer' then ''
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else why_it_matters
  end,
  caution = case term_id
    when 'integratedCancer' then ''
    when 'generalCancer' then ''
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else caution
  end,
  uploaded_at = now()
where term_id in (
  'integratedCancer',
  'smallCancer',
  'generalCancer',
  'nonCovered',
  'tertiaryHospital',
  'directTreatment',
  'antiCancerDrug',
  'antiCancerRadiation'
);

update guide_ops.term_dictionary
set term_label = case term_id
    when 'tertiaryHospital' then '상급병원'
    else term_label
  end,
  plain_summary = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '갑상선암, 기타 피부암 등 약관에서 소액암으로 분류된 암을 말합니다.'
    when 'generalCancer' then ''
    when 'nonCovered' then '병원비를 본인이 100% 내야하는 항목을 말합니다.'
    when 'tertiaryHospital' then '의료법에서 정한 "상급종합병원"에 해당하는 병원을 말합니다.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else plain_summary
  end,
  fit_case = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '갑상선암, 기타피부암, 경계성종양, 제자리암 관련 보장을 받고 싶을 때'
    when 'generalCancer' then ''
    when 'nonCovered' then '국민건강보험공단에서 지원해주지 않아서 병원비가 천차만별인 항목까지 보장받고 싶을 때'
    when 'tertiaryHospital' then '큰 병원에서 치료 받을 경우 보장 받을 수 있어요.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else fit_case
  end,
  detail_example = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '어떤 암이 소액암으로 분류되는지는 약관을 꼭 확인해야해요.'
    when 'generalCancer' then ''
    when 'nonCovered' then '예 : 국민건강보험 대상이 아니거나 지급 기준을 넘겨 100% 본인이 병원비를 내야하는 경우'
    when 'tertiaryHospital' then '예: 서울대병원, 삼성서울병원이 대표적인 상급종합병원이에요.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else detail_example
  end,
  legal_notice = case term_id
    when 'integratedCancer' then ''
    when 'smallCancer' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'generalCancer' then ''
    when 'nonCovered' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'tertiaryHospital' then '자세한 사항은 약관을 꼭 확인해 주세요.'
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else legal_notice
  end,
  why_it_matters = case term_id
    when 'integratedCancer' then ''
    when 'generalCancer' then ''
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else why_it_matters
  end,
  caution = case term_id
    when 'integratedCancer' then ''
    when 'generalCancer' then ''
    when 'directTreatment' then ''
    when 'antiCancerDrug' then ''
    when 'antiCancerRadiation' then ''
    else caution
  end,
  updated_at = now(),
  updated_by = 'codex'
where term_id in (
  'integratedCancer',
  'smallCancer',
  'generalCancer',
  'nonCovered',
  'tertiaryHospital',
  'directTreatment',
  'antiCancerDrug',
  'antiCancerRadiation'
);

commit;
