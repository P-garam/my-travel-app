# 여행 한 편 (A Cinematic Journey)

영화 시나리오처럼 구성된 개인 맞춤형 여행 계획 서비스

## 프로젝트 구조

```
여행-한-편/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── BudgetChart.tsx
│   │   ├── DocentPlayer.tsx
│   │   ├── MovieCurator.tsx
│   │   ├── PlaceCard.tsx
│   │   ├── SoundtrackPlaylist.tsx
│   │   └── TicketGenerator.tsx
│   ├── services/            # 서비스 로직
│   │   ├── geminiService.ts
│   │   └── bookingService.ts
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   ├── App.tsx              # 메인 앱 컴포넌트
│   └── main.tsx             # 진입점
├── .env.example             # 환경 변수 예시
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# 필수: Gemini API 키
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# 선택: 예약 파트너 ID
VITE_MYREALTRIP_PARTNER_ID=your_myrealtrip_partner_id
VITE_AGODA_PARTNER_ID=your_agoda_partner_id
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 주요 기능

### 1. 프로젝트 구조화
- `src/components`: 모든 React 컴포넌트
- `src/services`: API 호출 및 비즈니스 로직
- `src/types`: TypeScript 타입 정의

### 2. 모바일 최적화
- 티켓 저장 시 모바일 환경에서는 모달로 이미지 표시
- "길게 눌러 저장하세요" 안내 메시지 제공
- 카카오톡 등 모바일 앱에서 이미지 저장 지원

### 3. 수익화 기능
- 각 여행 장소에 "예약하기" 버튼 추가
- 마이리얼트립 및 아고다 검색 링크 연결
- 파트너 ID를 환경 변수로 관리

### 4. 환경 변수 관리
- `.env` 파일을 통한 API 키 관리
- `.gitignore`에 `.env` 파일 추가로 보안 강화

### 5. 최신 구글 맵 표준
- `getGoogleMapsRouteUrl` 함수를 최신 Directions API 형식으로 업데이트
- 경유지(waypoints) 지원
- 이동 수단 옵션 추가

## 필요한 패키지

### 프로덕션 의존성
- `react`: ^19.2.3
- `react-dom`: ^19.2.3
- `@google/genai`: ^1.37.0
- `lucide-react`: ^0.562.0
- `recharts`: ^3.6.0
- `html2canvas`: 1.4.1

### 개발 의존성
- `typescript`: ~5.8.2
- `vite`: ^6.2.0
- `@vitejs/plugin-react`: ^5.0.0
- `@types/node`: ^22.14.0

## 주요 변경사항

1. **프로젝트 구조 재편성**: 모든 파일을 `src` 폴더 하위로 재구성
2. **모바일 버그 수정**: html2canvas 대신 모달 방식으로 이미지 표시
3. **예약 기능 추가**: 마이리얼트립/아고다 링크 통합
4. **환경 변수 설정**: `.env` 파일을 통한 API 키 관리
5. **구글 맵 URL 업데이트**: 최신 Directions API 표준 적용

## 라이선스

© 2025 Cinematic Storyteller & Trip Designer.
