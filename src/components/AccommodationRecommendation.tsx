import React, { useState } from 'react';
import { Home, MapPin, Sparkles, ExternalLink, Copy, Check } from 'lucide-react';
import { TravelPlan } from '../types';
import { 
  getAccommodationSearchUrl, 
  getPlatformBrandColor, 
  getPlatformName 
} from '../services/bookingService';
import { devLog, logError } from '../utils/logger';

interface AccommodationRecommendationProps {
  plan: TravelPlan;
  destination: string;
  travelDate: string;
  duration: number;
  travelers: number;
}

/**
 * 주소나 destination에서 도시명 추출
 */
const extractCityName = (address: string | undefined, destination: string | undefined): string => {
  // destination에서 도시명 추출 (예: "수원, 경기도" -> "수원", "파리, 프랑스" -> "파리")
  if (destination) {
    const cityFromDestination = destination.split(',')[0].trim();
    if (cityFromDestination) {
      return cityFromDestination;
    }
  }
  
  // 주소에서 도시명 추출 (마지막 부분에서 도시명 찾기)
  if (address) {
    const addressParts = address.split(',');
    if (addressParts.length >= 2) {
      // 두 번째 파트에서 도시명 추출 (예: "프랑스" -> "파리"는 추론 필요)
      const countryOrCity = addressParts[addressParts.length - 1].trim();
      // 간단한 경우만 반환
      if (countryOrCity && countryOrCity.length < 20) {
        return countryOrCity;
      }
    }
    
    // 주소의 첫 번째 부분에서 도시명 추출 시도
    const firstPart = addressParts[0].trim();
    if (firstPart && firstPart.length < 30) {
      // 도로명이나 번지가 아닌 경우만 반환
      if (!/^\d+/.test(firstPart) && !/(로|길|대로|번지)/.test(firstPart)) {
        return firstPart;
      }
    }
  }
  
  // 기본값
  if (destination) {
    return destination.split(',')[0].trim() || '도심';
  }
  
  return '도심';
};

/**
 * 전체 일정을 분석하여 최적의 숙소 위치 추천
 * 모든 장소의 중심점을 계산하여 가장 효율적인 위치를 찾음
 * 도시명과 상세 지역명을 별도로 추출
 */
