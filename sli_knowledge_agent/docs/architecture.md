# architecture.md - 보험길잡이 AGENT 입력 / 처리 / 출력 구조
> `보험길잡이 AGENT` MVP의 동작 구조 초안. 목표는 보험 가입 화면 안에서 현재 맥락을 읽고, 가장 적절한 설명 단위를 선택해 UI로 노출하는 것이다.

| 섹션 | 내용 |
|---|---|
| Goal | 보험 가입 흐름 안에서 고객이 현재 보고 있는 특약/용어/조작 맥락을 기준으로 쉬운 설명, 비교, 상담 연결을 제공한다. |
| Input | 현재 화면 정보, 특약 ID, 용어 ID, 토글 상태, 가입금액 변경 값, 용어 사전, 이벤트 카드 데이터, 비교 매핑 데이터 |
| Process | 1) 현재 화면/특약 맥락 식별 -> 2) 고객 액션 분류(`term_click`, `toggle_on`, `toggle_off`, `amount_change`, `compare_open`, `consult_open`) -> 3) 해당 이벤트에 맞는 설명 데이터 조회 -> 4) 노출 우선순위와 반복 노출 룰 적용 -> 5) 적절한 UI 패턴으로 렌더링 |
| Tools / Data | term dictionary, event guidance, comparison mapping, UI exposure rules, 상품 메타데이터 |
| Output | `sticky guide bar`, `bottom sheet`, `comparison drawer`, `consult handoff card` |
| HITL | 설명만으로 판단이 어려운 경우 상담 연결. 상담 시 현재 항목, 선택 상태, 사용자가 막힌 포인트를 함께 넘긴다. |
| Failure | 데이터 매핑 실패 시 추정 설명을 만들지 않고 기본 상담 연결 또는 축약된 안전 설명으로 대응한다. 동일 카드 과다 노출 시 자동 숨김 룰을 적용한다. |
| Cost / Complexity | 초기에는 룰 기반 + 구조화된 콘텐츠 중심으로 설계하고, 범위를 넓힐 때만 생성형 요약을 검토한다. |

## Core Data Model

### 1. Term Dictionary
용어 자체의 기본 설명을 담는 계층.

예시 필드:
- `term_id`
- `label`
- `aliases`
- `plain_summary`
- `easy_description`
- `why_it_matters`
- `fit_case`
- `caution`
- `legal_notice`
- `consult_cta`
- `compare_targets`
- `detail_examples`

설명 규칙:
- `legal_notice`에는 기본적으로 `자세한 기준은 약관을 꼭 확인해 주세요`를 포함한다.
- `비급여` 계열은 `국민건강보험이 적용되지 않는 치료`라는 표현을 표준 문구로 사용한다.
- `상급종합병원` 계열은 자세히 보기에서 병원 예시 또는 분류 안내를 함께 제공한다.

### 2. Event Guidance
사용자 조작 직후 노출할 카드 데이터를 담는 계층.

예시 필드:
- `event_id`
- `trigger_type`
- `target_id`
- `condition`
- `card_title`
- `card_message`
- `detail_sheet_id`
- `consult_cta`
- `show_limit_per_session`

### 3. Comparison Mapping
헷갈리기 쉬운 특약 쌍과 비교 포인트를 담는 계층.

예시 필드:
- `comparison_id`
- `left_target_id`
- `right_target_id`
- `difference_points`
- `fit_case_left`
- `fit_case_right`
- `caution`

초기 비교 대상:
- `통합암 vs 일반암`
- `암 통합 치료 vs 암 치료`
- `암 치료 vs 암 복합 치료`
- `암 통합 치료(비급여포함) vs 암 통합 치료`
- `암 고액 치료 vs 암 치료`
- `주요 순환계 질환 통합 치료 vs 주요 순환계 질환 치료`
- `주요 순환계 질환 치료 vs 주요 순환계 질환 복합 치료`
- `주요 순환계 질환 통합 치료 vs 주요 순환계 질환 특정 치료`

## UI Delivery Rules
- 기본 개입 패턴은 `하이라이트 -> sticky guide bar -> bottom sheet` 순서다.
- 자동 개입은 조작 직후에만 사용하고, 기본 상태에서는 최대한 조용하게 유지한다.
- 같은 카드의 자동 노출 횟수는 세션 단위로 제한한다.
- 설명은 길게 펼치기보다 `한 줄 이해 -> 필요 시 상세`의 계층형 구조를 사용한다.

## Event Flow

### A. Term Click
1. 사용자가 하이라이트된 용어 클릭
2. `term_id` 매핑
3. term dictionary 조회
4. bottom sheet 렌더링
5. 필요 시 비교/상담 액션 노출

### B. Toggle ON/OFF
1. 사용자가 특약 토글 조작
2. `target_id + action` 기준 event guidance 조회
3. sticky guide bar 노출
4. `자세히 보기` 클릭 시 상세 sheet 오픈

### C. Amount Change
1. 사용자가 가입금액 변경
2. 이전 값/현재 값 비교
3. 금액 변화에 맞는 guidance card 조회
4. `무슨 차이?` 또는 `상담` 액션 노출

### D. Consult Handoff
1. 사용자가 상담 연결 선택
2. 현재 화면, 특약, 선택 상태, 비교 이력, 마지막 본 설명 카드 정보를 묶음
3. 상담 연결 문구와 함께 handoff card 제공

## Safety / Tone Rules
- 생성형 답변을 쓰더라도 원천은 구조화된 데이터와 약관 기준 문구를 우선한다.
- 보장 판단을 단정하지 않고, 비교 기준을 제공하는 방식으로 응답한다.
- `추천`, `유리`, `반드시` 같은 권유형 표현은 지양한다.
- 세부 기준이 약관 의존적인 항목은 명시적으로 안내한다.
- 모든 상세 설명과 비교 응답에는 `자세한 기준은 약관을 꼭 확인해 주세요` 문구를 기본 포함한다.
