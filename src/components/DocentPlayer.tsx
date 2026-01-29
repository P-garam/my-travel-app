
import React, { useState, useEffect } from 'react';
import { Play, Pause, Headphones } from 'lucide-react';

interface DocentPlayerProps {
  script: string;
}

const DocentPlayer: React.FC<DocentPlayerProps> = ({ script }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const u = new SpeechSynthesisUtterance(script);
    u.lang = 'ko-KR';
    u.onend = () => setIsPlaying(false);
    u.rate = 0.92;
    setUtterance(u);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [script]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (utterance) {
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  return (
    <button
      onClick={togglePlay}
      className={`group flex items-center justify-center w-10 h-10 transition-all ${
        isPlaying ? 'bg-[#ece8e1] text-black scale-110' : 'bg-black text-[#ece8e1] hover:bg-[#ece8e1] hover:text-black'
      }`}
      title="Narrative Audio"
    >
      {isPlaying ? <Pause size={16} fill="currentColor" /> : <Headphones size={16} />}
    </button>
  );
};

export default DocentPlayer;
