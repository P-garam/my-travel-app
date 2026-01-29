# 배포 에러 해결 가이드 (isValidImageUrl)

## 원인 분석

### 1. 번들 해시가 변하지 않음
- 에러가 발생하는 파일: `index-CQ498Q0g.js`
- 여러 번 수정·푸시했는데도 **해시가 동일** → 새 빌드가 배포되지 않았을 가능성

### 2. 가능한 원인
| 원인 | 설명 |
|------|------|
| **Vercel 빌드 실패** | 빌드가 실패하면 이전 배포가 그대로 유지됨 |
| **빌드 캐시** | Vercel이 이전 빌드 결과를 재사용 |
| **브랜치 불일치** | Vercel이 다른 브랜치(main이 아닌)를 배포 중 |
| **다른 저장소** | Vercel 프로젝트가 다른 GitHub 저장소에 연결됨 |

### 3. 로컬 빌드 실패
- `npm run build` 시 `tailwindcss` 모듈을 찾을 수 없다는 에러 발생
- `node_modules`가 불완전하면 로컬·Vercel 모두 빌드 실패 가능

---

## 적용한 수정 사항

1. **vercel.json** 추가 – 빌드 설정 명시
2. **security.ts** – `isValidImageUrl` 제거 (미사용)
3. **favicon** – 404 방지를 위해 data URI favicon 추가

---

## 해결 절차

### 1단계: 로컬에서 의존성 재설치 및 빌드 확인

```bash
cd /Users/baggalam/Desktop/여행-한-편
rm -rf node_modules package-lock.json
npm install
npm run build
```

- 빌드가 성공하면 `dist/` 폴더가 생성됨
- 빌드가 실패하면 에러 메시지를 확인하고 수정

### 2단계: Vercel 대시보드에서 확인

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 해당 프로젝트 선택
3. **Deployments** 탭에서 최근 배포 상태 확인
   - 실패(빨간색)인지 확인
   - 실패 시 **View Build Logs**에서 에러 내용 확인

### 3단계: 캐시 초기화 후 재배포

1. **Deployments** 탭에서 최신 배포 선택
2. 우측 상단 **⋮** (더보기) 클릭
3. **Redeploy** 선택
4. **"Clear build cache"** 옵션 체크
5. **Redeploy** 실행

### 4단계: 새로 푸시 후 확인

```bash
git add .
git commit -m "fix: vercel.json 추가, isValidImageUrl 제거, favicon 추가"
git push
```

- 푸시 후 Vercel이 자동으로 새 배포를 시작함
- 배포가 끝나면 **번들 파일 해시가 변경**되었는지 확인 (예: `index-XXXXX.js`)

### 5단계: 브라우저 캐시 무시 새로고침

- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`
- 또는 시크릿/프라이빗 창에서 접속

---

## 확인 방법

새 배포가 적용되었는지 확인하려면:

1. **개발자 도구** → **Network** 탭
2. 페이지 새로고침
3. `index-*.js` 파일 이름 확인
   - 이전: `index-CQ498Q0g.js`
   - 새 배포: 해시가 다른 파일명 (예: `index-A1B2C3D4.js`)
