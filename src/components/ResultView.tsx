import React from 'react';
import {
  Map as MapIcon,
  ExternalLink,
  Film,
  User,
  LogOut,
  Save,
  Archive,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, TravelPlan, DayItinerary } from '../types';
import PlaceCard from './PlaceCard';
import SoundtrackPlaylist from './SoundtrackPlaylist';
import MovieCurator from './MovieCurator';
import TicketGenerator from './TicketGenerator';
import AccommodationRecommendation from './AccommodationRecommendation';
import LoginModal from './LoginModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

function getGoogleMapsRouteUrl(dayPlan: DayItinerary): string {
  if (dayPlan.places.length === 0) return '';
  const origin = `${dayPlan.places[0].lat},${dayPlan.places[0].lng}`;
  const destination = `${dayPlan.places[dayPlan.places.length - 1].lat},${dayPlan.places[dayPlan.places.length - 1].lng}`;
  if (dayPlan.places.length > 2) {
    const waypoints = dayPlan.places.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
}

function getUserDisplayName(u: SupabaseUser | null): string {
  if (!u) return '나의 여행자';
  const m = u.user_metadata;
  return (m?.nickname ?? m?.name ?? m?.full_name ?? u.email?.split('@')[0]) || '나의 여행자';
}

export interface ResultViewProps {
  plan: TravelPlan;
  profile: UserProfile;
  user?: SupabaseUser | null;
  showSaveButton?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  toastMessage?: string | null;
  onGoArchive?: () => void;
  onGoForm?: () => void;
  onLoginClick?: () => void;
  onSignOut?: () => void;
  /** 보관함 상세에서 올 때 표시할 뒤로가기 링크 */
  backLink?: { label: string; to: string };
  showLoginModal?: boolean;
  onCloseLoginModal?: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({
  plan,
  profile,
  user = null,
  showSaveButton = true,
  isSaving = false,
  onSave,
  toastMessage = null,
  onGoArchive,
  onGoForm,
  onLoginClick,
  onSignOut,
  backLink,
  showLoginModal = false,
  onCloseLoginModal = () => {},
}) => {
  return (
    <div className="min-h-screen bg-[#121110]">
      <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 sm:py-5 md:py-6 z-50 bg-[#121110]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          {backLink ? (
            <Link
              to={backLink.to}
              className="flex items-center gap-2 text-white/60 hover:text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={14} />
              {backLink.label}
            </Link>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="font-grotesk font-bold text-[8px] sm:text-[9px] tracking-widest text-white uppercase italic">
                ARCHIVE_ID.{Math.floor(Math.random() * 99999)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {user.user_metadata?.avatar_url && typeof user.user_metadata.avatar_url === 'string' && (user.user_metadata.avatar_url.startsWith('http://') || user.user_metadata.avatar_url.startsWith('https://')) ? (
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
                <span className="text-xs text-white/60 font-light">{getUserDisplayName(user) + '님 환영합니다'}</span>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="text-white/60 hover:text-white border border-white/10 px-3 sm:px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 justify-center"
                  aria-label="로그아웃"
                >
                  <LogOut size={14} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              )}
            </>
          ) : (
            onLoginClick && (
              <button
                onClick={onLoginClick}
                className="text-white border border-white/10 px-4 sm:px-5 py-2.5 sm:py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[#ff8c00] hover:text-black hover:border-transparent transition-all flex items-center gap-2 min-h-[44px] sm:min-h-0"
              >
                <User size={14} className="sm:w-3 sm:h-3" />
                <span>로그인</span>
              </button>
            )
          )}
          {user && onGoArchive && (
            <button
              onClick={onGoArchive}
              className="text-white border border-white/10 px-4 sm:px-5 py-2.5 sm:py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 justify-center"
              aria-label="내 보관함"
            >
              <Archive size={14} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">내 보관함</span>
            </button>
          )}
          {onGoForm && (
            <button
              onClick={onGoForm}
              className="text-white border border-white/10 px-4 sm:px-5 py-2.5 sm:py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[#ff8c00] hover:text-black hover:border-transparent transition-all min-h-[44px] sm:min-h-0"
            >
              시나리오 다시 쓰기
            </button>
          )}
          {!onGoForm && backLink && (
            <Link
              to="/"
              className="text-white border border-white/10 px-4 sm:px-5 py-2.5 sm:py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[#ff8c00] hover:text-black hover:border-transparent transition-all min-h-[44px] sm:min-h-0 inline-flex items-center"
            >
              시나리오 다시 쓰기
            </Link>
          )}
        </div>
      </nav>

      <header className="relative pt-20 sm:pt-32 md:pt-44 pb-12 sm:pb-18 md:pb-24 px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="brutalist-line mb-8 sm:mb-12 md:mb-16 opacity-10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 md:gap-16 items-end">
          <div className="lg:col-span-8 space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <Film size={12} className="text-[#ff8c00]" />
              <span className="text-[9px] uppercase font-black tracking-[0.5em] text-white/60 italic">Director's Final Cut</span>
            </div>
            <h1 className="text-hero font-serif italic font-semibold text-[#ece8e1] tracking-tighter leading-[1.0]">
              {plan.personalityTitle}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/40 font-light leading-relaxed italic max-w-3xl border-l-2 border-[#ff8c00]/30 pl-6 sm:pl-8 md:pl-12">
              {plan.personalityDescription}
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col items-end gap-8 sm:gap-10 md:gap-12">
            <div className="text-right group">
              <span className="block text-[8px] sm:text-[9px] uppercase font-black tracking-[0.5em] text-white/20 mb-2 sm:mb-3 italic">Vibe Match Rating</span>
              <span className="text-5xl sm:text-6xl md:text-7xl font-serif italic text-white group-hover:text-[#ff8c00] transition-colors">{plan.vibeScore}%</span>
            </div>
            {showSaveButton && user && onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#ff8c00] hover:bg-[#ff9d1a] text-black font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-h-[44px] sm:min-h-0"
              >
                <Save size={14} className="sm:w-3.5 sm:h-3.5" />
                <span>{isSaving ? '저장 중...' : '이 티켓 저장하기'}</span>
              </button>
            )}
          </div>
        </div>
        <div className="brutalist-line mt-24 opacity-10" />
      </header>

      <main className="px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto space-y-32 sm:space-y-40 md:space-y-56 pb-32 sm:pb-40 md:pb-60">
        <section className="space-y-12 sm:space-y-16 md:space-y-20">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.8em] text-[#ff8c00] italic">Set Etiquette</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 sm:gap-x-12 gap-y-10 sm:gap-y-14 md:gap-y-16">
            {plan.localEtiquette.map((tip, i) => (
              <div key={i} className="flex flex-col gap-4 group">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-[#ff8c00] opacity-40">0{i + 1}</span>
                  <div className="h-[1px] w-4 bg-white/10 group-hover:w-full transition-all" />
                </div>
                <p className="text-[14px] text-white/50 leading-relaxed italic font-light group-hover:text-white transition-colors duration-500">{tip}</p>
              </div>
            ))}
          </div>
          {plan.movies && plan.movies.length > 0 && <MovieCurator movies={plan.movies} />}
        </section>

        {plan.itinerary.map((dayPlan) => (
          <section key={dayPlan.day} className="space-y-12 sm:space-y-16 md:space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 sm:pb-10 md:pb-12 gap-6 sm:gap-8 md:gap-10">
              <div className="flex flex-col gap-3 sm:gap-4">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[1em] font-black text-[#ff8c00] opacity-60 italic">EPISODE SEQUENCE</span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic font-black text-[#ece8e1] leading-none tracking-tighter">
                  EP. 0{dayPlan.day}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-6">
                <a
                  href={getGoogleMapsRouteUrl(dayPlan)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 sm:gap-4 px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-white/5 hover:bg-[#ff8c00] hover:text-black border border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all group shadow-xl min-h-[44px] sm:min-h-0"
                >
                  <MapIcon size={16} className="sm:w-4 sm:h-4 group-hover:text-black" />
                  <span>전체 촬영 경로</span>
                  <ExternalLink size={14} className="sm:w-3.5 sm:h-3.5 opacity-40" />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {dayPlan.places.map((place, idx) => (
                <PlaceCard
                  key={idx}
                  index={idx}
                  place={place}
                  destination={profile.destination}
                  travelDate={profile.travelDate}
                />
              ))}
            </div>
          </section>
        ))}

        {plan.soundtrack && plan.soundtrack.length > 0 && <SoundtrackPlaylist songs={plan.soundtrack} />}

        <AccommodationRecommendation
          plan={plan}
          destination={profile.destination}
          travelDate={profile.travelDate}
          duration={profile.duration}
          travelers={profile.travelers}
        />

        <TicketGenerator
          plan={plan}
          destination={profile.destination}
          date={profile.travelDate}
          duration={profile.duration}
          travelers={profile.travelers}
        />
      </main>

      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 sm:px-6 py-3 sm:py-4 bg-[#ff8c00] text-black font-bold text-xs sm:text-sm uppercase tracking-wider shadow-xl animate-fade-in max-w-[90vw] sm:max-w-none text-center"
        >
          {toastMessage}
        </div>
      )}

      {showLoginModal && onCloseLoginModal && <LoginModal isOpen={showLoginModal} onClose={onCloseLoginModal} />}
    </div>
  );
};

export default ResultView;
