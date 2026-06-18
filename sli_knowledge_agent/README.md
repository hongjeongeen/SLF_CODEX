# 보험길잡이 AGENT

삼성생명 다이렉트 보험 가입 흐름 안에서 고객이 막히기 쉬운 보험 용어와 특약 구조를 쉬운 말로 설명하는 `보험길잡이 AGENT` 프로토타입입니다.  
단순 용어사전이 아니라, 사용자가 지금 보고 있는 보장 맥락에 맞춰 `한 줄 설명`, `비슷한 보장과의 차이`, `필요 시 상담 연결`을 빠르게 제공하는 것을 목표로 합니다.

## Demo

- Vercel URL: [https://sli-knowledge-agent-v2.vercel.app](https://sli-knowledge-agent-v2.vercel.app)
- Vercel Project: `sli-knowledge-agent-v2`
- Repository: [https://github.com/hongjeongeen/SLF_CODEX/tree/main/sli_knowledge_agent](https://github.com/hongjeongeen/SLF_CODEX/tree/main/sli_knowledge_agent)

## Agent Overview

이 에이전트는 보험 가입 화면을 전부 바꾸지 않고, 기존 설계 UI 위에 설명 레이어를 얹는 방식으로 동작합니다.

- 어려운 용어를 하이라이트하고 `bottom sheet`로 쉬운 설명을 제공합니다.
- 특약 ON/OFF 또는 가입금액 변경 시 `sticky guide bar`로 지금 봐야 할 차이만 짧게 안내합니다.
- 비슷한 특약은 `comparison drawer`에서 핵심 차이만 빠르게 비교할 수 있습니다.
- 설명만으로 판단이 어려운 경우 현재 보던 맥락을 담아 상담 연결 카드로 넘깁니다.

## Architecture

전체 구조는 `static frontend + Supabase content API + Vercel hosting` 조합입니다.

```text
User
  -> Vercel-hosted static web app
      -> index.html
      -> styles.css
      -> app.js
      -> data.js
          -> Supabase REST API (/rest/v1/guide_app_*)
              -> terms
              -> comparisons
              -> riders
              -> rider options
              -> guide messages
              -> consult template
              -> category metadata
```

### 1. Frontend Layer

- `index.html`: 보험 계산 결과 화면, sticky guide bar, term sheet, comparison drawer, consult card 구조를 정의합니다.
- `styles.css`: 모바일 중심 UI 스타일과 안내 레이어 시각 규칙을 담당합니다.
- `app.js`: 사용자 상호작용을 처리합니다.
- 주요 인터랙션
  - 특약 토글/가입금액 변경
  - 용어 하이라이트 클릭
  - 비교 drawer 열기
  - 상담 컨텍스트 생성

### 2. Content/Data Layer

- `data.js`는 프론트에서 사용할 초기 draft 구조를 정의하고, 이후 Supabase에서 실제 운영 데이터를 불러옵니다.
- 현재 앱은 Supabase REST API에서 아래 view들을 병렬 조회합니다.
  - `guide_app_terms`
  - `guide_app_comparisons`
  - `guide_app_riders`
  - `guide_app_rider_options`
  - `guide_app_guide_messages`
  - `guide_app_consult_template`
  - `guide_app_categories`
  - `guide_app_category_groups`
- 조회 실패 시에는 `data.js`에 포함된 번들 draft 데이터로 fallback 하도록 설계되어 있습니다.

### 3. Data Modeling Layer

프로젝트 문서 기준으로 콘텐츠 운영 구조는 아래 2계층을 전제로 설계되어 있습니다.

- `raw_upload`: CSV 원본 적재, 재적재, diff, 백업용 레이어
- `guide_ops`: 운영자가 실제로 관리하는 정제 레이어

앱에는 이 운영 데이터 전체를 직접 노출하기보다, 프론트에 필요한 최소 단위만 `guide_app_*` 형태의 조회용 view/API로 제공하는 구조를 지향합니다.

### 4. Hosting Layer

- Vercel이 정적 프론트엔드 배포를 담당합니다.
- 확인된 Vercel 프로젝트 정보
  - Project ID: `prj_KWaaFi7qmYVialOvRUb4Umapixkc`
  - Team ID: `team_ZH5AlUq69nkL9EskoCmKJIMV`
  - Production Domain: `sli-knowledge-agent-v2.vercel.app`

## Key User Flow

1. 사용자가 보험 계산 결과 화면에서 특약/보장을 확인합니다.
2. 특정 용어가 눈에 띄면 하이라이트를 눌러 쉬운 설명을 엽니다.
3. 특약을 켜거나 끄거나 금액을 바꾸면 sticky guide가 즉시 맥락형 설명을 보여줍니다.
4. 더 헷갈리면 비교 보기로 이동해 유사 보장의 차이를 확인합니다.
5. 그래도 판단이 어렵다면 현재 보고 있던 항목만 상담으로 연결합니다.

## Important Files

- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `docs/data-upload-schema.md`

## Notes

- 이 프로젝트는 보험 추천 엔진이 아니라, 가입 과정의 이해를 돕는 설명형 에이전트에 가깝습니다.
- 보장 범위와 지급 조건은 약관 기준이 중요하므로, 상세 기준은 반드시 약관 확인이 필요합니다.
