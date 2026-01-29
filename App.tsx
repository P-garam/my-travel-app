
import React, { useState } from 'react';
import { 
  Plus, 
  Map as MapIcon,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  Film,
  LayoutGrid,
  ExternalLink,
  Calendar,
  Clapperboard,
  Sparkles,
  Users
} from 'lucide-react';
import { UserProfile, TravelPlan, DayItinerary } from './types';
import { generateTravelPlan } from './services/geminiService';
import PlaceCard from './components/PlaceCard';
import BudgetChart from './components/BudgetChart';
import SoundtrackPlaylist from './components/SoundtrackPlaylist';
import MovieCurator from './components/MovieCurator';
import TicketGenerator from './components/TicketGenerator';

const App: React.FC = () => {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    try {
      const generatedPlan = await generateTravelPlan(profile);
      setPlan(generatedPlan);
      setStep('result');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      alert("시나리오를 구성하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setStep('form');
    }
  };

  const getGoogleMapsRouteUrl = (dayPlan: DayItinerary) => {
    const waypoints = dayPlan.places.map(p => `${p.lat},${p.lng}`).join('|');
    const origin = `${dayPlan.places[0].lat},${dayPlan.places[0].lng}`;
    const destination = `${dayPlan.places[dayPlan.places.length - 1].lat},${dayPlan.places[dayPlan.places.length - 1].lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
  };

  const addHobby = () => {
    if (newHobby && !profile.hobbies.includes(newHobby)) {
      setProfile(prev => ({ ...prev, hobbies: [...prev.hobbies, newHobby] }));
      setNewHobby('');
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
      <div className="min-h-screen bg-[#121110]">
        <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-12 py-6 z-50 bg-[#121110]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-grotesk font-bold text-[9px] tracking-widest text-white uppercase italic">ARCHIVE_ID.{Math.floor(Math.random() * 99999)}</span>
          </div>
          <button 
            onClick={() => { setStep('form'); window.scrollTo(0,0); }}
            className="text-white border border-white/10 px-5 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[#ff8c00] hover:text-black hover:border-transparent transition-all"
          >
            시나리오 다시 쓰기
          </button>
        </nav>

        <header className="relative pt-44 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
          <div className="brutalist-line mb-16 opacity-10" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-end">
            <div className="lg:col-span-8 space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                 <Film size={12} className="text-[#ff8c00]" />
                 <span className="text-[9px] uppercase font-black tracking-[0.5em] text-white/60 italic">Director's Final Cut</span>
              </div>
              <h1 className="text-hero font-serif italic font-semibold text-[#ece8e1] tracking-tighter leading-[1.0]">
                {plan.personalityTitle}
              </h1>
              <p className="text-xl md:text-2xl text-white/40 font-light leading-relaxed italic max-w-3xl border-l-2 border-[#ff8c00]/30 pl-12">
                {plan.personalityDescription}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col items-end gap-12">
              <div className="text-right group">
                <span className="block text-[9px] uppercase font-black tracking-[0.5em] text-white/20 mb-3 italic">Vibe Match Rating</span>
                <span className="text-7xl font-serif italic text-white group-hover:text-[#ff8c00] transition-colors">{plan.vibeScore}%</span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase font-black tracking-[0.5em] text-white/20 mb-3 italic">Production Budget</span>
                <span className="text-5xl font-serif italic text-[#ff8c00]">₩{plan.totalEstimatedBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="brutalist-line mt-24 opacity-10" />
        </header>

        <main className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto space-y-56 pb-60">
          {/* Notes & Analytics Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            <div className="lg:col-span-7 space-y-20">
              <div className="flex items-center gap-6">
                <span className="text-[10px] uppercase font-black tracking-[0.8em] text-[#ff8c00] italic">Set Etiquette</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
                {plan.localEtiquette.map((tip, i) => (
                  <div key={i} className="flex flex-col gap-4 group">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-mono font-bold text-[#ff8c00] opacity-40">0{i+1}</span>
                       <div className="h-[1px] w-4 bg-white/10 group-hover:w-full transition-all" />
                    </div>
                    <p className="text-[14px] text-white/50 leading-relaxed italic font-light group-hover:text-white transition-colors duration-500">{tip}</p>
                  </div>
                ))}
              </div>
              
              {/* Reference Movies Added Here */}
              {plan.movies && plan.movies.length > 0 && (
                <MovieCurator movies={plan.movies} />
              )}
            </div>
            
            <div className="lg:col-span-5 flex flex-col gap-10">
               <div className="p-12 bg-white/[0.02] border border-white/10 relative shadow-2xl">
                  <div className="mb-12 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Sparkles size={14} className="text-[#ff8c00]" />
                      <span className="text-[10px] uppercase font-black tracking-[0.5em] italic text-white/40">Cost Breakdown</span>
                    </div>
                    <LayoutGrid size={14} className="text-white/10" />
                  </div>
                  <BudgetChart plan={plan} />
               </div>
            </div>
          </section>

          {/* Itinerary Sections */}
          {plan.itinerary.map((dayPlan) => (
            <section key={dayPlan.day} className="space-y-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-12 gap-10">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] uppercase tracking-[1em] font-black text-[#ff8c00] opacity-60 italic">EPISODE SEQUENCE</span>
                  {/* FONT SIZE REDUCED HERE */}
                  <h2 className="text-5xl md:text-7xl font-serif italic font-black text-[#ece8e1] leading-none tracking-tighter">EP. 0{dayPlan.day}</h2>
                </div>
                <div className="flex flex-col items-end gap-6">
                  <a 
                    href={getGoogleMapsRouteUrl(dayPlan)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 px-10 py-4 bg-white/5 hover:bg-[#ff8c00] hover:text-black border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all group shadow-xl"
                  >
                    <MapIcon size={16} className="group-hover:text-black" />
                    전체 촬영 경로
                    <ExternalLink size={14} className="opacity-40" />
                  </a>
                </div>
              </div>
              
              {/* Responsive Grid for Place Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {dayPlan.places.map((place, idx) => (
                  <PlaceCard key={idx} index={idx} place={place} />
                ))}
              </div>
            </section>
          ))}

          {/* Soundtrack Section */}
          {plan.soundtrack && plan.soundtrack.length > 0 && (
             <SoundtrackPlaylist songs={plan.soundtrack} />
          )}

          {/* Ticket Generator Section - Added at the bottom */}
          <TicketGenerator plan={plan} destination={profile.destination} date={profile.travelDate} duration={profile.duration} travelers={profile.travelers} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121110] selection:bg-[#ff8c00] selection:text-black">
      <header className="px-6 md:px-12 py-12 flex justify-between items-center border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4 group cursor-pointer">
          <Clapperboard size={28} className="text-[#ff8c00] group-hover:rotate-12 transition-transform" strokeWidth={1.5} />
          <span className="font-serif font-bold text-xl tracking-tight text-white italic">여행 한 편</span>
        </div>
        <div className="hidden md:flex gap-16">
          {['Production', 'Archive', 'Manual'].map(item => (
            <span key={item} className="text-[11px] uppercase font-black tracking-[0.5em] text-white/20 hover:text-white cursor-pointer transition-colors italic">{item}</span>
          ))}
        </div>
        <Menu size={24} className="md:hidden text-white/30" />
      </header>

      {/* Reduced top padding from pt-40 to pt-24 */}
      <main className="pt-24 pb-64 px-6 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-48 space-y-16">
            <div className="inline-flex items-center gap-4 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
               <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
               <span className="text-[10px] uppercase font-black tracking-[0.4em] text-white/50 italic">Casting in Progress</span>
            </div>
            <h1 className="text-hero font-serif italic font-semibold text-[#ece8e1] tracking-tighter">
              세상은 무대, <br /> 여행은 <span className="text-[#ff8c00] italic underline decoration-1 underline-offset-[12px] decoration-white/10">시네마토그래피.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/20 font-light max-w-2xl italic leading-relaxed border-l-4 border-[#ff8c00]/30 pl-16">
              당신이 주인공인 가장 아름다운 시퀀스를 현상합니다. <br />
              누구도 흉내 낼 수 없는 당신만의 취향이 담긴 <br />
              세상에 단 하나뿐인 시나리오를 만나보세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-32">
            <div className="lg:col-span-7 space-y-40">
              <div className="space-y-8">
                <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">01. 촬영지 선택 (Destination)</label>
                <input 
                  type="text" 
                  value={profile.destination}
                  onChange={e => setProfile({...profile, destination: e.target.value})}
                  className="w-full bg-transparent border-b-2 border-white/10 py-6 text-3xl md:text-6xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1] placeholder:text-white/5"
                  placeholder="Paris, Tokyo, ..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="space-y-8">
                  <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">02. 상영 시작일</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={profile.travelDate}
                      onChange={e => setProfile({...profile, travelDate: e.target.value})}
                      className="w-full bg-transparent border-b-2 border-white/10 py-6 text-2xl md:text-4xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1]"
                      required
                    />
                    <Calendar size={24} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" />
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
                         className="w-full bg-transparent border-b-2 border-white/10 py-6 text-3xl md:text-5xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1]"
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
                         className="w-full bg-transparent border-b-2 border-white/10 py-6 text-3xl md:text-5xl font-serif italic outline-none focus:border-[#ff8c00] transition-all text-[#ece8e1]"
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
                      className="px-10 py-5 border border-white/10 text-[11px] uppercase font-black tracking-[0.4em] hover:border-[#ff8c00] hover:text-[#ff8c00] transition-all italic flex items-center gap-5 bg-white/[0.03] shadow-lg"
                    >
                      {hobby} <span className="opacity-40">×</span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newHobby}
                    onChange={e => setNewHobby(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHobby())}
                    className="w-full bg-white/[0.04] border border-white/10 py-10 px-12 outline-none text-[12px] font-black uppercase tracking-[0.5em] focus:bg-white/[0.08] focus:border-[#ff8c00]/40 transition-all text-white placeholder:text-white/10 shadow-inner"
                    placeholder="취미나 선호 키워드 추가"
                  />
                  <button type="button" onClick={addHobby} className="absolute right-10 top-1/2 -translate-y-1/2 p-3 group">
                    <Plus size={28} className="text-white/20 group-hover:text-[#ff8c00] transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-32 lg:border-l lg:border-white/5 lg:pl-32">
               <div className="space-y-16">
                 <div className="flex justify-between items-baseline">
                   <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">06. 캐스팅 연령</label>
                   <span className="text-6xl font-serif italic text-[#ece8e1]">{profile.age}</span>
                 </div>
                 <input 
                    type="range" min="0" max="100" 
                    value={profile.age}
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                    className="w-full cursor-pointer"
                  />
               </div>

               <div className="space-y-12">
                  <label className="text-[11px] uppercase tracking-[1em] font-black text-white/20 italic">07. 조명 톤 (활동 시간)</label>
                  <div className="grid grid-cols-1 gap-6">
                    <button
                      type="button"
                      onClick={() => setProfile({...profile, activityTime: 'early-bird'})}
                      className={`flex items-center justify-between px-12 py-14 border transition-all duration-700 shadow-xl ${
                        profile.activityTime === 'early-bird' ? 'border-[#ff8c00] bg-[#ff8c00] text-black scale-[1.02]' : 'border-white/5 text-white/30 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-10">
                        <Sun size={32} strokeWidth={1} />
                        <span className="text-[12px] uppercase font-black tracking-[0.5em] italic">얼리버드 (Morning)</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({...profile, activityTime: 'night-owl'})}
                      className={`flex items-center justify-between px-12 py-14 border transition-all duration-700 shadow-xl ${
                        profile.activityTime === 'night-owl' ? 'border-[#ff8c00] bg-[#ff8c00] text-black scale-[1.02]' : 'border-white/5 text-white/30 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-10">
                        <Moon size={32} strokeWidth={1} />
                        <span className="text-[12px] uppercase font-black tracking-[0.5em] italic">나이트아울 (Night)</span>
                      </div>
                    </button>
                  </div>
               </div>

               <div className="pt-16">
                 <button 
                    type="submit"
                    className="w-full py-14 bg-white text-black font-black uppercase tracking-[0.8em] text-[15px] hover:bg-[#ff8c00] transition-all flex items-center justify-center gap-8 shadow-[0_20px_60px_-15px_rgba(255,140,0,0.3)] active:scale-[0.98]"
                  >
                    시나리오 현상 <ArrowRight size={28} />
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
    </div>
  );
};

export default App;
