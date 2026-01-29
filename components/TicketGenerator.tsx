import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Ticket, Edit3, Printer } from 'lucide-react';
import { TravelPlan } from '../types';

interface TicketGeneratorProps {
  plan: TravelPlan;
  destination: string;
  date: string;
  duration: number;
  travelers: number;
}

const TicketGenerator: React.FC<TicketGeneratorProps> = ({ plan, destination, date, duration, travelers }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const synopsisRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isIssued, setIsIssued] = useState(false); // 티켓 발권 여부 상태
  
  // Editable State
  const [editableTitle, setEditableTitle] = useState(plan.personalityTitle);
  const [editableName, setEditableName] = useState("YOU");
  const [editableDate, setEditableDate] = useState(date);
  const [editableNote, setEditableNote] = useState(plan.personalityDescription);

  // Update state if plan changes
  useEffect(() => {
    setEditableTitle(plan.personalityTitle);
    setEditableNote(plan.personalityDescription);
    setEditableDate(date);
  }, [plan, date]);

  // Auto-resize textareas
  useEffect(() => {
    if (synopsisRef.current) {
      synopsisRef.current.style.height = 'auto';
      // 텍스트 잘림 방지를 위해 약간의 여유분(+10px) 추가
      synopsisRef.current.style.height = `${synopsisRef.current.scrollHeight + 10}px`;
    }
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [editableNote, editableTitle, isIssued]);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#121110',
        scale: 3, // Higher resolution for crisp text
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `OnePieceOfTravel_Ticket_${destination}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Ticket generation failed", err);
      alert("티켓 저장에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!ticketRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#121110',
        scale: 3,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `OnePieceOfTravel_Ticket.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '여행 한 편 - 나만의 티켓',
              text: `나만의 여행 시나리오: ${editableTitle}`,
            });
          } catch (shareError) {
             console.log('Share canceled or failed', shareError);
          }
        } else {
           const link = document.createElement('a');
           link.download = `OnePieceOfTravel_Ticket_${destination}.png`;
           link.href = canvas.toDataURL('image/png');
           link.click();
           alert("공유 기능이 지원되지 않는 환경이어서 갤러리에 저장했습니다.");
        }
      });
    } catch (err) {
      console.error("Sharing failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isIssued) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-32 border-t border-white/10 pt-32 pb-40 text-center space-y-8">
        <h2 className="text-4xl md:text-5xl font-serif italic text-[#ece8e1] tracking-tight">Ready for Premiere?</h2>
        <p className="text-white/40 text-sm font-light max-w-md mx-auto leading-relaxed">
          모든 시퀀스가 준비되었습니다. <br/>
          당신만의 여행, 그 첫 번째 티켓을 발권하세요.
        </p>
        <button 
          onClick={() => setIsIssued(true)}
          className="group relative inline-flex items-center gap-4 px-12 py-6 bg-[#ff8c00] text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-white transition-all shadow-[0_0_40px_-10px_rgba(255,140,0,0.5)] overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-3">
            <Printer size={18} />
            Ticket Issue
          </span>
          <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 origin-left" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-12 mt-32 border-t border-white/10 pt-24 pb-24">
       <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff8c00]/10 rounded-full border border-[#ff8c00]/20">
            <Ticket size={16} className="text-[#ff8c00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8c00]">Official Selection</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif italic text-[#ece8e1]">Your Scenario Ticket</h2>
          <p className="text-white/40 text-sm font-light">
             내용을 클릭하여 티켓의 정보를 직접 수정할 수 있습니다.
          </p>
       </div>

       {/* Ticket Visual Area - Printer Slot Effect */}
       <div className="relative group perspective-1000 flex flex-col items-center justify-start pt-4 h-auto min-h-[600px]">
          
          {/* Printer Slot Visual (Top Layer) */}
          <div className="w-[320px] md:w-[340px] h-12 bg-[#121110] absolute top-0 z-50 rounded-b-lg border-b border-x border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-end pb-3">
            <div className="w-[300px] md:w-[320px] h-1 bg-black/80 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,1)] border-b border-white/5" />
            <div className="absolute top-2.5 flex gap-1.5">
                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>
                <div className="w-1 h-1 rounded-full bg-green-500"></div>
            </div>
          </div>

          {/* Edit Hint Overlay */}
          <div className="absolute -right-16 top-32 text-white/20 animate-pulse hidden md:block">
            <Edit3 size={20} />
          </div>

          {/* Ticket Container (Behind Slot, Animated) */}
          <div className="relative z-10 pt-4 animate-print origin-top">
            <div 
              ref={ticketRef}
              className="w-[290px] md:w-[310px] bg-[#ece8e1] text-[#121110] relative overflow-hidden shadow-2xl rounded-sm transition-transform duration-500 hover:rotate-1 pb-4"
            >
              {/* Ticket Header - Compact Padding */}
              <div className="bg-[#121110] text-[#ece8e1] p-5 border-b-2 border-dashed border-[#ece8e1]/20 flex flex-col items-center text-center gap-1.5">
                 <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center mb-0.5">
                    <span className="text-[7px] font-bold">CQ</span>
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ff8c00]">여행 한 편</h3>
                    <p className="text-[7px] uppercase tracking-widest text-white/40 mt-0.5">Cinematic Archive No. {Math.floor(Math.random() * 89999) + 10000}</p>
                 </div>
              </div>

              {/* Ticket Body - Vertical Layout (More Compact) */}
              <div className="p-5 space-y-4 relative">
                 {/* Noise Texture */}
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-multiply"></div>
                 
                 <div className="space-y-1.5 relative z-10 text-center border-b border-black/10 pb-4">
                   <span className="text-[8px] font-mono uppercase tracking-widest opacity-60">Title of the Film</span>
                   <textarea 
                     ref={titleRef}
                     value={editableTitle}
                     onChange={(e) => setEditableTitle(e.target.value)}
                     rows={1}
                     className="w-full bg-transparent border-none p-0 text-xl font-serif font-bold italic leading-tight focus:ring-0 focus:outline-none focus:bg-black/5 rounded text-center text-[#121110] placeholder:text-black/30 resize-none overflow-hidden block"
                   />
                 </div>

                 {/* Vertical Details Stack - Tighter Gap */}
                 <div className="flex flex-col gap-3 relative z-10">
                   <div className="flex justify-between items-end border-b border-black/5 pb-1.5">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Location</span>
                     <span className="text-xs font-bold uppercase tracking-tight text-right">{destination}</span>
                   </div>
                   
                   <div className="flex justify-between items-end border-b border-black/5 pb-1.5">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Release Date</span>
                     <input 
                       type="text"
                       value={editableDate}
                       onChange={(e) => setEditableDate(e.target.value)}
                       className="bg-transparent border-none p-0 text-xs font-mono font-bold focus:ring-0 focus:outline-none focus:bg-black/5 rounded text-right text-[#121110] w-28"
                     />
                   </div>

                   <div className="flex justify-between items-end border-b border-black/5 pb-1.5">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Director</span>
                     <input 
                       type="text"
                       value={editableName}
                       onChange={(e) => setEditableName(e.target.value)}
                       className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 focus:outline-none focus:bg-black/5 rounded text-right uppercase text-[#121110] w-28"
                     />
                   </div>

                   <div className="flex justify-between items-end border-b border-black/5 pb-1.5">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Running Time</span>
                     <span className="text-xs font-mono font-bold text-[#121110]">{duration} Days Cut</span>
                   </div>
                   
                   <div className="flex justify-between items-end border-b border-black/5 pb-1.5">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Audience</span>
                     <span className="text-xs font-mono font-bold text-[#121110]">{travelers} Adult{travelers > 1 ? 's' : ''}</span>
                   </div>
                 </div>

                 {/* Synopsis Area - Ensure Full Visibility */}
                 <div className="relative z-10 pt-1">
                    <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-2 text-center">Synopsis</span>
                    <textarea 
                      ref={synopsisRef}
                      value={editableNote}
                      onChange={(e) => setEditableNote(e.target.value)}
                      rows={4}
                      className="w-full bg-transparent border-none p-1 text-[10px] font-serif italic leading-relaxed resize-none focus:ring-0 focus:outline-none focus:bg-black/5 rounded text-[#121110] opacity-80 text-center overflow-hidden block"
                    />
                 </div>
                 
                 {/* Footer Info (No QR, Compact Barcode) */}
                 <div className="pt-6 border-t border-black/10 flex flex-col items-center gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Vibe Score</span>
                        <span className="text-[9px] font-mono font-bold text-[#ff8c00]">{plan.vibeScore}% Match</span>
                    </div>

                    <div className="w-full h-8 flex justify-center gap-[2px] items-end opacity-80 overflow-hidden">
                          {[...Array(40)].map((_, i) => (
                             <div key={i} className="bg-black" style={{ width: Math.random() > 0.5 ? '1px' : '3px', height: `${Math.random() * 60 + 40}%` }} />
                          ))}
                    </div>
                    
                    <p className="text-[7px] uppercase tracking-[0.3em] opacity-40 font-bold">Admit One · Non-Refundable</p>
                 </div>
              </div>

              {/* Perforation Circles (Vertical) */}
              <div className="absolute top-[70px] -left-2 w-4 h-4 bg-[#121110] rounded-full"></div>
              <div className="absolute top-[70px] -right-2 w-4 h-4 bg-[#121110] rounded-full"></div>
              
              {/* Bottom zig-zag edge */}
              <div 
                className="absolute bottom-0 left-0 w-full h-1.5"
                style={{
                  background: "radial-gradient(circle, transparent 70%, #121110 70%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 5px"
                }}
              />
            </div>
          </div>
       </div>

       {/* Action Buttons */}
       <div className="flex gap-4">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-[#ff8c00] transition-colors disabled:opacity-50 shadow-xl"
          >
            <Download size={16} />
            {isGenerating ? 'Printing...' : 'Save Image'}
          </button>
          <button 
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-3 px-8 py-4 border border-white/20 text-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            <Share2 size={16} />
            Share
          </button>
       </div>
    </div>
  );
};

export default TicketGenerator;