const calculateOptimalLocation = (plan: TravelPlan, destination: string): { area: string; city: string; reason: string } => {
  // 모든 장소의 좌표 수집
  const allPlaces = plan.itinerary.flatMap(day => day.places);
  
  if (allPlaces.length === 0) {
    return {
      area: '도심',
      reason: '일정 정보가 부족하여 도심 지역을 추천합니다.'
    };
  }

  // 중심 좌표 계산
  const avgLat = allPlaces.reduce((sum, p) => sum + p.lat, 0) / allPlaces.length;
  const avgLng = allPlaces.reduce((sum, p) => sum + p.lng, 0) / allPlaces.length;

  // 가장 가까운 장소 찾기
  let closestPlace = allPlaces[0];
  let minDistance = Infinity;

  allPlaces.forEach(place => {
    const distance = Math.sqrt(
      Math.pow(place.lat - avgLat, 2) + Math.pow(place.lng - avgLng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestPlace = place;
    }
  });

  // 숙소 검색에 유리한 지역명 추출 (역 이름, 유명 지역, 관광지 근처 등)
  const extractSearchFriendlyArea = (placeName: string, address: string): string => {
    // 1. 장소 이름에서 역 이름 추출 (한국어/일본어/영어)
    const stationPatterns = [
      /([가-힣]+역)/,           // 한국어: "홍대입구역", "강남역"
      /([가-힣]+역\s*근처)/,    // 한국어: "신촌역 근처"
      /([가-힣A-Za-z]+역)/,     // 일본어/영어: "신주쿠역", "Shinjuku Station"
      /([가-힣A-Za-z]+\s*Station)/i, // 영어: "Shinjuku Station"
    ];
    
    for (const pattern of stationPatterns) {
      const match = placeName.match(pattern) || address.match(pattern);
      if (match) {
        let station = match[1];
        // "Station" 제거하고 역 이름만 반환
        station = station.replace(/\s*Station/i, '').trim();
        return station;
      }
    }
    
    // 2. 장소 이름에서 유명 지역명 추출 (지구, 동 등 - 구는 너무 넓어서 제외)
    const areaPatterns = [
      /([가-힣A-Za-z]+지구)/,   // "마레지구", "강남지구"
      /([가-힣]+동)/,            // "청담동", "압구정동"
      /([가-힣A-Za-z]+시티)/i,   // "시티센터"
    ];
    
    for (const pattern of areaPatterns) {
      const match = placeName.match(pattern) || address.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    // 3. 주소에서 주요 지역명 추출
    const addressParts = address.split(',');
    if (addressParts.length > 0) {
      let firstPart = addressParts[0].trim();
      
      // 숫자로 시작하는 부분 제거 (도로명, 번지 등)
      firstPart = firstPart.replace(/^\d+[-\s]*/, '');
      firstPart = firstPart.replace(/^\d+번지/, '');
      
      // 주소에서 유명 지역명 찾기
      const words = firstPart.split(/\s+/);
      
      // 역 이름이 포함된 경우
      for (const word of words) {
        if (word.includes('역') || word.match(/Station/i)) {
          return word.replace(/\s*Station/i, '').trim();
        }
      }
      
      // 지구, 동이 포함된 경우 (구는 너무 넓어서 제외)
      for (const word of words) {
        if (word.includes('지구') || word.includes('동')) {
          return word;
        }
      }
      
      // 마지막 2단어 사용 (예: "파리 마레지구" -> "마레지구")
      if (words.length > 2) {
        return words.slice(-2).join(' ');
      }
      
      return firstPart || '도심';
    }
    
    // 4. 장소 이름에서 주요 키워드 추출 (관광지 이름 등)
    // 예: "에펠탑" -> "에펠탑 근처", "타임스퀘어" -> "타임스퀘어"
    if (placeName && placeName.length <= 10) {
      return `${placeName} 근처`;
    }
    
    // 5. 기본값
    return '도심';
  };

  // 여러 장소의 지역명을 수집하여 가장 많이 나온 지역 선택
  const areaCounts: { [key: string]: number } = {};
  allPlaces.forEach(place => {
    const area = extractSearchFriendlyArea(place.name, place.address);
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });
  
  // 가장 많이 나온 지역 선택
  let mostCommonArea = '도심';
  let maxCount = 0;
  Object.entries(areaCounts).forEach(([area, count]) => {
    if (count > maxCount && area !== '도심') {
      maxCount = count;
      mostCommonArea = area;
    }
  });
  
  // 가장 가까운 장소의 지역명도 고려
  const closestArea = extractSearchFriendlyArea(closestPlace.name, closestPlace.address);
  
  // 최종 선택: 가장 많이 나온 지역이 있으면 그것을, 없으면 가장 가까운 장소의 지역명 사용
  const area = mostCommonArea !== '도심' ? mostCommonArea : closestArea;

  // 도시명 추출 (destination 또는 주소에서)
  const city = extractCityName(closestPlace.address, destination);

  // 추천 이유 생성
  const reason = mostCommonArea !== '도심' && mostCommonArea !== closestArea
    ? `여행 일정의 주요 장소들이 "${area}" 지역에 집중되어 있어, 이 지역을 베이스캠프로 하면 이동 시간을 최소화할 수 있습니다.`
    : `모든 일정 장소의 중심에 위치한 "${closestPlace.name}" 근처 "${area}" 지역입니다. 교통이 편리하고 숙소 선택의 폭이 넓은 위치입니다.`;

  return {
    area: area || '도심',
    city: city || (destination ? destination.split(',')[0].trim() : '도심') || '도심',
    reason: reason
  };
};

const AccommodationRecommendation: React.FC<AccommodationRecommendationProps> = ({ 
  plan, 
  destination, 
  travelDate,
  duration,
  travelers
}) => {
  const [showMessage, setShowMessage] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [bridgePlatform, setBridgePlatform] = useState<'airbnb' | 'google_hotels' | null>(null);
  const [copiedSearchTerm, setCopiedSearchTerm] = useState(false);
  const optimalLocation = calculateOptimalLocation(plan, destination);
  const recommendLocation = optimalLocation.area;
  const recommendCity = optimalLocation.city;
  const searchTerm = `${recommendCity} ${recommendLocation}`.trim();

  // 토스트 알림 표시 함수
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  // 검색어 복사 함수
  const copySearchTerm = async () => {
    try {
      await navigator.clipboard.writeText(searchTerm);
      setCopiedSearchTerm(true);
      showToastMessage('검색어가 클립보드에 복사되었습니다');
      setTimeout(() => setCopiedSearchTerm(false), 2000);
    } catch (error) {
      showToastMessage('검색어 복사에 실패했습니다');
    }
  };

  // 팝업 차단 원천 봉쇄: 투명한 <a> 태그를 생성해서 element.click() 방식 사용
  const openUrlWithClick = (url: string) => {
    // 투명한 <a> 태그 생성
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.position = 'fixed';
    link.style.top = '0';
    link.style.left = '0';
    link.style.width = '1px';
    link.style.height = '1px';
    link.style.opacity = '0';
    link.style.pointerEvents = 'none';
    link.style.zIndex = '-1';
    
    // DOM에 추가
    document.body.appendChild(link);
    
    // 클릭 이벤트 발생 (브라우저가 '사용자가 직접 클릭한 것'으로 인식)
    link.click();
    
    // 즉시 제거
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  // Bridge Logic: 모달을 띄우고 URL로 이동
  const handleBookingClick = (platform: 'airbnb' | 'google_hotels', url: string) => {
    // Bridge Logic: 모달 먼저 표시
    setBridgeUrl(url);
    setBridgePlatform(platform);
    setShowBridgeModal(true);
    
    // 개발 모드에서만 URL 로깅
    if (import.meta.env.DEV) {
      console.log(`[${platform.toUpperCase()}] URL:`, url);
    }
    
    // 짧은 딜레이 후 URL로 이동 (브라우저 보안 이슈 우회)
    setTimeout(() => {
      try {
        // 팝업 차단 원천 봉쇄: element.click() 방식 사용
        openUrlWithClick(url);
        
        // 모달 자동 닫기 (1.5초 후)
        setTimeout(() => {
          setShowBridgeModal(false);
        }, 1500);
      } catch (error) {
        logError('URL 열기', error);
        showToastMessage('링크 연결에 실패했습니다. 검색어를 복사해서 직접 검색해주세요.');
        setShowBridgeModal(false);
      }
    }, 500);
  };

  // 플랫폼 목록 (에어비앤비 & 구글 호텔)
  const platforms: Array<{
    id: 'airbnb' | 'google_hotels';
    name: string;
    color: string;
    label: string;
    icon: string;
  }> = [
    { 
      id: 'airbnb', 
      name: getPlatformName('airbnb'), 
      color: getPlatformBrandColor('airbnb'),
      label: '에어비앤비에서 예약하기',
      icon: '🏠'
    },
    { 
      id: 'google_hotels', 
      name: getPlatformName('google_hotels'), 
      color: getPlatformBrandColor('google_hotels'),
      label: '구글에서 최저가 비교하기',
      icon: '🔍'
    },
  ];

  return (
    <div className="w-full mt-32 border-t border-white/10 pt-24" data-exclude-from-ticket="true">
      <div className="relative bg-[#1c1b1a] border border-white/10 p-8 md:p-12 rounded-sm shadow-2xl overflow-hidden group">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff8c00] rounded-full blur-[100px] opacity-5 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative z-10">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
            <div className="p-3 bg-[#ff8c00]/10 rounded-full border border-[#ff8c00]/20">
              <Home size={24} className="text-[#ff8c00]" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-serif italic text-[#ece8e1] font-bold tracking-tight">
                최적의 숙소 위치
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] mt-2 font-black">
                Recommended Accommodation Area
              </p>
            </div>
          </div>

          {/* 스마트 추천 텍스트 */}
          <div className="mb-8 space-y-3">
            <div className="bg-white/[0.05] border border-[#ff8c00]/20 p-6 rounded-sm">
              <p className="text-lg md:text-xl text-[#ece8e1] font-serif italic leading-relaxed">
                추천 베이스캠프는{' '}
                <span className="text-[#ff8c00] font-bold not-italic">[{recommendLocation}]</span>
                입니다.
              </p>
            </div>
            <p className="text-sm text-white/50 italic text-center">
              원하는 방식으로 숙소를 찾아보세요:
            </p>
          </div>

          {/* 추천 지역 상세 정보 */}
          <div className="mb-8 space-y-4">
            <div className="flex items-start gap-3 bg-white/[0.03] p-4 border border-white/5 rounded-sm">
              <MapPin size={18} className="text-[#ff8c00] shrink-0 mt-1" />
              <div className="flex-1">
                <span className="text-[9px] uppercase font-black tracking-widest text-white/40 block mb-2">
                  추천 지역
                </span>
                <p className="text-xl md:text-2xl font-serif italic text-[#ece8e1] font-bold">
                  {recommendLocation}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/[0.03] p-4 border border-white/5 rounded-sm">
              <Sparkles size={18} className="text-[#ff8c00] shrink-0 mt-1" />
              <div className="flex-1">
                <span className="text-[9px] uppercase font-black tracking-widest text-white/40 block mb-2">
                  추천 이유
                </span>
                <p className="text-[13px] text-white/60 leading-relaxed italic font-light">
                  {optimalLocation.reason}
                </p>
              </div>
            </div>
          </div>

          {/* 예약 버튼 (에어비앤비 & 구글 호텔) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map((platform) => {
              const url = getAccommodationSearchUrl(
                recommendLocation,
                recommendCity,
                platform.id,
                travelDate,
                duration,
                travelers
              );
              
              return (
                <button
                  key={platform.id}
                  onClick={() => handleBookingClick(platform.id, url)}
                  className="group relative flex items-center justify-between gap-4 px-6 py-6 border border-white/10 hover:border-opacity-100 transition-all duration-300 shadow-xl overflow-hidden cursor-pointer"
                  style={{
                    backgroundColor: platform.id === 'airbnb' 
                      ? `${platform.color}15` 
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {/* 호버 시 브랜드 컬러 배경 */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ 
                      backgroundColor: platform.id === 'airbnb' 
                        ? `${platform.color}20` 
                        : 'rgba(66, 133, 244, 0.1)'
                    }}
                  />
                  
                  {/* 버튼 내용 */}
                  <div className="relative z-10 flex items-center gap-4 w-full">
                    {/* 아이콘 */}
                    <div 
                      className="text-3xl flex-shrink-0"
                      style={{ 
                        filter: platform.id === 'google_hotels' ? 'grayscale(0.3)' : 'none'
                      }}
                    >
                      {platform.icon}
                    </div>
                    
                    {/* 텍스트 */}
                    <div className="flex-1 text-left">
                      <p 
                        className="text-base md:text-lg font-bold"
                        style={{ 
                          color: platform.id === 'airbnb' 
                            ? platform.color 
                            : '#4285F4'
                        }}
                      >
                        {platform.label}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {platform.id === 'airbnb' ? '독특한 숙소와 체험' : '모든 사이트 가격 비교'}
                      </p>
                    </div>
                    
                    {/* 외부 링크 아이콘 */}
                    <ExternalLink 
                      size={18} 
                      className="opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ 
                        color: platform.id === 'airbnb' 
                          ? platform.color 
                          : '#4285F4'
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* 검색어 복사 버튼 (하단 중앙) */}
          <div className="flex justify-center mt-4">
            <button
              onClick={copySearchTerm}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all text-sm text-white/60 hover:text-white/80"
              title="검색어 복사"
            >
              {copiedSearchTerm ? (
                <>
                  <Check size={14} className="text-[#ff8c00]" />
                  <span>복사 완료</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>검색어 복사</span>
                </>
              )}
            </button>
          </div>

          {/* 메시지 알림 */}
          {showMessage && (
            <div className="mt-6 p-4 bg-[#ff8c00]/20 border border-[#ff8c00]/30 rounded-sm animate-fade-in">
              <p className="text-sm text-[#ece8e1] text-center italic">
                최적의 위치를 기반으로 숙소를 찾아드릴게요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bridge Logic 모달 (이동 중) */}
      {showBridgeModal && bridgePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1c1b1a] border border-[#ff8c00]/30 shadow-2xl rounded-sm p-8 max-w-md mx-4">
            <div className="flex flex-col items-center gap-4">
              {/* 로딩 애니메이션 */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[#ff8c00]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-[#ff8c00] rounded-full animate-spin" />
              </div>
              
              {/* 메시지 */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-serif italic text-[#ece8e1] font-bold">
                  이동 중...
                </h3>
                <p className="text-sm text-white/60 italic">
                  {getPlatformName(bridgePlatform)}로 이동하고 있습니다
                </p>
                <p className="text-xs text-white/40 mt-4">
                  잠시만 기다려주세요
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 (팝업 차단 시) */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-[#1c1b1a] border border-[#ff8c00]/50 shadow-2xl rounded-sm px-6 py-4 max-w-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#ff8c00] rounded-full animate-pulse" />
              <p className="text-sm text-[#ece8e1] font-light italic">
                {toastMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccommodationRecommendation;
