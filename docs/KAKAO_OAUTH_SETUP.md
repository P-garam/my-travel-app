# 카카오 로그인 설정 가이드 (Supabase)

## 401 에러 해결 체크리스트

### 1. Vercel 환경 변수 (필수)
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase **anon public** 키 (Settings > API)

⚠️ **환경 변수 수정 후 반드시 재배포**  
Vite는 빌드 시점에 env를 번들에 포함합니다. Vercel에서 변수 변경 후 **Redeploy**를 실행하세요.

### 2. Supabase URL 설정
**Authentication** > **URL Configuration**

| 항목 | 값 |
|------|-----|
| **Site URL** | `https://your-app.vercel.app` (프로덕션 도메인) |
| **Redirect URLs** | `https://your-app.vercel.app/**` 추가 |

### 3. Supabase 카카오 Provider
**Authentication** > **Providers** > **Kakao**

- **Enable** 체크
- **Client ID**: 카카오 개발자 콘솔 REST API 키
- **Client Secret**: 카카오 개발자 콘솔에서 생성

### 4. 카카오 개발자 콘솔
[developers.kakao.com](https://developers.kakao.com)

1. **앱 설정** > **플랫폼** > **Web** > **Redirect URI**에 아래 **정확히** 등록:
   ```
   https://pvasqugxizbpvcvejvid.supabase.co/auth/v1/callback
   ```

2. **카카오 로그인** > **활성화 설정** > **상태**: **ON**

3. **카카오 로그인** > **동의 항목**: `profile_nickname`, `profile_image` 활성화

### 5. Anon Key 확인
Supabase **Settings** > **API** > **Project API keys** > **anon public**

- `eyJ`로 시작하는 JWT 형식이어야 함
- **service_role** 키는 절대 클라이언트에 사용하지 말 것
