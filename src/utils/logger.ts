/**
 * 개발 모드에서만 콘솔 로그 출력
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDev) {
    console.error(...args);
  }
};

/**
 * 에러 로깅 (개발: 상세 출력, 프로덕션: 콘솔 비출력)
 * 프로덕션에서는 Sentry 등 원격 로깅 서비스 연동 권장
 */
export const logError = (context: string, error: unknown) => {
  if (isDev) {
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[${context}]`, error);
    if (errorStack) {
      console.error(`[${context}] Stack:`, errorStack);
    }
  }
  // 프로덕션: 콘솔에 민감 정보 노출 방지 (원격 로깅 연동 시 여기서 전송)
};
