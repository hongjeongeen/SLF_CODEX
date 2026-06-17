# Supabase Migration Workflow

## 목적

이 문서는 `sli_knowledge_agent` 프로젝트에서 Supabase 변경을 Git 이력으로 관리하기 위한 최소 운영 규칙을 정리한다.

핵심 원칙은 아래와 같다.

1. Supabase 대시보드에서만 수정하고 끝내지 않는다.
2. 스키마, 뷰, RLS, 함수 변경은 반드시 migration 파일로 남긴다.
3. 프론트 코드가 기대하는 데이터 구조와 DB 변경 이력을 함께 추적한다.

## 이 프로젝트에서 중요한 점

현재 프론트는 [`data.js`](C:\Users\user\Desktop\SLF_CODEX_repo\sli_knowledge_agent\data.js) 에서 Supabase `REST` API를 직접 호출한다.

- Project: `hgmauxdtuqhpkqxapdlk`
- Runtime read target:
  - `public.guide_app_terms`
  - `public.guide_app_comparisons`
  - `public.guide_app_riders`
  - `public.guide_app_rider_options`
  - `public.guide_app_guide_messages`
  - `public.guide_app_consult_template`
  - `public.guide_app_categories`
  - `public.guide_app_category_groups`

즉, 프론트가 의존하는 최종 계약은 `public.guide_app_*` 뷰 집합이다.

## 변경 유형별 원칙

### 1. UI 문구/콘텐츠 데이터만 바꾸는 경우

- 가능하면 운영 테이블 데이터 업데이트 SQL도 migration으로 남긴다.
- 단순 대시보드 수정만 하고 끝내면, 누가 언제 어떤 문구를 바꿨는지 Git에서 추적되지 않는다.

예:

- 용어 설명 문구 수정
- 비교 카드 문구 수정
- 카테고리 라벨 수정

### 2. 스키마를 바꾸는 경우

반드시 migration 파일로 관리한다.

예:

- 컬럼 추가/삭제
- 테이블 추가
- 뷰 정의 변경
- RLS 정책 추가/수정
- grant 변경

### 3. 프론트 계약을 바꾸는 경우

아래 둘을 한 세트로 변경한다.

1. Supabase migration
2. 프론트 코드 (`data.js`, `app.js`, 필요 문서)

예:

- `guide_app_terms`에 새 필드 추가
- `compare_target_ids_csv` 형식 변경
- `public.guide_app_riders` 정렬/노출 컬럼 변경

## 추천 폴더 구조

```text
sli_knowledge_agent/
  supabase/
    migrations/
      20260617153000_init_structure.sql
      20260617160000_update_term_copy.sql
```

## 파일 naming 규칙

형식:

```text
YYYYMMDDHHMMSS_short_description.sql
```

예:

```text
20260617153000_create_public_guide_views.sql
20260617154500_add_term_alias_links.sql
20260617161000_fix_public_grants.sql
```

## 실무 워크플로

### A. 안전한 기본 흐름

1. 로컬에서 SQL 변경안 작성
2. `supabase/migrations/` 에 migration 파일 추가
3. 변경 의도와 영향 범위를 같이 검토
4. Supabase에 적용
5. 프론트가 읽는 `guide_app_*` 뷰 응답 확인
6. Git commit / push

### B. 권장 커밋 단위

한 커밋에는 아래를 같이 넣는 편이 좋다.

- migration SQL
- 관련 프론트 코드 수정
- 관련 문서 수정

예:

```text
feat: add category group metadata to guide views
```

## SQL 작성 원칙

### 1. 프론트 공개용 객체와 운영용 객체를 분리

- 운영 원본: `guide_ops`
- 프론트 공개 계약: `public.guide_app_*` 뷰

프론트는 가능하면 테이블이 아니라 `view`를 읽게 유지한다.

### 2. 공개 객체는 최소 권한만 부여

Supabase 공식 문서 기준으로 Data API는 `grant`와 `RLS`를 함께 관리해야 한다.

- 공개가 필요한 객체만 노출
- `anon`, `authenticated`에는 최소 권한만 부여
- 공개 대상 테이블/뷰에는 RLS를 명시적으로 점검

참고:
- [Supabase Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Securing your data](https://supabase.com/docs/guides/database/secure-data)

### 3. 뷰는 계약처럼 다룬다

`public.guide_app_*`는 프론트 API 계약 역할을 하므로:

- 컬럼명 변경은 신중히
- 삭제보다 추가를 우선
- breaking change면 `data.js`를 같은 커밋에서 같이 수정

## 변경 체크리스트

migration 작성 전:

- 이 변경이 운영 데이터 수정인지, 스키마 수정인지 구분했는가
- 프론트가 읽는 `public.guide_app_*` 계약에 영향이 있는가
- 공개 대상에 불필요한 권한이 추가되지는 않는가

적용 후:

- `guide_app_*` 조회가 정상인지 확인했는가
- 필요한 경우 Security Advisor 경고를 다시 확인했는가
- 프론트 렌더링이 깨지지 않았는가

## 무료 플랜 기준 운영 팁

- Supabase GitHub integration의 PR preview branch 자동 생성은 Pro 기능일 수 있다.
- 하지만 production 반영용 migration 파일 관리 자체는 무료 플랜에서도 충분히 가능하다.
- 따라서 현재 프로젝트는 아래 조합이 가장 실용적이다.

1. GitHub에 migration SQL 저장
2. `main` push 시 Vercel 자동배포
3. Supabase는 migration 기준으로 수동 적용 또는 추후 CLI 자동화

## 다음 단계 제안

다음 작업 중 하나를 이어서 하면 운영성이 더 좋아진다.

1. `supabase/config.toml` 과 CLI 기준 디렉터리 초기화
2. 현재 Supabase 스키마를 기준으로 첫 baseline migration 작성
3. `guide_app_*` 뷰/권한/RLS 점검용 SQL 체크리스트 추가
