import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Ticket, Edit3, Printer, X } from 'lucide-react';
import { TravelPlan } from '../types';
import { logError, devLog } from '../utils/logger';

interface TicketGeneratorProps {
  plan: TravelPlan;
  destination: string;
  date: string;
  duration: number;
  travelers: number;
}

const TicketGenerator: React.FC<TicketGeneratorProps> = ({ plan, destination, date, duration, travelers }) => {
  const ticketBodyRef = useRef<HTMLDivElement>(null); // 티켓 본문만 캡처
  const synopsisRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isIssued, setIsIssued] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null);
  
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

  // Auto-resize textareas with word-wrap
  useEffect(() => {
    if (synopsisRef.current) {
      synopsisRef.current.style.height = 'auto';
      synopsisRef.current.style.height = `${synopsisRef.current.scrollHeight + 10}px`;
    }
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [editableNote, editableTitle, isIssued]);

  const generateTicketImage = async (): Promise<string | null> => {
    if (!ticketBodyRef.current) return null;
    
    try {
      const canvas = await html2canvas(ticketBodyRef.current, {
        backgroundColor: '#ece8e1', // 티켓 배경색
        scale: 2, // 모바일 최적화를 위해 scale: 2
        useCORS: true,
        logging: false,
        allowTaint: false,
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      logError("Ticket generation", err);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      const imageUrl = await generateTicketImage();
      if (!imageUrl) {
        alert("티켓 저장에 실패했습니다.");
        return;
      }

      // 모바일 환경에서는 모달로 표시
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        setTicketImageUrl(imageUrl);
        setShowImageModal(true);
      } else {
        // 데스크톱에서는 바로 다운로드
        const link = document.createElement('a');
        link.download = `OnePieceOfTravel_Ticket_${destination}.png`;
        link.href = imageUrl;
        link.click();
      }
    } catch (err) {
      logError("Ticket download", err);
      alert("티켓 저장 중 문제가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);

    try {
      const imageUrl = await generateTicketImage();
      if (!imageUrl) {
        alert("티켓 공유에 실패했습니다.");
        return;
      }

      // 모바일 환경에서는 모달로 표시
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        setTicketImageUrl(imageUrl);
        setShowImageModal(true);
      } else {
        // 데스크톱에서는 공유 시도
        const canvas = await html2canvas(ticketBodyRef.current!, {
          backgroundColor: '#ece8e1',
          scale: 2,
          useCORS: true,
          logging: false,
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
              devLog('Share canceled or failed', shareError);
            }
          } else {
            const link = document.createElement('a');
            link.download = `OnePieceOfTravel_Ticket_${destination}.png`;
            link.href = imageUrl;
            link.click();
            alert("공유 기능이 지원되지 않는 환경이어서 갤러리에 저장했습니다.");
          }
        });
      }
    } catch (err) {
      logError("Sharing", err);
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
    <>
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
              {/* 티켓 헤더 (캡처 제외) */}
              <div className="bg-[#121110] text-[#ece8e1] p-5 border-b-2 border-dashed border-[#ece8e1]/20 flex flex-col items-center text-center gap-1.5 w-[290px] md:w-[310px]">
                 <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center mb-0.5">
                    <span className="text-[7px] font-bold">CQ</span>
                 </div>
                 <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ff8c00]">여행 한 편</h3>
                    <p className="text-[7px] uppercase tracking-widest text-white/40 mt-0.5">Cinematic Archive No. {Math.floor(Math.random() * 89999) + 10000}</p>
                 </div>
              </div>

              {/* 티켓 본문 (캡처 대상) */}
              <div 
                ref={ticketBodyRef}
                className="w-[290px] md:w-[310px] bg-[#ece8e1] text-[#121110] relative overflow-visible shadow-2xl rounded-sm transition-transform duration-500 hover:rotate-1"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              >
                {/* Ticket Body - Vertical Layout with improved padding */}
                <div className="p-6 space-y-5 relative">
                   {/* Noise Texture */}
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-multiply"></div>
                   
                   <div className="space-y-2 relative z-10 text-center border-b border-black/10 pb-4">
                     <span className="text-[8px] font-mono uppercase tracking-widest opacity-60">Title of the Film</span>
                     <textarea 
                       ref={titleRef}
                       value={editableTitle}
                       onChange={(e) => setEditableTitle(e.target.value)}
                       rows={1}
                       className="w-full bg-transparent border-none p-2 text-lg md:text-xl font-serif font-bold italic leading-tight focus:ring-0 focus:outline-none focus:bg-black/5 rounded text-center text-[#121110] placeholder:text-black/30 resize-none overflow-hidden block"
                       style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                     />
                   </div>

                   {/* Vertical Details Stack */}
                   <div className="flex flex-col gap-3 relative z-10">
                     <div className="flex justify-between items-end border-b border-black/5 pb-1.5">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Location</span>
                       <span className="text-xs font-bold uppercase tracking-tight text-right break-words">{destination}</span>
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

                   {/* Synopsis Area - Improved word-wrap */}
                   <div className="relative z-10 pt-2">
                      <span className="block text-[8px] font-black uppercase tracking-widest opacity-40 mb-2 text-center">Synopsis</span>
                      <textarea 
                        ref={synopsisRef}
                        value={editableNote}
                        onChange={(e) => setEditableNote(e.target.value)}
                        rows={4}
                        className="w-full bg-transparent border-none p-2 text-[10px] font-serif italic leading-relaxed resize-none focus:ring-0 focus:outline-none focus:bg-black/5 rounded text-[#121110] opacity-80 text-center overflow-hidden block"
                        style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                      />
                   </div>
                   
                   {/* Footer Info */}
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

      {/* 이미지 모달 (모바일용) */}
      {showImageModal && ticketImageUrl && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#ff8c00] transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 max-w-md mx-auto">
              <img 
                src={ticketImageUrl} 
                alt="여행 티켓" 
                className="w-full h-auto rounded"
              />
              
              <div className="mt-6 text-center space-y-4">
                <p className="text-white/80 text-sm font-light leading-relaxed">
                  이미지를 <span className="text-[#ff8c00] font-bold">길게 눌러 저장</span>하세요
                </p>
                <p className="text-white/40 text-xs">
                  (카카오톡 등 모바일 앱에서는 이미지를 길게 눌러 저장할 수 있습니다)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketGenerator;
