import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { getCurrentUser, signOut } from '../lib/supabase';
import { getTripById, type SavedTrip } from '../services/tripService';
import ResultView from '../components/ResultView';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setError('잘못된 경로입니다.');
        setLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;
        if (!currentUser) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }
        setUser(currentUser);
        const data = await getTripById(id, currentUser.id);
        if (cancelled) return;
        if (!data) {
          setError('저장된 여행을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        if (!data.content) {
          setError('이전 형식으로 저장된 여행입니다. 목록에서만 확인할 수 있습니다.');
          setLoading(false);
          return;
        }
        setTrip(data);
      } catch (e) {
        if (!cancelled) {
          setError('불러오는 중 문제가 발생했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121110] flex flex-col items-center justify-center p-8">
        <Clapperboard className="w-16 h-16 text-[#ff8c00] animate-pulse" strokeWidth={1} />
        <p className="mt-6 text-white/60 italic">불러오는 중...</p>
      </div>
    );
  }

  if (error || !trip?.content) {
    return (
      <div className="min-h-screen bg-[#121110] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white/80 mb-6">{error || '데이터를 불러올 수 없습니다.'}</p>
        <button
          onClick={() => navigate('/archive')}
          className="px-6 py-3 bg-[#ff8c00] hover:bg-[#ff9d1a] text-black font-black uppercase tracking-widest text-sm"
        >
          보관함으로
        </button>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <ResultView
      plan={trip.content.plan}
      profile={trip.content.profile}
      user={user}
      showSaveButton={false}
      backLink={{ label: '보관함', to: '/archive' }}
      onGoForm={() => navigate('/')}
      onSignOut={handleSignOut}
    />
  );
};

export default TripDetailPage;
