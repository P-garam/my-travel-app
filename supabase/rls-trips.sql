-- ============================================================
-- trips 테이블 RLS (Row Level Security) 정책
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================
-- 전제: trips 테이블에 user_id (UUID) 컬럼이 있고, auth.users(id)를 참조합니다.
--
-- 앱에서 사용하는 컬럼 예시 (참고):
--   id UUID PK, user_id UUID NOT NULL REFERENCES auth.users(id),
--   city TEXT, dates JSONB, itinerary JSONB, hotel_info JSONB, synopsis TEXT, created_at TIMESTAMPTZ

-- 1. RLS 활성화
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책이 있다면 제거 후 재생성 (선택)
-- DROP POLICY IF EXISTS "Users can select own trips" ON public.trips;
-- DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
-- DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
-- DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

-- 3. 본인 데이터만 조회 (SELECT)
CREATE POLICY "Users can select own trips"
  ON public.trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. 본인 데이터만 추가 (INSERT)
CREATE POLICY "Users can insert own trips"
  ON public.trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. 본인 데이터만 수정 (UPDATE)
CREATE POLICY "Users can update own trips"
  ON public.trips
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. 본인 데이터만 삭제 (DELETE)
CREATE POLICY "Users can delete own trips"
  ON public.trips
  FOR DELETE
  USING (auth.uid() = user_id);
