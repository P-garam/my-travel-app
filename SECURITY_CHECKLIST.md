# 배포 전 보안 체크리스트

## ✅ 완료된 보안 조치

### 1. 환경 변수 보안
- ✅ 모든 환경 변수는 `.env.local`에서만 참조 (`import.meta.env.VITE_*`)
- ✅ `.gitignore`에 `.env`, `.env.local`, `.env.*.local` 포함됨
- ✅ 하드코딩된 API 키 없음

### 2. 콘솔 로그 (프로덕션)
- ✅ `logError`: 프로덕션에서 콘솔 출력 **완전 비활성화** (민감 정보 노출 방지)
- ✅ `devLog`, `devWarn`, `devError`: 개발 모드에서만 출력
- ✅ `saveAuthDebug`, `readAndClearAuthDebug`: 개발 모드에서만 sessionStorage 사용
- ✅ `tripService` Supabase 상세 에러: `import.meta.env.DEV` 체크
- ✅ `AccommodationRecommendation` URL 로깅: `import.meta.env.DEV` 체크

### 3. OAuth / 인증
- ✅ 카카오 로그인: `getRedirectUrl()` 사용 (이전 localhost 하드코딩 제거)
- ✅ OAuth 토큰: URL 해시에서 추출 후 즉시 `replaceState`로 제거
- ✅ 토큰은 `setSession`에만 전달, 콘솔/로그에 출력 안 함

### 4. XSS 방지
- ✅ `sanitizeText`, `validateTextInput`, `validateStringArray` 적용
- ✅ 사용자 입력(도시명, 취미) 실시간 검증
- ✅ 저장 시 시놉시스 sanitize 처리
- ✅ `isValidImageUrl`: avatar_url 등 img src에 http/https만 허용
- ✅ `dangerouslySetInnerHTML` 미사용

### 5. Supabase RLS
- ✅ `auth.role() = 'authenticated'` 명시적 체크
- ✅ 모든 정책에 `auth.uid() = user_id` 조건
- ✅ Public 접근 차단

### 6. 에러 처리
- ✅ 사용자에게는 일반적 메시지 ("문제가 발생했습니다")
- ✅ 상세 에러는 개발 모드에서만 콘솔 출력

---

## ⚠️ 배포 전 확인 사항

### 1. Tailwind CSS (프로덕션)
현재 `cdn.tailwindcss.com` 사용 중. 프로덕션에서는 PostCSS 플러그인 또는 Tailwind CLI 사용 권장.
- [Tailwind 설치 가이드](https://tailwindcss.com/docs/installation)

### 2. Gemini API 키 노출
`VITE_GEMINI_API_KEY`는 클라이언트 번들에 포함됩니다. 공개 앱이라면:
- API 사용량 제한 설정 권장
- 또는 백엔드 프록시로 API 호출을 서버에서 처리하는 방식 검토

### 3. Supabase Anon Key
`VITE_SUPABASE_ANON_KEY`는 공개용 키입니다. RLS로 데이터 접근이 제한되므로 안전합니다.
- **절대** `service_role` 키를 클라이언트에 넣지 마세요.

### 4. 환경 변수 설정
배포 플랫폼(Vercel, Netlify 등)에서 다음 변수 설정:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

### 5. Supabase Redirect URL
Supabase 대시보드 > Authentication > URL Configuration:
- Site URL: 프로덕션 도메인 (예: `https://your-app.vercel.app`)
- Redirect URLs: `https://your-app.vercel.app/**` 추가

### 6. 카카오/네이버 OAuth
각 플랫폼 개발자 콘솔에서 프로덕션 Redirect URI 등록 필요.

### 7. Supabase 401 (auth/v1/user)
로그인하지 않은 상태에서 `GET .../auth/v1/user 401 (Unauthorized)`는 **정상 동작**입니다.  
Supabase가 세션을 확인할 때 유효한 세션이 없으면 401을 반환하며, 앱은 로그아웃 상태로 처리합니다.

---

## 📋 최종 점검

| 항목 | 상태 |
|------|------|
| .env 파일 .gitignore 포함 | ✅ |
| 콘솔 로그 프로덕션 비활성화 | ✅ |
| OAuth redirect URL 프로덕션 대응 | ✅ |
| 사용자 입력 sanitize | ✅ |
| avatar_url URL 검증 | ✅ |
| RLS 정책 적용 | ✅ |
| 에러 메시지 사용자화 | ✅ |
