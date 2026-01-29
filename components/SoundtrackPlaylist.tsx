
import React from 'react';
import { Disc, Music2, ExternalLink } from 'lucide-react';
import { Song } from '../types';

interface SoundtrackPlaylistProps {
  songs: Song[];
}

const SoundtrackPlaylist: React.FC<SoundtrackPlaylistProps> = ({ songs }) => {
  return (
    <div className="w-full bg-[#1c1b1a] border border-white/10 p-8 md:p-12 relative overflow-hidden group shadow-2xl mt-24">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff8c00] rounded-full blur-[100px] opacity-5 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/5 rounded-full border border-white/10 animate-[spin_10s_linear_infinite] shadow-lg shadow-[#ff8c00]/10">
               <Disc size={32} className="text-[#ff8c00]" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-serif italic text-[#ece8e1] font-bold tracking-tight">Original Motion Picture Soundtrack</h3>
              <p className="text-[11px] text-white/40 uppercase tracking-[0.4em] mt-2 font-black">Curated by Gemini Director</p>
            </div>
          </div>
          <Music2 size={24} className="text-white/10 hidden md:block" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {songs.map((song, idx) => {
            const query = encodeURIComponent(`${song.artist} ${song.title}`);
            const spotifyUrl = `https://open.spotify.com/search/${query}`;
            const appleMusicUrl = `https://music.apple.com/kr/search?term=${query}`;
            const melonUrl = `https://www.melon.com/search/total/index.htm?q=${query}`;

            return (
              <div 
                key={idx}
                className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-[#ff8c00]/30 transition-all rounded-sm group/item"
              >
                <div className="flex items-center gap-6 flex-1">
                  <span className="text-[12px] font-mono font-bold text-[#ff8c00] opacity-50 group-hover/item:opacity-100 min-w-[20px]">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xl text-[#ece8e1] font-serif italic leading-none group-hover/item:text-[#ff8c00] transition-colors">
                      {song.title}
                    </h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 w-full md:w-auto">
                  <p className="text-[13px] text-white/30 font-light italic leading-relaxed md:max-w-xs md:text-right line-clamp-2 md:line-clamp-none">
                    "{song.reason}"
                  </p>
                  
                  <div className="flex items-center gap-2 shrink-0">
                     <a href={appleMusicUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-white/10 hover:bg-white hover:text-black hover:border-white text-[9px] uppercase tracking-wider font-bold text-white/60 transition-all rounded-sm flex items-center gap-1.5">
                       Apple<ExternalLink size={8}/>
                     </a>
                     <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-white/10 hover:bg-[#1DB954] hover:text-black hover:border-[#1DB954] text-[9px] uppercase tracking-wider font-bold text-white/60 transition-all rounded-sm flex items-center gap-1.5">
                       Spotify<ExternalLink size={8}/>
                     </a>
                     <a href={melonUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-white/10 hover:bg-[#00CD3C] hover:text-black hover:border-[#00CD3C] text-[9px] uppercase tracking-wider font-bold text-white/60 transition-all rounded-sm flex items-center gap-1.5">
                       Melon<ExternalLink size={8}/>
                     </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SoundtrackPlaylist;
