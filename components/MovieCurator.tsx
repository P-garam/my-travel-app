
import React from 'react';
import { Film, Search, Clapperboard } from 'lucide-react';
import { Movie } from '../types';

interface MovieCuratorProps {
  movies: Movie[];
}

const MovieCurator: React.FC<MovieCuratorProps> = ({ movies }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-8 mt-16">
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <Clapperboard size={20} className="text-[#ff8c00]" />
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 italic">Reference Film Archive</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {movies.map((movie, idx) => (
          <a 
            key={idx}
            href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' movie')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden border border-white/5 hover:border-[#ff8c00]/30 transition-all bg-white/[0.02]"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#ff8c00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            
            <div className="p-6 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-serif italic text-[#ece8e1] group-hover:text-[#ff8c00] transition-colors font-bold">
                    {movie.title}
                  </h4>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1 block font-bold">
                    Dir. {movie.director} · {movie.year}
                  </span>
                </div>
                <Search size={14} className="text-white/10 group-hover:text-[#ff8c00] transition-colors" />
              </div>
              
              <p className="text-[12px] text-white/40 font-light leading-relaxed italic group-hover:text-white/60 transition-colors">
                "{movie.reason}"
              </p>
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
