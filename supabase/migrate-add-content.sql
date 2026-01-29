-- ============================================================
-- content JSONB 컬럼 추가 (기존 trips 테이블 마이그레이션)
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS content JSONB;

-- 기존 행은 content가 NULL일 수 있음. 새로 저장하는 데이터부터 content 사용.
