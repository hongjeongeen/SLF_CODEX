# Supabase Migrations

이 폴더에는 `sli_knowledge_agent` 프로젝트의 Supabase 변경 이력을 SQL 파일로 저장한다.

## 규칙

- 파일명은 `YYYYMMDDHHMMSS_description.sql`
- 스키마 변경, 뷰 변경, RLS 변경, grant 변경은 반드시 여기에 남긴다
- 프론트 계약(`public.guide_app_*`)을 바꾸면 `data.js` 변경과 같은 커밋에 포함한다

## 예시

```text
20260617153000_create_public_guide_views.sql
20260617154500_add_term_alias_links.sql
20260617161000_fix_public_grants.sql
```

상세 운영 방식은 [`docs/supabase-migration-workflow.md`](C:\Users\user\Desktop\SLF_CODEX_repo\sli_knowledge_agent\docs\supabase-migration-workflow.md) 를 따른다.
