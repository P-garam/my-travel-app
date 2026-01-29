-- ============================================================
-- trips 테이블 생성 + RLS (Row Level Security)
-- Supabase SQL Editor에서 **순서대로** 실행하세요.
-- ============================================================
-- 에러: "Could not find the table 'public.trips'" 발생 시
-- 이 스크립트 전체를 SQL Editor에 붙여넣고 Run 하세요.

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  dates JSONB NOT NULL,
  itinerary JSONB NOT NULL,
  hotel_info JSONB,
  synopsis TEXT,
  content JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips (created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 4. 기존 정책 제거 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "Users can select own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

-- 5. RLS 정책: 본인 데이터만 조회 (인증된 사용자만)
CREATE POLICY "Users can select own trips"
  ON public.trips FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );

-- 6. RLS 정책: 본인 데이터만 추가 (인증된 사용자만)
CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );

-- 7. RLS 정책: 본인 데이터만 수정 (인증된 사용자만)
CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );

-- 8. RLS 정책: 본인 데이터만 삭제 (인증된 사용자만)
CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() = user_id
  );
