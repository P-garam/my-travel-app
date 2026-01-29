
import React from 'react';
import { 
  Camera, 
  MapPin, 
  Coffee, 
  Utensils, 
  Ticket, 
  Music, 
  ShoppingBag, 
  TreePine, 
  Compass,
  Wine,
  Film,
  Zap,
  Info
} from 'lucide-react';
import { Place } from '../types';
import DocentPlayer from './DocentPlayer';

interface PlaceCardProps {
  place: Place;
  index: number;
}

const getIcon = (keyword: string) => {
  const k = keyword.toLowerCase();
  if (k.includes('coffee') || k.includes('cafe')) return <Coffee size={16} />;
  if (k.includes('restaurant') || k.includes('food')) return <Utensils size={16} />;
  if (k.includes('museum') || k.includes('art')) return <Ticket size={16} />;
  if (k.includes('music') || k.includes('concert')) return <Music size={16} />;
  if (k.includes('shop')) return <ShoppingBag size={16} />;
  if (k.includes('park') || k.includes('nature')) return <TreePine size={16} />;
  if (k.includes('camera') || k.includes('photo')) return <Camera size={16} />;
  if (k.includes('bar') || k.includes('night')) return <Wine size={16} />;
  return <Compass size={16} />;
};

const PlaceCard: React.FC<PlaceCardProps> = ({ place, index }) => {
  // 정확도를 위해 이름과 주소를 조합하여 검색 쿼리 생성
  const searchQuery = encodeURIComponent(`${place.name} ${place.address}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  const sceneNumber = (index + 1).toString().padStart(2, '0');

  return (
    <div className="group relative bg-[#1c1b1a] border border-white/10 hover:border-[#ff8c00]/50 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl">
      {/* Top Clapperboard Section */}
      <div className="h-10 flex items-center justify-between px-4 bg-black/80 border-b border-white/10 group-hover:bg-[#ff8c00] transition-colors duration-500">
        <div className="flex items-center gap-2">
          <Film size={14} className="text-white group-hover:text-black" />
          <span className="text-[10px] font-black tracking-widest text-white group-hover:text-black uppercase">SLATE.{sceneNumber}</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
             <span className="text-[8px] font-bold text-white/40 group-hover:text-black/60 uppercase">REC</span>
           </div>
           <Zap size={10} className="text-white/20 group-hover:text-black/40" />
        </div>
      </div>

      {/* Main Content (Scenario Style) */}
      <div className="p-6 space-y-5 flex-grow">
        {/* Scene Header */}
        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
          <span className="text-[9px] font-mono font-bold text-[#ff8c00] uppercase tracking-tighter">
            INT/EXT. {place.bestTime}
          </span>
          <div className="text-white/20 group-hover:text-[#ff8c00] transition-colors">
            {getIcon(place.imageKeyword)}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h3 className="text-xl font-serif italic font-bold text-[#ece8e1] leading-tight tracking-tight">
            {place.name}
          </h3>
          <div className="relative">
            <p className="text-[12px] text-white/40 leading-relaxed font-light italic pl-4 border-l border-[#ff8c00]/20 group-hover:text-white/70 transition-colors">
              {place.description}
            </p>
          </div>
        </div>

        {/* Real Address Display */}
        <div className="flex items-start gap-2 bg-white/[0.03] p-2 border border-white/5">
          <Info size={10} className="text-white/20 mt-1 shrink-0" />
          <span className="text-[9px] text-white/30 font-light leading-tight">
            {place.address}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="flex items-start gap-2">
            <Camera size={12} className="text-[#ff8c00] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[7px] uppercase font-black text-white/20 tracking-widest">Aesthetic Focus</span>
              <span className="text-[10px] text-white/50 leading-tight italic">{place.photoSpotTip}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Control Panel */}
      <div className="mt-auto flex border-t border-white/5 bg-black/20">
        <div className="flex-1 flex divide-x divide-white/5">
          <DocentPlayer script={place.docentScript} />
          <a 
            href={googleMapsUrl} 
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center h-12 hover:bg-[#ff8c00] text-white hover:text-black transition-all gap-2"
          >
            <MapPin size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Open in Maps</span>
          </a>
        </div>
        <div className="w-12 flex items-center justify-center border-l border-white/5">
          <span className="text-[10px] font-mono text-white/10 font-bold group-hover:text-[#ff8c00]/40 transition-colors">
            {place.estimatedCost ? `₩${(place.estimatedCost/1000).toFixed(0)}k` : 'FREE'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
