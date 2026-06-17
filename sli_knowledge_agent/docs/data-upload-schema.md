# 보험길잡이 AGENT 데이터 적재 스키마

## 목적

`/data/upload` 아래 CSV를 DB에 적재할 때, 운영자가 어떤 테이블을 어떻게 관리해야 하는지 한눈에 이해할 수 있도록 정리한 문서다.

이 문서는 두 가지를 동시에 만족하도록 설계했다.

1. CSV 원본과 1:1로 대응되어 적재가 쉽다.
2. 운영자가 "어디를 수정하면 어떤 화면이 바뀌는지" 이해하기 쉽다.

## 권장 운영 구조

DB는 2계층으로 나누는 것을 권장한다.

1. `raw_upload`
원본 CSV를 거의 그대로 적재하는 레이어. 재적재, diff, 백업용이다.

2. `guide_ops`
운영자가 실제로 조회/수정하는 레이어. 테이블명과 설명을 운영 기준으로 정리한다.

초기에는 `guide_ops`만 써도 되지만, 운영이 길어지면 `raw_upload`를 남겨두는 편이 안전하다.

## Supabase 기준 검증 결과

현재 방향은 Supabase/Postgres에 전반적으로 적절하다. 특히 `raw_upload`, `guide_ops`를 `public` 밖의 별도 schema로 두려는 방향은 좋다.

다만 Supabase에 실제로 올릴 때는 아래 4가지를 명확히 해야 한다.

1. `raw_upload`, `guide_ops`는 기본적으로 비노출 schema로 운영
2. 프론트에서 직접 조회할 테이블/뷰만 별도 노출 schema로 분리
3. 노출 schema의 테이블에는 반드시 RLS 적용
4. 노출 schema의 view는 `security_invoker = true` 또는 비노출 schema 유지

즉, 운영 데이터 원본과 백오피스용 테이블을 곧바로 `public`에 넣는 방식은 Supabase에서는 권장하지 않는다.

## Supabase 권장 schema 구성

권장 구성은 아래 3단계다.

### 1. `raw_upload`

용도:

- CSV 원본 적재
- 재적재, diff, 백업

특징:

- 비노출 schema 권장
- 외부 앱에서 직접 조회하지 않음

### 2. `guide_ops`

용도:

- 운영자가 관리하는 정제 테이블
- 백오피스/관리자 도구가 읽고 수정하는 기준 테이블

특징:

- 기본은 비노출 schema 권장
- 서버 또는 Edge Function 경유 접근 권장

### 3. `public` 또는 별도 노출 schema

용도:

- 실제 앱이 직접 읽는 최소 데이터만 제공

특징:

- Supabase Data API로 노출될 수 있으므로 RLS 필수
- 가능하면 원본 테이블이 아니라 view 또는 읽기 전용 projection 권장

권장 방식:

- `guide_ops` 원본 유지
- 앱 노출용은 `public.guide_*` view 또는 API 전용 schema로 분리

## Supabase에서 추가로 권장하는 구조 보완

### 1. 다중값 CSV 컬럼은 장기적으로 연결 테이블 분리 권장

지금 문서에서는 아래 컬럼을 문자열로 유지하도록 되어 있다.

- `linked_term_ids`
- `compare_target_ids_csv`
- `matched_minor_categories_csv`
- `aliases_csv`

초기 적재는 문자열 그대로 해도 되지만, Supabase에서는 장기적으로 아래처럼 분리하는 편이 낫다.

- `rider_term_links`
- `term_comparison_links`
- `term_aliases`
- 필요 시 `term_minor_category_links`

이유:

- PostgREST/filters에서 다루기 쉽다
- 조인과 검색이 쉬워진다
- 운영 화면에서 배열/태그로 보여주기 좋다

운영자 편의와 적재 단순성을 같이 잡으려면:

1. `raw_upload`에는 원본 문자열 유지
2. `guide_ops`에는 문자열 컬럼도 유지
3. 추가로 link table을 함께 생성

이 구조가 가장 무난하다.

### 2. 운영용 view는 Supabase 보안 규칙을 따르도록 설계

운영용 `vw_rider_content_overview`, `vw_term_content_overview`, `vw_event_message_overview`는 좋은 방향이다.

