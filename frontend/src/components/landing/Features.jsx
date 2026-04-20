import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert, FileSearch, Zap,
  Lock, Scale, MessageSquare, Sparkles,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Risk Detection',
    desc:  'Instantly identify hidden liabilities and dangerous clauses before you sign.',
    Icon:  ShieldAlert,
    num:   '01',
  },
  {
    title: 'Legalese Decoder',
    desc:  'Translate complex legal jargon into plain, actionable English.',
    Icon:  Scale,
    num:   '02',
  },
  {
    title: 'Smart Summarization',
    desc:  'Get an executive summary of 50+ page documents in just 10 seconds.',
    Icon:  FileSearch,
    num:   '03',
  },
  {
    title: 'Interactive Analysis',
    desc:  'Chat directly with your documents about obligations, deadlines, or key dates.',
    Icon:  MessageSquare,
    num:   '04',
  },
  {
    title: 'Forensic Precision',
    desc:  'Powered by Gemini AI, specifically tuned for structural legal document analysis.',
    Icon:  Zap,
    num:   '05',
  },
  {
    title: 'Enterprise Security',
    desc:  'AES-256 protected and fully masked before analysis — total, verifiable privacy.',
    Icon:  Lock,
    num:   '06',
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */
export default function Features() {
  const wrapperRef = useRef(null);
  const trackRef   = useRef(null);
  
  // Progress states for different phases
  const [progress, setProgress] = useState({ 
    entry: 0,   // 0 to 1 when entering viewport
    scroll: 0,  // 0 to 1 during the sticky horizontal scroll
    exit: 0     // 0 to 1 when leaving viewport
  });
  
  const [maxScroll, setMaxScroll] = useState(0);

  // --- Measurement Logic ---
  useEffect(() => {
    const updateDimensions = () => {
      if (trackRef.current) {
        const trackWidth = trackRef.current.scrollWidth;
        const viewWidth = window.innerWidth;
        // Padding adjustment: we want to scroll the track until the last card is visible
        setMaxScroll(Math.max(0, trackWidth - viewWidth + 120));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    // Extra check after potential font loads
    const timer = setTimeout(updateDimensions, 500);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  // --- Native Scroll Engine with LERP ---
  useEffect(() => {
    let target = { entry: 0, scroll: 0, exit: 0 };
    let current = { entry: 0, scroll: 0, exit: 0 };
    let frameId;

    const handleScroll = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalHeight = rect.height;

      // 1. Entry: starts when top is at bottom of viewport, ends when top is at 0
      const entryProgress = 1 - (rect.top / windowHeight);
      target.entry = Math.max(0, Math.min(1, entryProgress));

      // 2. Scroll: progress during the sticky phase (rect.top is <= 0)
      const scrollRange = totalHeight - windowHeight;
      const scrollProgress = scrollRange > 0 ? (-rect.top / scrollRange) : 0;
      target.scroll = Math.max(0, Math.min(1, scrollProgress));

      // 3. Exit: starts when bottom is at windowHeight, ends when bottom is at 0
      const exitProgress = (windowHeight - rect.bottom) / windowHeight;
      target.exit = Math.max(0, Math.min(1, exitProgress));
    };

    const loop = () => {
      const lerp = 0.1; // Smoothness factor
      current.entry += (target.entry - current.entry) * lerp;
      current.scroll += (target.scroll - current.scroll) * lerp;
      current.exit += (target.exit - current.exit) * lerp;

      const hasChanged = 
        Math.abs(target.entry - current.entry) > 0.001 ||
        Math.abs(target.scroll - current.scroll) > 0.001 ||
        Math.abs(target.exit - current.exit) > 0.001;

      if (hasChanged) {
        setProgress({ 
          entry: current.entry, 
          scroll: current.scroll, 
          exit: current.exit 
        });
      }
      frameId = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    loop();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Helper for sub-animations
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const normalize = (val, start, end) => clamp((val - start) / (end - start));

  // --- Dynamic Styles ---
  const activeDotIndex = Math.min(FEATURES.length - 1, Math.floor(progress.scroll * FEATURES.length));
  
  // Background 3D Entity Transforms
  const entityScale = 0.8 + (progress.entry * 0.2) + (progress.scroll * 0.1) - (progress.exit * 0.5);
  const entityRotateY = -45 + (progress.scroll * 90);
  const entityOpacity = clamp(progress.entry * 2) - (progress.exit * 1.5);

  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full bg-[#020205] h-[500vh] overflow-visible"
    >
      {/* ── STICKY VIEWPORT ── */}
      <section 
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center"
        style={{ perspective: '1200px' }}
      >
        
        {/* ── BACKGROUND LAYER ── */}
        <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
          
          {/* Film Grain Texture */}
          <div
            className="absolute inset-0 z-10 mix-blend-screen opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Holographic Floor Grid */}
          <div className="absolute inset-0 z-0" style={{ perspective: '1000px' }}>
            <div
              className="absolute inset-0 origin-bottom opacity-20 transition-opacity duration-700"
              style={{
                backgroundImage: 
                  'linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)',
                backgroundSize: '70px 70px',
                backgroundPosition: `0px ${progress.scroll * 300}px`,
                transform: 'rotateX(70deg) translateZ(-150px) scale(3)',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
                opacity: entityOpacity * 0.2
              }}
            />
          </div>

          {/* 3D Focal Entity */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="absolute rounded-full opacity-30 blur-[120px] transition-all duration-700"
              style={{
                width: '60vw', height: '60vw',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                transform: `scale(${entityScale * 1.2})`,
                opacity: entityOpacity * 0.3
              }}
            />
            
            <div 
              className="relative flex items-center justify-center will-change-transform transition-opacity duration-500"
              style={{ 
                width: 500, height: 500,
                transformStyle: 'preserve-3d',
                transform: `translateY(15%) rotateY(${entityRotateY}deg) scale(${entityScale})`,
                opacity: entityOpacity
              }}
            >
              <Scale size={450} strokeWidth={0.5} className="absolute text-indigo-500/20 blur-2xl" />
              <Scale size={450} strokeWidth={1} className="absolute text-indigo-400/10" style={{ transform: 'translateZ(-40px)' }} />
              <Scale size={450} strokeWidth={0.5} className="absolute text-emerald-400/30" style={{ transform: 'translateZ(40px)' }} />
            </div>
          </div>
        </div>

        {/* ── TOP PROGRESS BAR ── */}
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left bg-gradient-to-r from-indigo-500 to-emerald-400 pointer-events-none"
             style={{ transform: `scaleX(${progress.scroll})` }} />

        {/* ── HEADER CONTENT ── */}
        <div 
          className="relative z-20 px-8 md:px-16 lg:px-24 mb-12 will-change-transform"
          style={{ 
            opacity: clamp(progress.entry * 2 - progress.exit * 2),
            transform: `translateY(${(1 - progress.entry) * 40}px)`
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold tracking-[0.2em] uppercase">
            <Sparkles size={12} />
            Forensic Workflows
          </div>

          <h2 
            className="font-bold text-white leading-[1.1] tracking-tighter"
            style={{ fontSize: 'clamp(36px, 6vw, 76px)', maxWidth: 850 }}
          >
            {['Designed', 'for', 'Legal'].map((w, i) => (
              <span key={i} className="inline-block mr-[0.25em]">{w}</span>
            ))}
            <span className="inline-block bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Clarity.
            </span>
          </h2>

          <p className="mt-6 text-slate-400 text-sm md:text-base max-w-md leading-relaxed">
            Precision auditing meets forensic intelligence. Identify risks, 
            decode complexity, and summarize with atomic accuracy.
          </p>
        </div>

        {/* ── CARD TRACK ── */}
        <div className="relative z-20 w-full overflow-visible">
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{
              gap: '24px',
              paddingLeft: 'clamp(32px, 8vw, 96px)',
              paddingRight: '10vw',
              width: 'max-content',
              transform: `translateX(${-progress.scroll * maxScroll}px)`,
            }}
          >
            {FEATURES.map((f, i) => {
              // Individual card entry animation logic
              const cardOffset = i * (1 / (FEATURES.length - 1));
              const cardEntry = normalize(progress.scroll, cardOffset - 0.2, cardOffset);
              const cardOpacity = i === 0 ? progress.entry : cardEntry;

              return (
                <div
                  key={i}
                  className="group shrink-0 relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-indigo-500/40"
                  style={{
                    width: 'clamp(280px, 22vw, 360px)',
                    height: 'clamp(320px, 40vh, 420px)',
                    padding: 'clamp(28px, 3.5vw, 40px)',
                    background: 'rgba(8, 8, 14, 0.75)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    opacity: clamp(cardOpacity - progress.exit * 2),
                    transform: `translateY(${(1 - cardOpacity) * 60}px) scale(${0.9 + cardOpacity * 0.1})`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Subtle inner hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 70%)' }} 
                  />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 transition-transform group-hover:scale-110 duration-500">
                      <f.Icon size={24} strokeWidth={1.5} />
                    </div>
                    
                    <h3 className="text-white text-lg md:text-xl font-bold mb-4 tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                      {f.desc}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-end justify-between">
                    <div className="w-2 h-2 rounded-full bg-indigo-500/40" />
                    <span className="font-serif italic font-bold text-6xl text-white/[0.03] select-none leading-none group-hover:text-indigo-500/[0.07] transition-colors duration-500">
                      {f.num}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER OVERLAY ── */}
        <div 
          className="relative z-20 flex flex-col items-center mt-12 gap-6 transition-opacity duration-500"
          style={{ opacity: clamp(progress.entry * 2 - progress.exit * 2) }}
        >
          <div className="flex items-center gap-2">
            {FEATURES.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-slate-800 transition-all duration-300"
                style={{ 
                  width: i === activeDotIndex ? 24 : 6, 
                  background: i === activeDotIndex ? '#818cf8' : '#1e293b',
                  opacity: i === activeDotIndex ? 1 : 0.4 
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-slate-800" />
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Scroll to discover
            </span>
            <div className="w-12 h-px bg-slate-800" />
          </div>
        </div>

      </section>
    </div>
  );
}