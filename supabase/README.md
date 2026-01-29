# Supabase 설정 가이드

## trips 테이블 400 에러 해결

저장 시 `400 Bad Request` 또는 `Failed to load resource`가 발생하면 아래를 확인하세요.

### 1. 테이블 생성

Supabase 대시보드 → **SQL Editor** → `create-trips.sql` 전체 실행

### 2. content 컬럼 확인

기존에 `create-trips.sql`을 실행했지만 `content` 컬럼이 없다면:

```sql
-- migrate-add-content.sql 실행
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS content JSONB;
```

### 3. 콘솔에서 상세 에러 확인

브라우저 개발자 도구(F12) → Console 탭에서 `[saveTrip] Supabase 상세:` 로그 확인

- `column "content" does not exist` → `migrate-add-content.sql` 실행
- `null value in column "X"` → 해당 컬럼에 필수 값 전달 확인
- `permission denied` / `403` → RLS 정책 확인 (인증된 사용자만 INSERT 가능)

### 4. RLS 정책

`create-trips.sql`에 포함된 RLS 정책이 적용되어 있어야 합니다. 본인(`auth.uid() = user_id`) 데이터만 접근 가능합니다.