다만 Supabase에서는 view가 기본적으로 RLS를 우회할 수 있으므로:

- Postgres 15+에서는 `with (security_invoker = true)` 사용
- 아니면 비노출 schema에만 두기

현재 Supabase 프로젝트의 Postgres는 17 계열이라 `security_invoker = true` 사용이 가능하다.

### 3. `public`에 올릴 경우 RLS와 grant를 같이 설계해야 함

`public` 또는 노출 schema에 둘 경우 아래를 같이 설계해야 한다.

- `alter table ... enable row level security`
- `anon`, `authenticated`에 필요한 최소 권한만 grant
- 읽기 전용이면 `select`만 허용

앱에서 읽기만 한다면, 쓰기 권한은 애초에 열지 않는 편이 안전하다.

### 4. 메타/운영 이력 컬럼은 Supabase에서 더 유용함

아래 공통 컬럼은 유지 권장이다.

- `is_active`
- `version_tag`
- `source_file`
- `created_at`
- `updated_at`
- `updated_by`

추가로 권장하는 컬럼:

- `published_at`
- `content_status`

예:

- `draft`
- `active`
- `archived`

운영 문구를 바로 노출하지 않고 검수 후 publish하는 흐름이 생기면 유용하다.

## 운영자가 보는 테이블 묶음

### 1. 특약 기준 정보

핵심 테이블:

- `guide_ops.rider_catalog`
- `guide_ops.rider_option_catalog`
- `guide_ops.rider_runtime_seed`

역할:

- 어떤 특약이 존재하는지 정의
- 어떤 용어/비교 카드와 연결되는지 관리
- 옵션 목록과 기본 선택값 관리

운영자가 자주 보는 컬럼:

- `product_rider_code`
- `datajs_rider_id`
- `major_category`
- `middle_category`
- `minor_category`
- `linked_term_ids`
- `linked_comparison_id`

### 2. 용어 설명 사전

핵심 테이블:

- `guide_ops.term_dictionary`

역할:

- 하이라이트 용어
- bottom sheet 본문
- 비교 연결 포인트

운영자가 자주 보는 컬럼:

- `term_id`
- `term_label`
- `plain_summary`
- `why_it_matters`
- `fit_case`
- `caution`
- `detail_example`
- `compare_target_ids_csv`

### 3. 비교 카드

핵심 테이블:

- `guide_ops.comparison_mapping`

역할:

- "통합암 vs 일반암" 같은 비교 drawer 문구 관리

운영자가 자주 보는 컬럼:

- `comparison_id`
- `left_title`
- `right_title`
- `difference_point_1`
- `difference_point_2`
- `difference_point_3`
- `legal_notice`

### 4. 특약별 운영 문구

핵심 테이블:

- `guide_ops.rider_display_copy`
- `guide_ops.rider_helper`

역할:

- 특약 설명 한 줄
- 상담 연결 주제
- sticky guide helper 문구

운영자가 자주 보는 컬럼:

- `product_rider_code`
- `display_description`
- `consult_topic`
- `source_tooltip_plain`
- `helper_text`

### 5. 이벤트 문구

핵심 테이블:

- `guide_ops.event_guidance`
- `guide_ops.consult_template`

역할:

- ON/OFF/금액변경 시 가이드 문구
- 상담 카드 문구와 동적 치환 규칙

운영자가 자주 보는 컬럼:

- `event_id`
- `title_template`
- `message_template`
- `template_id`
- `title`
- `intro_copy`
- `primary_cta`

### 6. UI / 조합 규칙

핵심 테이블:

- `guide_ops.ui_surface_mapping`
- `guide_ops.datajs_recomposition_mapping`

역할:

- 어떤 화면이 어떤 원천 컬럼을 쓰는지 문서화
- CSV → `data.js` 재조합 규칙 기록

운영자보다는 기획/개발 참고용이다. 자주 수정하는 테이블은 아니다.

## 테이블별 권장 스키마

아래 PK/FK는 DB 적재 시 최소 권장 기준이다.

