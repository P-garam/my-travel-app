import { supabase } from '../lib/supabase';
import { TravelPlan, UserProfile } from '../types';
import { logError } from '../utils/logger';
import { sanitizeText } from '../utils/security';

export interface TripDates {
  start_date: string;
  end_date: string;
}

/** 저장 시 화면에 표시된 전체 데이터 (시나리오, 장소, 영화, 음악 등) */
export interface TripContent {
  plan: TravelPlan;
  profile: UserProfile;
}

export interface SavedTrip {
  id: string;
  user_id: string;
  city: string;
  dates: TripDates;
  itinerary: TravelPlan['itinerary'];
  hotel_info: any | null;
  synopsis: string;
  /** 전체 결과 데이터 (상세 페이지 재표시용) */
  content: TripContent | null;
  created_at: string;
}

/**
 * 현재 세션의 user_id (auth.uid()) 반환. 닉네임/프로필 이미지와 무관.
 */
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    logError('saveTrip getCurrentUser', error);
    throw error;
  }
  if (!user?.id) {
    throw new Error('로그인이 필요합니다.');
  }
  return user.id;
};

/**
 * 여행 티켓 데이터를 Supabase에 저장
 * - 유저 식별: auth.uid() (현재 세션). 닉네임/프로필 이미지 null 여부와 무관.
 */
export const saveTrip = async (
  profile: UserProfile,
  plan: TravelPlan
): Promise<SavedTrip> => {
  const userId = await getCurrentUserId();

  // 날짜 계산
  const startDate = new Date(profile.travelDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + profile.duration);

  // 시놉시스 생성 (personalityTitle과 personalityDescription 조합)
  const synopsis = sanitizeText(`${plan.personalityTitle}\n\n${plan.personalityDescription}`);

  // 입력값 검증 및 XSS 방지
  const sanitizedCity = sanitizeText(profile.destination);
  if (!sanitizedCity || sanitizedCity.length === 0) {
    throw new Error('도시명이 유효하지 않습니다.');
  }

  // 화면에 표시된 모든 데이터를 content JSONB에 통째로 저장
  // JSON 직렬화로 undefined/함수/순환 참조 제거 (Supabase 400 방지)
  const contentRaw: TripContent = { plan, profile };
  let contentJson: TripContent;
  try {
    contentJson = JSON.parse(JSON.stringify(contentRaw)) as TripContent;
  } catch (e) {
    logError('saveTrip content 직렬화', e);
    throw new Error('저장할 데이터를 처리하는 중 오류가 발생했습니다.');
  }

  // content 컬럼이 없을 수 있으므로, 기본 payload는 content 제외
  const basePayload = {
    user_id: userId,
    city: sanitizedCity,
    dates: {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    },
    itinerary: plan.itinerary,
    hotel_info: null,
    synopsis,
  };

  // content 컬럼이 있으면 포함해서 시도, 없으면 basePayload만 사용
  let result = await supabase
    .from('trips')
    .insert({ ...basePayload, content: contentJson })
    .select()
    .single();

  // PGRST204: content 컬럼이 없을 때 content 제외하고 재시도
  const err = result.error as { code?: string; message?: string } | null;
  const isContentColumnError =
    err &&
    (err.code === 'PGRST204' || (err.message || '').includes("'content'") && (err.message || '').includes('schema cache'));

  if (result.error && isContentColumnError) {
    if (import.meta.env.DEV) {
      console.warn('[saveTrip] content 컬럼 없음, content 제외 후 재시도');
    }
    result = await supabase
      .from('trips')
      .insert(basePayload)
      .select()
      .single();
  }

  const { data, error } = result;

  if (error) {
    const errDetail = error as { message?: string; code?: string; details?: string; hint?: string };
    logError('saveTrip insert', error);
    if (import.meta.env.DEV) {
      console.error('[saveTrip] Supabase 상세:', {
        message: errDetail.message,
        code: errDetail.code,
        details: errDetail.details,
        hint: errDetail.hint,
      });
    }
    throw error;
  }

  if (!data) {
    throw new Error('저장된 데이터를 받지 못했습니다.');
  }

  return data as SavedTrip;
};

/**
 * 사용자의 저장된 여행 목록 가져오기
 */
export const getSavedTrips = async (userId: string): Promise<SavedTrip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logError('여행 목록 가져오기', error);
    throw error;
  }

  return data as SavedTrip[];
};

/**
 * ID로 저장된 여행 한 건 조회 (상세 페이지용)
 */
export const getTripById = async (tripId: string, userId: string): Promise<SavedTrip | null> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    logError('여행 상세 조회', error);
    throw error;
  }

  return data as SavedTrip;
};

/**
 * 저장된 여행 삭제
 */
export const deleteTrip = async (tripId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('user_id', userId); // RLS로도 보호되지만 이중 체크

  if (error) {
    logError('여행 삭제', error);
    throw error;
  }
};
