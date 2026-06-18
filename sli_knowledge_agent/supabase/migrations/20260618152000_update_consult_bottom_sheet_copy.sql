begin;

update raw_upload.consult_template
set context_block_title = '상담에서 공유받는 내용',
  intro_copy = '지금 보고 있던 보장 내용을 공유해서 궁금한 부분만 상담 받을 수 있어요.',
  legal_notice = '',
  operator_note = '상담 연결 바텀시트 공통 문구 업데이트',
  primary_cta = '상담 예약하기',
  title = '가입 권유 없이 궁금한 부분만<br>부담없이 물어보세요',
  uploaded_at = now()
where template_id = 'consult_default';

update guide_ops.consult_template
set context_block_title = '상담에서 공유받는 내용',
  intro_copy = '지금 보고 있던 보장 내용을 공유해서 궁금한 부분만 상담 받을 수 있어요.',
  legal_notice = '',
  operator_note = '상담 연결 바텀시트 공통 문구 업데이트',
  primary_cta = '상담 예약하기',
  title = '가입 권유 없이 궁금한 부분만<br>부담없이 물어보세요',
  updated_at = now(),
  updated_by = 'codex'
where template_id = 'consult_default';

commit;
