# Supabase 설정 가이드

## 1. 데이터베이스 스키마 생성

Supabase 대시보드의 SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- trips 테이블 생성
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  synopsis TEXT NOT NULL,
  recommendations_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert their own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "Users can update their own trips"
  ON trips
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete their own trips"
  ON trips
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 2. 소셜 로그인 설정

### 구글 로그인
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "OAuth 2.0 클라이언트 ID" 생성
5. 승인된 리디렉션 URI에 추가:
   ```
   https://pvasqugxizbpvcvejvid.supabase.co/auth/v1/callback
   ```
6. Supabase 대시보드 > Authentication > Providers > Google에서:
   - Client ID 입력
   - Client Secret 입력
   - 활성화

### 카카오 로그인
1. [카카오 개발자 센터](https://developers.kakao.com/) 접속
2. 내 애플리케이션 생성
3. "플랫폼" > "Web 플랫폼 등록":
   - 사이트 도메인: `https://pvasqugxizbpvcvejvid.supabase.co`
4. "제품 설정" > "카카오 로그인" 활성화
5. "Redirect URI" 등록:
   ```
   https://pvasqugxizbpvcvejvid.supabase.co/auth/v1/callback
   ```
6. REST API 키 복사
7. Supabase 대시보드 > Authentication > Providers > Kakao에서:
   - REST API Key 입력
   - 활성화

### 네이버 로그인
1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. 애플리케이션 등록
3. "서비스 URL" 설정:
   ```
   https://pvasqugxizbpvcvejvid.supabase.co
   ```
4. "Callback URL" 등록:
   ```
   https://pvasqugxizbpvcvejvid.supabase.co/auth/v1/callback
   ```
5. Client ID와 Client Secret 복사
6. Supabase 대시보드 > Authentication > Providers > Naver에서:
   - Client ID 입력
   - Client Secret 입력
   - 활성화

## 3. Redirect URI 형식

모든 소셜 로그인 제공업체에 등록해야 할 Redirect URI:

```
https://pvasqugxizbpvcvejvid.supabase.co/auth/v1/callback
```

**중요**: 
- 프로덕션 환경에서는 실제 도메인으로 변경 필요
- 로컬 개발 시: `http://localhost:5173/auth/callback` (또는 사용 중인 포트)
- Supabase는 자동으로 `/auth/v1/callback` 엔드포인트를 처리합니다

## 4. 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
VITE_SUPABASE_URL=https://pvasqugxizbpvcvejvid.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_iTysmZMXgj394bnvmrsCdg_msB4oJhi
```

## 5. 패키지 설치

터미널에서 다음 명령어 실행:

```bash
npm install @supabase/supabase-js
```

## 6. 테스트

1. 개발 서버 실행: `npm run dev`
2. "로그인" 버튼 클릭
3. 소셜 로그인 선택
4. 로그인 성공 후 사용자 정보 확인
5. 여행 티켓 생성 후 "이 티켓 저장하기" 버튼 클릭
6. Supabase 대시보드에서 `trips` 테이블 확인

## 7. 보안 체크리스트

- ✅ RLS 정책 활성화됨
- ✅ 사용자는 자신의 데이터만 접근 가능
- ✅ 환경 변수는 `.env.local`에 안전하게 저장
- ✅ `.env.local`은 `.gitignore`에 포함됨
- ✅ ANON KEY는 클라이언트에서 사용 가능 (RLS로 보호됨)