| 운영 테이블 | 원본 CSV | PK | 주요 FK/참조 | 운영 메모 |
| --- | --- | --- | --- | --- |
| `rider_catalog` | `rider_catalog_normalized.csv` | `product_rider_code` | `linked_term_ids -> term_dictionary.term_id`, `linked_comparison_id -> comparison_mapping.comparison_id` | 특약 기준 마스터 |
| `term_dictionary` | `term_dictionary_normalized.csv` | `term_id` | `compare_target_ids_csv -> comparison_mapping.comparison_id` | 용어 사전 |
| `comparison_mapping` | `comparison_mapping_normalized.csv` | `comparison_id` | 없음 | 비교 카드 본문 |
| `rider_display_copy` | `rider_display_copy_normalized.csv` | `product_rider_code` | `datajs_rider_id -> rider_catalog.datajs_rider_id` | 특약별 노출 문구 |
| `rider_helper` | `rider_helper_normalized.csv` | `product_rider_code` | `product_rider_code -> rider_catalog.product_rider_code` | sticky helper 문구 |
| `rider_option_catalog` | `rider_option_catalog_normalized.csv` | `(product_rider_code, option_group_type, option_order)` | `product_rider_code -> rider_catalog.product_rider_code` | 가입 옵션 목록 |
| `rider_runtime_seed` | `rider_runtime_seed_normalized.csv` | `product_rider_code` | `product_rider_code -> rider_catalog.product_rider_code` | 기본 선택값/표시 보험료 |
| `event_guidance` | `event_guidance_normalized.csv` | `event_id` | 없음 | toggle/amount 이벤트 문구 |
| `consult_template` | `consult_template_normalized.csv` | `template_id` | 없음 | 상담 카드 템플릿 |
| `ui_surface_mapping` | `ui_surface_mapping_normalized.csv` | `surface_id` | source file/field 문자열 참조 | 운영 가이드용 메타 |
| `datajs_recomposition_mapping` | `datajs_recomposition_mapping.csv` | `(datajs_object, datajs_field_or_path)` | source file/column 문자열 참조 | 재조합 규칙 메타 |

Supabase에서 추가로 권장하는 제약:

- `rider_catalog.datajs_rider_id unique`
- `rider_display_copy.datajs_rider_id unique`
- `rider_runtime_seed.datajs_rider_id unique`
- `event_guidance.trigger_type unique`는 현재 row 수 기준으로 검토 가능

문자열 PK는 Supabase/Postgres에서 문제없다. 현재 데이터 성격상 숫자 surrogate key를 굳이 만들 필요는 없다.

## 권장 타입 규칙

DB 엔진이 아직 정해지지 않았다면 아래 기준으로 잡는 것이 무난하다.

- ID/코드 컬럼: `text`
- 짧은 라벨/카테고리: `text`
- 긴 운영 문구: `text`
- ON/OFF 값: `boolean`
- 순서값: `integer`
- 보험료/숫자 금액: `integer`
- 생성/수정 시각: `timestamp` 또는 `timestamptz`

예시:

- `product_rider_code text not null`
- `term_id text not null`
- `comparison_id text not null`
- `display_monthly_premium_krw integer not null default 0`
- `default_enabled boolean not null default false`
- `option_order integer not null`

## 운영자가 수정하는 우선 테이블

운영 UI나 백오피스를 만든다면 아래 6개만 먼저 열어주는 것이 좋다.

1. `rider_catalog`
2. `term_dictionary`
3. `comparison_mapping`
4. `rider_display_copy`
5. `rider_helper`
6. `event_guidance`

이 6개만으로도 대부분의 운영 문구 수정이 가능하다.

## 추천 적재 순서

외래키와 참조 관계를 고려하면 아래 순서가 가장 안전하다.

1. `term_dictionary`
2. `comparison_mapping`
3. `rider_catalog`
4. `rider_display_copy`
5. `rider_helper`
6. `rider_option_catalog`
7. `rider_runtime_seed`
8. `event_guidance`
9. `consult_template`
10. `ui_surface_mapping`
11. `datajs_recomposition_mapping`

## 운영자 친화적으로 보기 위한 컬럼 정책

### 반드시 노출할 컬럼

- `product_rider_code`
- `term_id`
- `comparison_id`
- `event_id`
- `display_description`
- `plain_summary`
- `message_template`
- `helper_text`

### 기본 숨김 권장 컬럼

- `operator_note`
- `recomposition_rule`
- `notes`
- `dynamic_field_*_source`
- `render_target_in_code`

