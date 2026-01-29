import { Place } from '../types';

/**
 * 제휴 ID 관리 객체
 * 나중에 제휴 ID를 추가할 때 이 객체만 수정하면 됩니다.
 */
export const AFFILIATE_IDS = {
  AGODA: import.meta.env.VITE_AGODA_PARTNER_ID || 'YOUR_AGODA_PARTNER_ID',
  MYREALTRIP: import.meta.env.VITE_MYREALTRIP_PARTNER_ID || 'YOUR_MYREALTRIP_PARTNER_ID',
  AIRBNB: import.meta.env.VITE_AIRBNB_PARTNER_ID || 'YOUR_AIRBNB_PARTNER_ID',
  TRIPCOM: import.meta.env.VITE_TRIPCOM_PARTNER_ID || 'YOUR_TRIPCOM_PARTNER_ID',
};

// 플랫폼 기본 URL
export const BOOKING_PLATFORMS = {
  AIRBNB: {
    baseUrl: 'https://www.airbnb.co.kr',
    brandColor: '#FF385C', // 에어비앤비 브랜드 컬러
    name: '에어비앤비',
  },
  GOOGLE_HOTELS: {
    baseUrl: 'https://www.google.com/travel',
    brandColor: '#4285F4', // 구글 블루
    name: '구글 호텔',
  },
};

/**
 * 날짜 계산 유틸리티
 */
export const calculateDateRange = (startDate: string, duration: number): {
  checkIn: string;
  checkOut: string;
  los: number; // Length of Stay
} => {
  try {
    const checkInDate = new Date(startDate);
    
    // 날짜가 유효한지 확인
    if (isNaN(checkInDate.getTime())) {
      throw new Error('Invalid date');
    }
    
    // 체크아웃 날짜 계산
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + duration);
    
    // YYYY-MM-DD 형식으로 변환
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      checkIn: formatDate(checkInDate),
      checkOut: formatDate(checkOutDate),
      los: duration
    };
  } catch (error) {
    // 기본값: 오늘부터 duration일
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + duration);
    
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      checkIn: formatDate(today),
      checkOut: formatDate(tomorrow),
      los: duration
    };
  }
};

/**
 * 날짜 형식 검증 (YYYY-MM-DD)
 * 이미 YYYY-MM-DD 형식인지 확인하고, 아니면 변환
 */
const validateAndFormatDate = (dateString: string): string => {
  // 이미 YYYY-MM-DD 형식인지 확인
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateString)) {
    return dateString;
  }
  
  // 형식이 맞지 않으면 Date 객체로 변환 후 포맷팅
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    // 기본값: 오늘 날짜
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * 체크아웃 날짜 계산 헬퍼 함수
 * checkOutDate가 없는 경우, checkInDate에서 los만큼 더한 날짜를 YYYY-MM-DD 형식으로 자동 계산
 */
