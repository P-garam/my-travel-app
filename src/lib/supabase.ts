import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { devLog, devWarn, devError } from '../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Anon Key 형식 검증 (개발 모드에서만)
if (import.meta.env.DEV && supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  devError('Supabase 설정 오류: VITE_SUPABASE_ANON_KEY가 올바른 JWT 형식이 아닙니다.');
  devError('Supabase 대시보드 > Settings > API > anon public 키를 확인하세요.');
}

// 환경 변수가 없어도 앱이 크래시되지 않도록 더미 클라이언트 생성
let supabaseInstance: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  devLog('Supabase 클라이언트 정상 생성됨');
} else {
  // 환경 변수가 없을 때는 더미 클라이언트 생성 (에러 방지)
  devWarn('Supabase 환경 변수가 설정되지 않았습니다. 로그인 기능이 작동하지 않습니다.');
  supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export const supabase = supabaseInstance;

/**
 * Supabase 환경 변수 확인
 */
const isSupabaseConfigured = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseAnonKey);
};

/**
 * 리다이렉트 URL 가져오기 (로컬 환경 우선)
 */
const getRedirectUrl = (): string => {
  // 개발 환경에서는 localhost:3000 명시, 프로덕션에서는 window.location.origin 사용
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  return window.location.origin;
};

const AUTH_DEBUG_KEY = 'auth-debug-pre-redirect';

/** 로그인 리다이렉트 직전 저장 (개발 모드에서만, OAuth 복귀 후 디버깅용) */
export const saveAuthDebug = (provider: string, redirectTo: string): void => {
  if (!import.meta.env.DEV) return;
  try {
    const payload = { provider, redirectTo, timestamp: new Date().toISOString() };
    sessionStorage.setItem(AUTH_DEBUG_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
};

/** OAuth 복귀 후 저장된 로그 읽고 제거 (개발 모드에서만 사용) */
export const readAndClearAuthDebug = (): { provider: string; redirectTo: string; timestamp: string } | null => {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = sessionStorage.getItem(AUTH_DEBUG_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AUTH_DEBUG_KEY);
    return JSON.parse(raw) as { provider: string; redirectTo: string; timestamp: string };
  } catch {
    return null;
  }
};

/**
 * 구글 소셜 로그인
 */
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const redirectTo = getRedirectUrl();
  saveAuthDebug('google', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  
  if (error) {
    devError('구글 로그인 에러:', error);
    throw error;
  }
  
  return data;
};

/**
 * 카카오 소셜 로그인
 *
 * 카카오 400 Bad Request 방지:
 * - scopes: account_email은 Biz App 전용이라, profile_nickname + profile_image만 사용.
 * - 카카오 개발자 콘솔 > 앱 설정 > 플랫폼 > Web >
 *   Redirect URI에 https://<project-ref>.supabase.co/auth/v1/callback 정확히 등록 필요.
 */
export const signInWithKakao = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const redirectTo = getRedirectUrl();
  saveAuthDebug('kakao', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      scopes: 'profile_nickname profile_image',
    },
  });

  if (error) {
    devError('카카오 로그인 에러:', error);
    throw error;
  }

  return data;
};

/**
 * 네이버 소셜 로그인
 */
export const signInWithNaver = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const redirectTo = getRedirectUrl();
  saveAuthDebug('naver', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'naver',
    options: {
      redirectTo: redirectTo,
    },
  });
  
  if (error) {
    devError('네이버 로그인 에러:', error);
    throw error;
  }
  
  return data;
};

/**
 * 로그아웃
 */
export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    devWarn('Supabase가 설정되지 않아 로그아웃할 수 없습니다.');
    return;
  }

  const { error } = await supabase.auth.signOut();
  
  if (error) {
    devError('로그아웃 에러:', error);
    throw error;
  }
};

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      devError('사용자 정보 가져오기 에러:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    devError('사용자 정보 가져오기 예외:', error);
    return null;
  }
};

/**
 * 인증 상태 변경 감지
 * @param callback (event, session, user) => void 형태의 콜백 함수
 * @returns { unsubscribe: () => void } 형태의 subscription 객체
 */
export const onAuthStateChange = (
  callback: (event: string, session: any, user: any) => void
) => {
  if (!isSupabaseConfigured()) {
    // 환경 변수가 없으면 더미 subscription 반환
    return {
      unsubscribe: () => {}
    };
  }

  // supabase.auth.onAuthStateChange는 { data: { subscription } } 형태를 반환
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    devLog('인증 상태 변경:', event);
    
    callback(event, session, session?.user ?? null);
  });

  // unsubscribe 메서드를 가진 객체 반환
  return {
    unsubscribe: () => subscription.unsubscribe()
  };
};
