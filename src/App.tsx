
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clapperboard,
  User,
  LogOut,
  Archive,
  Eye,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { UserProfile, TravelPlan } from './types';
import { generateTravelPlan } from './services/geminiService';
import ResultView from './components/ResultView';
import LoginModal from './components/LoginModal';
import { getCurrentUser, signOut, onAuthStateChange, supabase, readAndClearAuthDebug } from './lib/supabase';
import { saveTrip, getSavedTrips, deleteTrip, type SavedTrip } from './services/tripService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { devLog, devWarn, logError } from './utils/logger';
import { validateTextInput, validateStringArray } from './utils/security';

/** img src용 URL 검증 (http/https만 허용) - 외부 참조 에러 방지를 위해 App 내부 정의 */
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length > 2000) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

/** 닉네임/프로필 없으면 '나의 여행자' 반환 */
const getUserDisplayName = (u: SupabaseUser | null): string => {
  if (!u) return '나의 여행자';
  const m = u.user_metadata;
  return (m?.nickname ?? m?.name ?? m?.full_name ?? u.email?.split('@')[0]) || '나의 여행자';
};

const App: React.FC = () => {
  const [step, setStep] = useState<'form' | 'loading' | 'result' | 'archive'>('form');
  const [profile, setProfile] = useState<UserProfile>({
    age: 26,
    gender: 'female',
    nationality: '대한민국',
    hobbies: ['필름 카메라', 'LP 바', '빈티지 쇼핑'],
    travelStyle: 'balanced',
    destination: '파리',
    duration: 3,
    travelers: 1, // 초기값 설정
    travelDate: new Date().toISOString().split('T')[0],
    activityTime: 'night-owl'
  });
  const [newHobby, setNewHobby] = useState('');
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [savedTripsLoading, setSavedTripsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증 및 XSS 방지
    const validatedProfile: UserProfile = {
      ...profile,
      destination: validateTextInput(profile.destination, 200),
      hobbies: validateStringArray(profile.hobbies, 20),
      nationality: validateTextInput(profile.nationality, 100),
    };
    
    setStep('loading');
    try {
      const generatedPlan = await generateTravelPlan(validatedProfile);
      setPlan(generatedPlan);
      setStep('result');
      window.scrollTo(0, 0);
    } catch (error) {
      logError('시나리오 생성', error);
      setToastMessage('시나리오를 구성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setTimeout(() => setToastMessage(null), 5000);
      setStep('form');
    }
  };

  // 입력값 변경 시 실시간 검증
  const handleDestinationChange = (value: string) => {
    const sanitized = validateTextInput(value, 200);
    setProfile(prev => ({ ...prev, destination: sanitized }));
  };

  const handleHobbyAdd = () => {
    if (newHobby) {
      const sanitized = validateTextInput(newHobby, 100);
      if (sanitized && !profile.hobbies.includes(sanitized)) {
        setProfile(prev => ({ ...prev, hobbies: [...prev.hobbies, sanitized] }));
        setNewHobby('');
      }
    }
  };

  // /archive 경로일 때 보관함 단계로
  useEffect(() => {
    if (location.pathname === '/archive') setStep('archive');
  }, [location.pathname]);

  // addHobby는 handleHobbyAdd로 대체됨 (XSS 방지 포함)

  // 인증 상태 감지 및 콜백 처리
  useEffect(() => {
    // OAuth 복귀 시: 리다이렉트 직전 저장된 로그 출력 (개발 모드에서만)
    const preRedirect = readAndClearAuthDebug();
    if (preRedirect) {
      devLog('로그인 버튼 클릭 직전 저장됨:', preRedirect);
    }

    // Supabase 환경 변수 확인
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      devWarn('Supabase 환경 변수가 설정되지 않아 로그인 기능이 비활성화됩니다.');
      return;
    }

    // URL 해시에서 인증 토큰 처리 (Supabase OAuth 콜백)
    const handleAuthCallback = async () => {
      try {
        const currentHash = window.location.hash;
        
        if (!currentHash || currentHash.length === 0) {
          return;
        }

        const hashParams = new URLSearchParams(currentHash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // 에러 파라미터 확인
        if (errorParam) {
          logError('OAuth 에러', { error: errorParam, description: errorDescription });
          setToastMessage('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
          setTimeout(() => setToastMessage(null), 5000);
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        if (accessToken && refreshToken) {
          // 세션 설정 (해시 제거 전에 먼저 처리)
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // URL 정리 (해시 제거)
          window.history.replaceState({}, document.title, window.location.pathname);

          if (error) {
            logError('세션 설정', error);
            setToastMessage(
              '로그인 처리에 실패했습니다. Vercel 환경 변수(VITE_SUPABASE_ANON_KEY) 확인 후 재배포해주세요.'
            );
            setTimeout(() => setToastMessage(null), 6000);
          } else {
            // 세션 설정 후 짧은 딜레이를 주어 Supabase가 내부적으로 세션을 처리할 시간 제공
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (data?.user) {
              setUser(data.user);
              setShowLoginModal(false);
            }
          }
        }
      } catch (error) {
        logError('인증 콜백 처리', error);
        setToastMessage('인증 처리 중 문제가 발생했습니다.');
        setTimeout(() => setToastMessage(null), 5000);
      }
    };

    handleAuthCallback();

    // 인증 상태 변경 감지 (onAuthStateChange 리스너 사용)
    let subscription: any = null;
    
    try {
      subscription = onAuthStateChange((event, session, user) => {
        devLog('인증 이벤트:', event);
        
        // SIGNED_IN 상태일 때만 유저 정보 저장
        if (event === 'SIGNED_IN' && session && user) {
          setUser(user);
          setShowLoginModal(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session && user) {
          // 토큰 갱신 시에도 유저 정보 업데이트
          setUser(user);
        }
      });

      // 초기 세션 확인 (리스너가 설정된 후)
      setTimeout(async () => {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            logError('초기 세션 확인', error);
            return;
          }

          if (currentSession?.user) {
            setUser(currentSession.user);
          }
        } catch (error) {
          logError('초기 세션 확인 예외', error);
        }
      }, 200);

      return () => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      logError('인증 상태 감지 설정', error);
      return () => {};
    }
  }, []);

  // 티켓 저장 함수
  const handleSaveTrip = async () => {
    if (!user || !plan) return;

    setIsSaving(true);
    setToastMessage(null);
    try {
      await saveTrip(profile, plan);
      setToastMessage('보관함에 저장되었습니다');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      logError('이 티켓 저장하기', error);
      setToastMessage('저장 중 문제가 발생했습니다. 콘솔에서 상세 에러를 확인해주세요.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      logError('로그아웃', error);
      setUser(null);
    }
  };

  // 보관함 진입
  const openArchive = () => {
    navigate('/archive');
    window.scrollTo(0, 0);
  };

  // 보관함 목록 조회
  const fetchSavedTrips = useCallback(async () => {
    if (!user) return;
    setSavedTripsLoading(true);
    try {
      const list = await getSavedTrips(user.id);
      setSavedTrips(list);
    } catch (error) {
      logError('보관함 목록 조회', error);
      setSavedTrips([]);
      setToastMessage('보관함을 불러오는 중 문제가 발생했습니다.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSavedTripsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (step === 'archive' && user) void fetchSavedTrips();
  }, [step, user, fetchSavedTrips]);

  const handleGoForm = () => {
    setStep('form');
    window.scrollTo(0, 0);
    navigate('/');
  };

  // 보관함 상세 보기

  // 보관함 삭제
  const handleDeleteTrip = async (trip: SavedTrip, fromDetail: boolean) => {
    if (!user) return;
    if (!confirm(`"${trip.city}" 여행을 삭제할까요?`)) return;
    setDeletingId(trip.id);
    try {
      await deleteTrip(trip.id, user.id);
      setToastMessage('삭제되었습니다');
      setTimeout(() => setToastMessage(null), 3000);
      if (fromDetail) navigate('/archive');
      await fetchSavedTrips();
    } catch (error) {
      logError('보관함 삭제', error);
      setToastMessage('삭제 중 문제가 발생했습니다. 다시 시도해주세요.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121110] p-8 text-center">
        <div className="relative w-24 h-24 mb-12">
          <Clapperboard className="w-full h-full text-[#ff8c00] animate-pulse" strokeWidth={1} />
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-serif italic tracking-[0.1em] text-[#ece8e1]">Rendering the screenplay...</h2>
          <div className="flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <p className="text-[10px] text-white/30 font-black tracking-[0.5em] uppercase italic">당신의 시나리오를 현상하고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && plan) {
    return (
      <ResultView
        plan={plan}
        profile={profile}
        user={user}
        showSaveButton={true}
        isSaving={isSaving}
        onSave={handleSaveTrip}
        toastMessage={toastMessage}
        onGoArchive={openArchive}
        onGoForm={handleGoForm}
        onLoginClick={() => setShowLoginModal(true)}
        onSignOut={handleSignOut}
        showLoginModal={showLoginModal}
        onCloseLoginModal={() => setShowLoginModal(false)}
      />
    );
  }

  if (step === 'archive') {
    const formatDate = (s: string) => {
      const d = new Date(s);
      return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
    };

    return (
      <div className="min-h-screen bg-[#121110]">
        <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-12 py-6 z-50 bg-[#121110]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-grotesk font-bold text-[9px] tracking-widest text-white uppercase italic">내 보관함</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url && isValidImageUrl(user.user_metadata.avatar_url) ? (
                  <img src={user.user_metadata.avatar_url} alt={getUserDisplayName(user)} className="w-8 h-8 rounded-full border border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <User size={16} className="text-white/60" />
                  </div>
                )}
                <span className="text-xs text-white/60 font-light">{getUserDisplayName(user) + '님 환영합니다'}</span>
              </div>
            )}
            <button
              onClick={handleGoForm}
              className="text-white border border-white/10 px-5 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[#ff8c00] hover:text-black hover:border-transparent transition-all"
            >
              시나리오 쓰기
            </button>
          </div>
        </nav>

        <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
            <div className="space-y-12">
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full w-fit">
                <Archive size={14} className="text-[#ff8c00]" />
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-white/60 italic">Saved Trips</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif italic font-semibold text-[#ece8e1] tracking-tight">
                내 보관함
              </h1>
              <p className="text-lg text-white/40 font-light italic max-w-2xl">
                저장한 여행 티켓을 모아봤어요. 자세히 보기나 삭제할 수 있습니다.
              </p>
              {savedTripsLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <Clapperboard className="w-16 h-16 text-[#ff8c00] animate-pulse" strokeWidth={1} />
                  <p className="text-sm text-white/40 italic">불러오는 중...</p>
                </div>
              ) : savedTrips.length === 0 ? (
                <div className="py-24 border border-white/10 rounded-sm bg-white/[0.02] flex flex-col items-center justify-center gap-6">
                  <Archive size={48} className="text-white/20" />
                  <p className="text-white/40 italic">저장된 여행이 없습니다.</p>
                  <p className="text-sm text-white/30">시나리오를 만들고 티켓을 저장해 보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {savedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="group bg-[#1c1b1a] border border-white/10 hover:border-[#ff8c00]/40 transition-all p-6 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-serif italic font-semibold text-[#ece8e1]">{trip.city}</h3>
                          <p className="text-sm text-white/40 mt-1">
                            {formatDate(trip.dates.start_date)} – {formatDate(trip.dates.end_date)}
                          </p>
                        </div>
                        <span className="text-[9px] text-white/30 font-mono shrink-0">
                          {formatDate(trip.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 italic line-clamp-3 flex-1">{trip.synopsis}</p>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => navigate(`/trip/${trip.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff8c00] hover:bg-[#ff9d1a] text-black text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <Eye size={12} />
                          보기
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip, false)}
                          disabled={deletingId === trip.id}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/20 text-white/70 hover:border-red-500/50 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deletingId === trip.id ? '...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </main>

        {toastMessage && (
          <div
            role="alert"
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-[#ff8c00] text-black font-bold text-sm uppercase tracking-wider shadow-xl animate-fade-in"
          >
            {toastMessage}
          </div>
        )}
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121110] selection:bg-[#ff8c00] selection:text-black">
      <header className="px-4 sm:px-6 md:px-12 py-8 md:py-12 flex justify-between items-center border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <Clapperboard size={28} className="text-[#ff8c00] group-hover:rotate-12 transition-transform" strokeWidth={1.5} />
          <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-white italic">여행 한 편</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <>
              {/* 모바일: 아이콘만 표시, 데스크톱: 전체 정보 */}
              <div className="hidden md:flex items-center gap-3">
                {user.user_metadata?.avatar_url && isValidImageUrl(user.user_metadata.avatar_url) ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt={getUserDisplayName(user)} 
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <User size={16} className="text-white/60" />
                  </div>
                )}
                <span className="text-[11px] text-white/60 font-light">
                  {getUserDisplayName(user) + '님 환영합니다'}
                </span>
              </div>
              {/* 모바일: 아바타만 표시 */}
              <div className="md:hidden">
                {user.user_metadata?.avatar_url && isValidImageUrl(user.user_metadata.avatar_url) ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt={getUserDisplayName(user)} 
                    className="w-8 h-8 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <User size={16} className="text-white/60" />
                  </div>
                )}
              </div>
              {/* 모바일: 아이콘 버튼, 데스크톱: 텍스트 버튼 */}
              <button
                onClick={openArchive}
                className="text-white/60 hover:text-white text-[10px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 p-2 md:p-0 min-w-[44px] md:min-w-0 min-h-[44px] md:min-h-0 justify-center"
                aria-label="내 보관함"
              >
                <Archive size={14} className="md:w-3 md:h-3" />
                <span className="hidden md:inline">내 보관함</span>
              </button>
              <button
                onClick={handleSignOut}
                className="text-white/60 hover:text-white text-[10px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 p-2 md:p-0 min-w-[44px] md:min-w-0 min-h-[44px] md:min-h-0 justify-center"
                aria-label="로그아웃"
              >
                <LogOut size={14} className="md:w-3 md:h-3" />
                <span className="hidden md:inline">로그아웃</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-white border border-white/10 px-4 md:px-4 py-2.5 md:py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff8c00] hover:text-black hover:border-transparent transition-all flex items-center gap-2 min-h-[44px] md:min-h-0"
            >
              <User size={14} className="md:w-3 md:h-3" />
              <span>로그인</span>
            </button>
          )}
        </div>
      </header>

      {/* Reduced top padding from pt-40 to pt-24 */}
      <main className="pt-12 sm:pt-16 md:pt-24 pb-32 sm:pb-48 md:pb-64 px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-48 space-y-16">
            <div className="inline-flex items-center gap-4 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
               <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
               <span className="text-[10px] uppercase font-black tracking-[0.4em] text-white/50 italic">Casting in Progress</span>
            </div>
            <h1 className="text-hero font-serif italic font-semibold text-[#ece8e1] tracking-tighter">
              세상은 무대, <br /> 여행은 <span className="text-[#ff8c00] italic underline decoration-1 underline-offset-[12px] decoration-white/10">시네마토그래피.</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/20 font-light max-w-2xl italic leading-relaxed border-l-4 border-[#ff8c00]/30 pl-8 sm:pl-12 md:pl-16">
              당신이 주인공인 가장 아름다운 시퀀스를 현상합니다. <br className="hidden sm:block" />
              누구도 흉내 낼 수 없는 당신만의 취향이 담긴 <br className="hidden sm:block" />
              세상에 단 하나뿐인 시나리오를 만나보세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 lg:gap-20 xl:gap-24">
            <div className="lg:col-span-7 space-y-16 sm:space-y-20 md:space-y-24 lg:space-y-32 xl:space-y-40">
              <div className="space-y-8">
                <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">01. 촬영지 선택 (Destination)</label>
                <input 
                  type="text" 
                  value={profile.destination}
                  onChange={e => handleDestinationChange(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/10 py-4 sm:py-6 text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1] placeholder:text-white/5"
                  placeholder="Paris, Tokyo, ..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 md:gap-20">
                <div className="space-y-8">
                  <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">02. 상영 시작일</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={profile.travelDate}
                      onChange={e => setProfile({...profile, travelDate: e.target.value})}
                      className="w-full bg-transparent border-b-2 border-white/10 py-4 sm:py-6 pr-10 sm:pr-12 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1]"
                      style={{
                        colorScheme: 'dark'
                      }}
                      required
                    />
                    <Calendar 
                      size={22} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none flex-shrink-0" 
                      strokeWidth={2}
                    />
                  </div>
                </div>

                <div className="flex gap-12">
                   <div className="space-y-8 flex-1">
                     <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">03. 총 컷수 (Days)</label>
                     <div className="flex items-baseline gap-4">
                       <input 
                         type="number" min="1" max="7"
                         value={profile.duration}
                         onChange={e => setProfile({...profile, duration: parseInt(e.target.value)})}
                         className="w-full bg-transparent border-b-2 border-white/10 py-4 sm:py-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1]"
                       />
                       <span className="text-xl font-serif italic text-white/5 uppercase tracking-[0.2em]">일</span>
                     </div>
                   </div>

                   <div className="space-y-8 flex-1">
                     <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">04. 인원 (Cast)</label>
                     <div className="flex items-baseline gap-4">
                       <input 
                         type="number" min="1" max="10"
                         value={profile.travelers}
                         onChange={e => setProfile({...profile, travelers: parseInt(e.target.value)})}
                         className="w-full bg-transparent border-b-2 border-white/10 py-4 sm:py-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1]"
                       />
                       <span className="text-xl font-serif italic text-white/5 uppercase tracking-[0.2em]">명</span>
                     </div>
                   </div>
                </div>
              </div>

              <div className="space-y-12">
                <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">05. 캐릭터 취향 (Motif)</label>
                <div className="flex flex-wrap gap-5">
                  {profile.hobbies.map((hobby, i) => (
                    <button 
                      key={i} type="button"
                      onClick={() => setProfile({...profile, hobbies: profile.hobbies.filter(h => h !== hobby)})}
                      className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border border-white/10 text-[10px] sm:text-[11px] uppercase font-black tracking-[0.4em] hover:border-[#ff8c00] hover:text-[#ff8c00] transition-all italic flex items-center gap-3 sm:gap-4 md:gap-5 bg-white/[0.03] shadow-lg min-h-[44px] md:min-h-0"
                    >
                      {hobby} <span className="opacity-40 text-base sm:text-lg">×</span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newHobby}
                    onChange={e => setNewHobby(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleHobbyAdd())}
                    className="w-full bg-white/[0.04] border border-white/10 py-8 sm:py-10 px-8 sm:px-12 pr-14 sm:pr-16 outline-none text-[11px] sm:text-[12px] font-black uppercase tracking-[0.5em] focus:bg-white/[0.08] focus:border-[#ff8c00]/40 transition-all text-white placeholder:text-white/10 shadow-inner min-h-[44px] sm:min-h-0"
                    placeholder="취미나 선호 키워드 추가"
                  />
                  <button type="button" onClick={handleHobbyAdd} className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 p-2 sm:p-3 group min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="취미 추가">
                    <Plus size={20} className="sm:w-7 sm:h-7 text-white/20 group-hover:text-[#ff8c00] transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-12 lg:gap-16 xl:gap-20 lg:border-l lg:border-white/5 lg:pl-8 xl:pl-12 2xl:pl-16">
               <div className="space-y-8 lg:space-y-12">
                 <div className="flex justify-between items-baseline gap-4">
                   <label className="text-[10px] lg:text-[11px] uppercase tracking-[0.8em] lg:tracking-[1em] font-black text-white/20 italic shrink-0">06. 캐스팅 연령</label>
                   <span className="text-4xl lg:text-5xl xl:text-6xl font-serif italic text-[#ece8e1] shrink-0">{profile.age}</span>
                 </div>
                 <input 
                    type="range" min="0" max="100" 
                    value={profile.age}
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                    className="w-full cursor-pointer"
                  />
               </div>

               <div className="space-y-8 lg:space-y-10">
                  <label className="text-[10px] lg:text-[11px] uppercase tracking-[0.8em] lg:tracking-[1em] font-black text-white/20 italic">07. 조명 톤 (활동 시간)</label>
                  <div className="grid grid-cols-1 gap-4 lg:gap-6">
                    <button
                      type="button"
                      onClick={() => setProfile({...profile, activityTime: 'early-bird'})}
                      className={`flex items-center justify-between px-6 py-8 lg:px-10 lg:py-12 border transition-all duration-700 shadow-xl ${
                        profile.activityTime === 'early-bird' ? 'border-[#ff8c00] bg-[#ff8c00] text-black scale-[1.02]' : 'border-white/5 text-white/30 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4 lg:gap-6 xl:gap-10">
                        <Sun size={24} strokeWidth={1} className="lg:w-8 lg:h-8" />
                        <span className="text-[10px] lg:text-[11px] xl:text-[12px] uppercase font-black tracking-[0.3em] lg:tracking-[0.5em] italic">얼리버드 (Morning)</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({...profile, activityTime: 'night-owl'})}
                      className={`flex items-center justify-between px-6 py-8 lg:px-10 lg:py-12 border transition-all duration-700 shadow-xl ${
                        profile.activityTime === 'night-owl' ? 'border-[#ff8c00] bg-[#ff8c00] text-black scale-[1.02]' : 'border-white/5 text-white/30 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4 lg:gap-6 xl:gap-10">
                        <Moon size={24} strokeWidth={1} className="lg:w-8 lg:h-8" />
                        <span className="text-[10px] lg:text-[11px] xl:text-[12px] uppercase font-black tracking-[0.3em] lg:tracking-[0.5em] italic">나이트아울 (Night)</span>
                      </div>
                    </button>
                  </div>
               </div>

               <div className="pt-8 lg:pt-12 xl:pt-16">
                 <button 
                    type="submit"
                    className="w-full py-10 sm:py-12 md:py-14 bg-white text-black font-black uppercase tracking-[0.6em] sm:tracking-[0.7em] md:tracking-[0.8em] text-[13px] sm:text-[14px] md:text-[15px] hover:bg-[#ff8c00] transition-all flex items-center justify-center gap-4 sm:gap-6 md:gap-8 shadow-[0_20px_60px_-15px_rgba(255,140,0,0.3)] active:scale-[0.98] min-h-[56px] touch-manipulation"
                  >
                    시나리오 현상 <ArrowRight size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </button>
               </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="px-6 md:px-12 py-40 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-20 text-white/10 bg-black/20">
        <div className="flex items-center gap-8">
          <Clapperboard size={56} strokeWidth={0.5} className="text-[#ff8c00]/40" />
          <div className="flex flex-col">
            <span className="text-[12px] uppercase tracking-[1em] font-black">여행 한 편 (A Cinematic Journey)</span>
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold mt-3">© 2025 Cinematic Storyteller & Trip Designer.</span>
          </div>
        </div>
        <div className="flex gap-20">
          {['Instagram', 'Terms', 'Privacy'].map(item => (
            <span key={item} className="text-[11px] uppercase tracking-[0.5em] font-black hover:text-white/40 cursor-pointer transition-colors italic">{item}</span>
          ))}
        </div>
      </footer>

      {/* 토스트: 보관함 저장 완료 */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-[#ff8c00] text-black font-bold text-sm uppercase tracking-wider shadow-xl animate-fade-in"
        >
          {toastMessage}
        </div>
      )}

      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
};

export default App;
