import React from 'react';
import { X } from 'lucide-react';
import { signInWithGoogle, signInWithKakao, signInWithNaver } from '../lib/supabase';
import { logError } from '../utils/logger';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      logError('구글 로그인', error);
      alert('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleKakaoLogin = async () => {
    try {
      await signInWithKakao();
    } catch (error) {
      logError('카카오 로그인', error);
      alert('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleNaverLogin = async () => {
    try {
      await signInWithNaver();
    } catch (error) {
      logError('네이버 로그인', error);
      alert('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1c1b1a] border border-white/10 shadow-2xl rounded-sm p-8 max-w-md mx-4 w-full relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="mb-8">
          <h2 className="text-2xl font-serif italic text-[#ece8e1] font-bold mb-2">
            로그인
          </h2>
          <p className="text-sm text-white/50 italic">
            여행 티켓을 저장하고 관리하려면 로그인이 필요합니다
          </p>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-4">
          {/* 구글 로그인 (기본) */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-white/90 text-gray-900 font-bold rounded-sm transition-all shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>구글로 로그인</span>
          </button>

          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm transition-all shadow-lg font-bold"
            style={{
              backgroundColor: '#FEE500',
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FDD835';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE500';
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 2.625-1.84 4.89-4.533 6.146.24.49.391 1.035.391 1.589 0 .171-.016.34-.04.506l-.744 4.111-4.157-.87c-.509.069-1.03.106-1.557.106-5.799 0-10.5-3.664-10.5-8.185S6.201 3 12 3z" />
            </svg>
            <span>카카오로 로그인</span>
          </button>

          {/* 네이버 로그인 */}
          <button
            onClick={handleNaverLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm transition-all shadow-lg font-bold text-white"
            style={{
              backgroundColor: '#03C75A',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#02B350';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#03C75A';
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
            </svg>
            <span>네이버로 로그인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