const calculateCheckOutDate = (checkInDate: string, los: number): string => {
  try {
    // YYYY-MM-DD 형식으로 변환
    const checkIn = validateAndFormatDate(checkInDate);
    const checkInDateObj = new Date(checkIn + 'T00:00:00'); // 타임존 문제 방지
    
    if (isNaN(checkInDateObj.getTime())) {
      throw new Error('Invalid check-in date');
    }
    
    const checkOutDateObj = new Date(checkInDateObj);
    checkOutDateObj.setDate(checkOutDateObj.getDate() + los);
    
    const year = checkOutDateObj.getFullYear();
    const month = String(checkOutDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(checkOutDateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    // 기본값: 오늘부터 los일
    const today = new Date();
    const checkOut = new Date(today);
    checkOut.setDate(checkOut.getDate() + los);
    const year = checkOut.getFullYear();
    const month = String(checkOut.getMonth() + 1).padStart(2, '0');
    const day = String(checkOut.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * 숙소 검색 URL 생성 (지역 + 날짜 + 인원 기반) - 에어비앤비 & 구글 호텔
 * 도시명과 상세 지역명을 조합하여 검색 성공률 향상
 * 모든 파라미터에 encodeURIComponent 적용하여 URL 깨짐 방지
 */
export const getAccommodationSearchUrl = (
  recommendLocation: string,
  recommendCity: string,
  platform: 'airbnb' | 'google_hotels',
  travelDate: string,
  duration: number,
  travelers: number
): string => {
  // 날짜 계산
  const { checkIn, checkOut, los } = calculateDateRange(travelDate, duration);
  const adultCount = Math.max(1, travelers || 1); // 최소 1명 보장
  
  // 날짜 형식 검증 및 포맷팅 (YYYY-MM-DD)
  const checkInDate = validateAndFormatDate(checkIn);
  const checkOutDate = checkOut ? validateAndFormatDate(checkOut) : calculateCheckOutDate(checkInDate, los);
  
  // 도시명과 지역명 정리
  const city = recommendCity.trim();
  let location = recommendLocation.trim();
  
  // 검색어 정제: 불필요한 관사나 모호한 단어 제거
  const cleanLocation = (loc: string): string => {
    // 불필요한 관사 제거 (영어: the, a, an / 프랑스어: le, la, les, du, de, des)
    let cleaned = loc
      .replace(/^(the|a|an|le|la|les|du|de|des)\s+/i, '')
      .replace(/\s+(the|a|an|le|la|les|du|de|des)$/i, '');
    
    // 모호한 단어 제거 (예: "근처", "near", "around" 등)
    cleaned = cleaned
      .replace(/\s*(근처|near|around|nearby|close to)\s*/gi, ' ')
      .trim();
    
    // 불필요한 공백 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned || loc;
  };
  
  location = cleanLocation(location);
  
  // 검색어 보정: [도시명] [상세지역] 조합 (도시명이 맨 앞에 오도록)
  // 구체적인 주소(정조로 833, 번지 등)일 경우 도시명을 반드시 앞에 붙임
  const isDetailedAddress = /^\d+/.test(location) || /(로|길|대로|번지)/.test(location);
  
  // 도시명이 이미 포함되어 있지 않으면 앞에 추가
  let combinedSearchQuery: string;
  if (isDetailedAddress && !location.includes(city)) {
    // 구체적인 주소이고 도시명이 없으면 도시명을 앞에 추가
    combinedSearchQuery = `${city} ${location}`.trim();
  } else if (!location.startsWith(city) && city && city !== '도심') {
    // 도시명이 앞에 없으면 추가
    combinedSearchQuery = `${city} ${location}`.trim();
  } else {
    // 이미 도시명이 포함되어 있거나 도시명이 없으면 그대로 사용
    combinedSearchQuery = location || city || '도심';
  }
  
  // 인코딩 처리
  const encodedCombined = encodeURIComponent(combinedSearchQuery);
  const encodedCity = encodeURIComponent(city);
  const encodedLocation = encodeURIComponent(location);
  
  let finalUrl = '';
  
  switch (platform) {
    case 'airbnb':
      // Airbnb: 현재 100% 성공하고 있는 연결 로직 유지
      const airbnbParams = new URLSearchParams({
        checkin: checkInDate,
        checkout: checkOutDate,
        adults: adultCount.toString(),
        source: 'search'
      });
      
      // 제휴 ID 추가 (PARTNER_ID 변수 - .env에 설정하면 자동 적용)
      if (AFFILIATE_IDS.AIRBNB && AFFILIATE_IDS.AIRBNB !== 'YOUR_AIRBNB_PARTNER_ID') {
        airbnbParams.append('partner', AFFILIATE_IDS.AIRBNB);
      }
      
      finalUrl = `${BOOKING_PLATFORMS.AIRBNB.baseUrl}/s/${encodedCombined}/homes?${airbnbParams.toString()}`;
      break;
    
    case 'google_hotels':
      // 구글 호텔: 공식 검색 URL 형식
      // 검색어 형식: "Hotels in {지역명}, {도시명}" (예: "Hotels in de Valmy, Paris")
      // 도시명과 지역명이 모두 있는 경우
      let googleSearchQuery: string;
      if (city && city !== '도심' && location && location !== '도심') {
        // "Hotels in {지역명}, {도시명}" 형식
        googleSearchQuery = `Hotels in ${location}, ${city}`;
      } else if (city && city !== '도심') {
        // 도시명만 있는 경우
        googleSearchQuery = `Hotels in ${city}`;
      } else if (location && location !== '도심') {
        // 지역명만 있는 경우
        googleSearchQuery = `Hotels in ${location}`;
      } else {
        // 기본값
        googleSearchQuery = 'Hotels';
      }
      
      const encodedGoogleQuery = encodeURIComponent(googleSearchQuery);
      
      // 위치 강제 파라미터 추가: gl=KR (한국), hl=ko (한국어), dest_src=lp (위치 강제 인식)
      finalUrl = `${BOOKING_PLATFORMS.GOOGLE_HOTELS.baseUrl}/search?q=${encodedGoogleQuery}&checkin=${checkInDate}&checkout=${checkOutDate}&adults=${adultCount}&gl=KR&hl=ko&dest_src=lp`;
      break;
    
    default:
      return '';
  }
  
  // 최종 URL trim 처리 (불필요한 공백 제거)
  return finalUrl.trim();
};

/**
 * 플랫폼 브랜드 컬러 가져오기
 */
export const getPlatformBrandColor = (platform: 'airbnb' | 'google_hotels'): string => {
  switch (platform) {
    case 'airbnb':
      return BOOKING_PLATFORMS.AIRBNB.brandColor;
    case 'google_hotels':
      return BOOKING_PLATFORMS.GOOGLE_HOTELS.brandColor;
    default:
      return '#ff8c00';
  }
};

/**
 * 플랫폼 한글명 가져오기
 */
export const getPlatformName = (platform: 'airbnb' | 'google_hotels'): string => {
  switch (platform) {
    case 'airbnb':
      return BOOKING_PLATFORMS.AIRBNB.name;
    case 'google_hotels':
      return BOOKING_PLATFORMS.GOOGLE_HOTELS.name;
    default:
      return '';
  }
};

// 레거시 함수들 제거됨 (에어비앤비 & 구글 호텔만 사용)
