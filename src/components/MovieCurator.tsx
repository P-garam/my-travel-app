
import React from 'react';
import { Film, Search, Clapperboard } from 'lucide-react';
import { Movie } from '../types';

interface MovieCuratorProps {
  movies: Movie[];
}

const MovieCurator: React.FC<MovieCuratorProps> = ({ movies }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-8 mt-24">
      <div className="flex items-center gap-6">
        <Clapperboard size={20} className="text-[#ff8c00]" />
        <span className="text-[10px] uppercase font-black tracking-[0.8em] text-[#ff8c00] italic">Reference Film Archive</span>
        <div className="h-[1px] flex-1 bg-white/10" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie, idx) => (
          <a 
            key={idx}
            href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' movie')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden border border-white/5 hover:border-[#ff8c00]/30 transition-all bg-white/[0.02] h-full"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#ff8c00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            
            <div className="p-6 flex flex-col gap-3 h-full">
              <div className="flex justify-between items-start flex-1">
                <div className="flex-1">
                  <h4 className="text-lg font-serif italic text-[#ece8e1] group-hover:text-[#ff8c00] transition-colors font-bold leading-tight mb-2">
                    {movie.title}
                  </h4>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest block font-bold mb-3">
                    Dir. {movie.director} · {movie.year}
                  </span>
                  <p className="text-[11px] text-white/40 font-light leading-relaxed italic group-hover:text-white/60 transition-colors">
                    "{movie.reason}"
                  </p>
                </div>
                <Search size={12} className="text-white/10 group-hover:text-[#ff8c00] transition-colors ml-3 flex-shrink-0" />
              </div>
            </div>
            
            {/* Film grain overlay on hover */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default MovieCurator;