이 컬럼들은 개발/구현 설명에 가깝고, 운영자가 매일 수정할 대상은 아니다.

### CSV 문자열 분리 권장 컬럼

아래 컬럼은 DB 적재 후 문자열 그대로 둘 수도 있지만, 운영 UI에서는 배열처럼 보이게 처리하는 편이 낫다.

- `linked_term_ids`
- `compare_target_ids_csv`
- `matched_minor_categories_csv`
- `aliases_csv`
- `primary_source_fields`
- `secondary_source_fields`

권장 방식:

- DB 원본에는 문자열 그대로 유지
- 백오피스/조회 View에서 `|` 기준 분리해서 보여주기

## 운영용 View 권장안

운영자가 CSV 구조를 몰라도 관리할 수 있게 View 3개를 두는 것을 권장한다.

### `vw_rider_content_overview`

목적:

- 특약 1개를 기준으로 설명, helper, 비교 연결 상태를 한 번에 보기

주요 조인:

- `rider_catalog`
- `rider_display_copy`
- `rider_helper`

대표 컬럼:

- `product_rider_code`
- `datajs_rider_id`
- `minor_category`
- `display_description`
- `consult_topic`
- `helper_text`
- `linked_term_ids`
- `linked_comparison_id`

### `vw_term_content_overview`

목적:

- 용어 설명과 연결된 비교 카드까지 한눈에 보기

주요 조인:

- `term_dictionary`
- `comparison_mapping`

대표 컬럼:

- `term_id`
- `term_label`
- `plain_summary`
- `why_it_matters`
- `compare_target_ids_csv`

### `vw_event_message_overview`

목적:

- 이벤트 문구와 상담 템플릿을 함께 점검

주요 테이블:

- `event_guidance`
- `consult_template`

대표 컬럼:

- `event_id`
- `title_template`
- `message_template`
- `template_id`
- `title`
- `primary_cta`

## 권장 공통 운영 컬럼

실제 DB 테이블에는 CSV 원본 컬럼 외에 아래 공통 컬럼을 추가하는 것을 권장한다.

- `is_active boolean default true`
- `version_tag text`
- `source_file text`
- `created_at timestamptz`
- `updated_at timestamptz`
- `updated_by text`

이렇게 하면 운영자가 문구를 바꾼 이력과 배포 기준을 관리하기 쉬워진다.

## 현재 데이터 기준 주의사항

### 1. 일부 메타 컬럼에 인코딩 깨짐 흔적이 있다

이번 반영으로 운영 문구 본문은 `ver3.csv` 기준으로 정리되었지만, 아래 메타성 컬럼 일부는 예전 인코딩 영향이 남아 있을 수 있다.

- `operator_note`
- 일부 `legal_notice`
- 일부 `left_title`, `right_title`, `rider_label`
- 일부 카테고리 보조 텍스트

즉시 서비스 운영에 치명적이지는 않지만, 백오피스 노출 대상에서는 숨기거나 별도 정리하는 편이 낫다.

### 2. `source_tooltip_plain`은 길이가 길다

운영 UI에서는 textarea 편집을 기본으로 두는 것이 좋다.

### 3. `linked_term_ids`, `compare_target_ids_csv`는 단일값처럼 보여도 다중값 가능성을 전제로 둬야 한다

초기에는 text로 적재해도 되지만, 추후 다대다 연결 테이블로 분리할 수 있게 설계하는 편이 좋다.

## 최소 구현안

DB 연동을 빨리 시작하려면 아래처럼 가는 것이 가장 단순하다.

1. CSV 파일명과 같은 이름으로 `raw_upload` 테이블 생성
2. 동일 구조로 적재
3. `guide_ops`에는 아래 6개 테이블만 먼저 운영 대상화

- `rider_catalog`
- `term_dictionary`
- `comparison_mapping`
- `rider_display_copy`
- `rider_helper`
- `event_guidance`

4. 운영 화면에서는 `vw_rider_content_overview`, `vw_term_content_overview` 성격의 조회 화면 제공

이렇게 시작하면 구조를 과하게 복잡하게 만들지 않으면서도 운영자는 "특약", "용어", "비교", "이벤트 문구" 단위로 쉽게 관리할 수 있다.
