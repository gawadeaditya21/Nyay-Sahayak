import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert, FileSearch, Zap,
  Lock, Scale, MessageSquare, Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ─── Data ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Risk Detection',
    desc: 'Instantly identify hidden liabilities and dangerous clauses before you sign.',
    Icon: ShieldAlert,
    num: '01',
    accent: 'rgba(239,68,68,0.8)',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.2)',
  },
  {
    title: 'Legalese Decoder',
    desc: 'Translate complex legal jargon into plain, actionable English.',
    Icon: Scale,
    num: '02',
    accent: 'rgba(99,102,241,0.9)',
    accentBg: 'rgba(99,102,241,0.08)',
    accentBorder: 'rgba(99,102,241,0.2)',
  },
  {
    title: 'Smart Summarization',
    desc: 'Get an executive summary of 50+ page documents in just 10 seconds.',
    Icon: FileSearch,
    num: '03',
    accent: 'rgba(168,85,247,0.9)',
    accentBg: 'rgba(168,85,247,0.08)',
    accentBorder: 'rgba(168,85,247,0.2)',
  },
  {
    title: 'Interactive Analysis',
    desc: 'Chat directly with your documents about obligations, deadlines, or key dates.',
    Icon: MessageSquare,
    num: '04',
    accent: 'rgba(34,211,238,0.9)',
    accentBg: 'rgba(34,211,238,0.08)',
    accentBorder: 'rgba(34,211,238,0.2)',
  },
  {
    title: 'Forensic Precision',
    desc: 'Powered by Gemini AI, specifically tuned for structural legal document analysis.',
    Icon: Zap,
    num: '05',
    accent: 'rgba(251,191,36,0.9)',
    accentBg: 'rgba(251,191,36,0.07)',
    accentBorder: 'rgba(251,191,36,0.2)',
  },
  {
    title: 'Enterprise Security',
    desc: 'AES-256 protected and fully masked before analysis — total, verifiable privacy.',
    Icon: Lock,
    num: '06',
    accent: 'rgba(52,211,153,0.9)',
    accentBg: 'rgba(52,211,153,0.08)',
    accentBorder: 'rgba(52,211,153,0.2)',
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────── */
const clamp = (v) => Math.max(0, Math.min(1, v));
const norm  = (val, start, end) => clamp((val - start) / (end - start));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ─── Component ─────────────────────────────────────────────────────── */
export default function Features() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const trackRef   = useRef(null);
  const rafRef     = useRef(null);

  /* Use refs for LERP values — avoids stale-closure bug */
  const targetRef  = useRef({ entry: 0, scroll: 0, exit: 0 });
  const currentRef = useRef({ entry: 0, scroll: 0, exit: 0 });

  const [progress,    setProgress]    = useState({ entry: 0, scroll: 0, exit: 0 });
  const [maxScroll,   setMaxScroll]   = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [cardTilts,   setCardTilts]   = useState({});

  const FEATURES = [
    { title: t("landing.features.riskDetectionTitle"), desc: t("landing.features.riskDetectionDesc"), Icon: ShieldAlert, num: '01', accent: 'rgba(239,68,68,0.8)', accentBg: 'rgba(239,68,68,0.08)', accentBorder: 'rgba(239,68,68,0.2)' },
    { title: t("landing.features.legaleseDecoderTitle"), desc: t("landing.features.legaleseDecoderDesc"), Icon: Scale, num: '02', accent: 'rgba(99,102,241,0.9)', accentBg: 'rgba(99,102,241,0.08)', accentBorder: 'rgba(99,102,241,0.2)' },
    { title: t("landing.features.smartSummarizationTitle"), desc: t("landing.features.smartSummarizationDesc"), Icon: FileSearch, num: '03', accent: 'rgba(168,85,247,0.9)', accentBg: 'rgba(168,85,247,0.08)', accentBorder: 'rgba(168,85,247,0.2)' },
    { title: t("landing.features.interactiveAnalysisTitle"), desc: t("landing.features.interactiveAnalysisDesc"), Icon: MessageSquare, num: '04', accent: 'rgba(34,211,238,0.9)', accentBg: 'rgba(34,211,238,0.08)', accentBorder: 'rgba(34,211,238,0.2)' },
    { title: t("landing.features.forensicPrecisionTitle"), desc: t("landing.features.forensicPrecisionDesc"), Icon: Zap, num: '05', accent: 'rgba(251,191,36,0.9)', accentBg: 'rgba(251,191,36,0.07)', accentBorder: 'rgba(251,191,36,0.2)' },
    { title: t("landing.features.enterpriseSecurityTitle"), desc: t("landing.features.enterpriseSecurityDesc"), Icon: Lock, num: '06', accent: 'rgba(52,211,153,0.9)', accentBg: 'rgba(52,211,153,0.08)', accentBorder: 'rgba(52,211,153,0.2)' },
  ];

  /* ── Measure track width ── */
  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const trackW = trackRef.current.scrollWidth;
      const vw     = window.innerWidth;
      /* paddingRight from track = clamp(32px, 10vw, 120px) */
      const paddingRight = Math.min(120, Math.max(32, vw * 0.1));
      setMaxScroll(Math.max(0, trackW - vw + paddingRight));
    };
    measure();
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 400);
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, []);

  /* ── Scroll → LERP engine ── */
  useEffect(() => {
    const onScroll = () => {
      if (!wrapperRef.current) return;
      const rect  = wrapperRef.current.getBoundingClientRect();
      const wh    = window.innerHeight;
      const totalH = rect.height;

      /* Entry  : top edge crosses viewport bottom → top */
      targetRef.current.entry = clamp(1 - rect.top / wh);

      /* Scroll : sticky phase — top is ≤ 0 */
      const scrollRange = totalH - wh;
      targetRef.current.scroll = scrollRange > 0 ? clamp(-rect.top / scrollRange) : 0;

      /* Exit   : bottom edge crosses viewport */
      targetRef.current.exit = clamp((wh - rect.bottom) / wh);
    };

    const LERP_K = 0.075; /* lower = smoother / more lag */

    const loop = () => {
      const t = targetRef.current;
      const c = currentRef.current;

      c.entry  = lerp(c.entry,  t.entry,  LERP_K);
      c.scroll = lerp(c.scroll, t.scroll, LERP_K);
      c.exit   = lerp(c.exit,   t.exit,   LERP_K);

      setProgress({ entry: c.entry, scroll: c.scroll, exit: c.exit });
      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── 3-D card tilt ── */
  const handleMouseMove = (e, i) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5; /* –0.5 … +0.5 */
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    setCardTilts(prev => ({ ...prev, [i]: { x, y } }));
  };
  const handleMouseLeave = (i) => {
    setCardTilts(prev => ({ ...prev, [i]: { x: 0, y: 0 } }));
    setHoveredCard(null);
  };

  /* ── Derived animation values ── */
  const globalOpacity = clamp(progress.entry * 3) * clamp(1 - progress.exit * 4);

  const entityRotateY = -35 + progress.scroll * 70;
  const entityScale   = 0.75 + progress.entry * 0.25 - progress.exit * 0.35;
  const entityOpacity = clamp(progress.entry * 2) * clamp(1 - progress.exit * 2);

  const activeDotIndex = Math.min(
    FEATURES.length - 1,
    Math.floor(progress.scroll * FEATURES.length),
  );

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-[#020205]"
      style={{ height: '500vh' }}
    >
      {/*
       * ── STICKY VIEWPORT ──
       * CRITICAL: NO overflow-hidden here.
       * Removing it is the fix that makes cards visible as they translate.
       * The background effects are self-contained in their own overflow-hidden div.
       */}
      <section
        className="sticky top-0 h-screen w-full flex flex-col justify-center"
        style={{ perspective: '1200px' }}
      >

        {/* ── BACKGROUND (self-contained overflow) ── */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none z-0"
          aria-hidden="true"
        >
          {/* Film grain */}
          <div
            className="absolute inset-0 z-10 mix-blend-screen"
            style={{
              opacity: 0.035,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Subtle radial vignette */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, rgba(2,2,5,0.7) 100%)',
            }}
          />

          {/* Animated grid floor */}
          <div className="absolute inset-0 z-0" style={{ perspective: '1000px' }}>
            <div
              className="absolute inset-0 origin-bottom"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                backgroundPosition: `0px ${progress.scroll * 280}px`,
                transform: 'rotateX(72deg) translateZ(-180px) scale(3.5)',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 65%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 65%)',
                opacity: entityOpacity * 0.25,
              }}
            />
          </div>

          {/* Ambient glow blob */}
          <div
            className="absolute rounded-full blur-[140px]"
            style={{
              width: '55vw', height: '55vw',
              left: '50%', top: '50%',
              transform: `translate(-50%, -50%) scale(${entityScale * 1.1})`,
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
              opacity: entityOpacity * 0.8,
            }}
          />

          {/* 3-D Scale icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative will-change-transform"
              style={{
                width: 480, height: 480,
                transformStyle: 'preserve-3d',
                transform: `translateY(10%) rotateY(${entityRotateY}deg) scale(${entityScale})`,
                opacity: entityOpacity,
              }}
            >
              <Scale
                size={480}
                strokeWidth={0.4}
                className="absolute"
                style={{ color: 'rgba(99,102,241,0.15)', filter: 'blur(18px)' }}
              />
              <Scale
                size={480}
                strokeWidth={0.8}
                className="absolute"
                style={{ color: 'rgba(99,102,241,0.08)', transform: 'translateZ(-50px)' }}
              />
              <Scale
                size={480}
                strokeWidth={0.5}
                className="absolute"
                style={{ color: 'rgba(52,211,153,0.2)', transform: 'translateZ(50px)' }}
              />
            </div>
          </div>
        </div>

        {/* ── PROGRESS BAR (top) ── */}
        <div
          className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #34d399)',
            transform: `scaleX(${progress.scroll})`,
            transformOrigin: 'left center',
          }}
        />

        {/* ── HEADER ── */}
        <div
          className="relative z-20 px-8 md:px-16 lg:px-24 mb-10 will-change-transform"
          style={{
            opacity: globalOpacity,
            transform: `translateY(${(1 - clamp(progress.entry * 2)) * 40}px)`,
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-indigo-500/25 bg-indigo-500/[0.07]">
            <Sparkles size={11} className="text-indigo-400" />
            <span className="text-indigo-300/90 text-[10px] font-bold tracking-[0.22em] uppercase">
              {t("landing.features.badge")}
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-black text-white leading-[1.05] tracking-tighter"
            style={{ fontSize: 'clamp(36px, 5.5vw, 72px)', maxWidth: 780 }}
          >
            {t("landing.features.headline").split(" ").map((w, i) => (
              <span key={i} className="inline-block mr-[0.22em]">{w}</span>
            ))}
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t("landing.features.headlineAccent")}
            </span>
          </h2>

          {/* Sub-copy */}
          <p
            className="mt-5 leading-relaxed"
            style={{
              color: 'rgba(148,163,184,0.75)',
              fontSize: 'clamp(13px, 1.1vw, 15px)',
              maxWidth: 440,
            }}
          >
            {t("landing.features.subcopy")}
          </p>
        </div>

        {/* ── CARD TRACK ──
         * Parent: w-full, no overflow clipping.
         * Inner track: max-content width, translated via LERP scroll value.
         */}
        <div className="relative z-20 w-full">
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{
              gap: '18px',
              paddingLeft:  'clamp(32px, 8vw, 96px)',
              paddingRight: 'clamp(32px, 10vw, 120px)',
              width: 'max-content',
              transform: `translateX(${-progress.scroll * maxScroll}px)`,
            }}
          >
            {FEATURES.map((f, i) => {
              /*
               * Stagger logic (fixed):
               * - Card 0: fades in during entry phase
               * - Cards 1–5: stagger in at evenly spaced scroll positions (0% → 70%)
               *   Each card animates over a 15% scroll window
               */
              let cardEntry;
              if (i === 0) {
                cardEntry = clamp(progress.entry * 3);
              } else {
                const base  = ((i - 1) / (FEATURES.length - 1)) * 0.65;
                cardEntry   = norm(progress.scroll, base, base + 0.15);
                /* Ensure cards are visible once entry is fully complete */
                if (progress.entry >= 0.98) {
                  cardEntry = Math.max(cardEntry, norm(progress.scroll, 0, 0.08));
                }
              }

              /* Gentle exit fade — only at the very end of exit phase */
              const cardVisible = clamp(cardEntry) * clamp(1 - progress.exit * 5);

              const tilt      = cardTilts[i] || { x: 0, y: 0 };
              const isHovered = hoveredCard === i;

              return (
                <div
                  key={i}
                  className="group shrink-0 relative flex flex-col justify-between cursor-pointer"
                  style={{
                    width:  'clamp(270px, 21vw, 330px)',
                    height: 'clamp(290px, 36vh, 390px)',
                    padding: 'clamp(24px, 3vw, 34px)',
                    /* Glassmorphism card */
                    background: isHovered
                      ? 'rgba(12, 10, 24, 0.92)'
                      : 'rgba(8, 6, 18, 0.80)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    borderRadius: '20px',
                    border: isHovered
                      ? `1px solid ${f.accentBorder.replace('0.2)', '0.45)')}`
                      : '1px solid rgba(255,255,255,0.065)',
                    boxShadow: isHovered
                      ? `0 32px 64px -12px rgba(0,0,0,0.65), 0 0 0 1px ${f.accentBorder}, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : '0 24px 48px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                    /* Entry + tilt combined transform */
                    opacity: cardVisible,
                    transform: `
                      translateY(${(1 - clamp(cardEntry)) * 52}px)
                      scale(${0.91 + clamp(cardEntry) * 0.09})
                      rotateX(${tilt.y * -7}deg)
                      rotateY(${tilt.x * 7}deg)
                    `,
                    transformStyle: 'preserve-3d',
                    /* Transition ONLY border/shadow/background — NOT opacity/transform (those are scroll-driven) */
                    transition: 'border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease',
                    willChange: 'transform, opacity',
                  }}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => handleMouseLeave(i)}
                >
                  {/* Top inner glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[20px]"
                    style={{
                      background: `radial-gradient(ellipse at 50% -15%, ${f.accentBg.replace('0.08)', '0.22)')}, transparent 65%)`,
                    }}
                  />

                  {/* Top edge accent line */}
                  <div
                    className="absolute top-0 left-8 right-8 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                    }}
                  />

                  {/* ── Icon ── */}
                  <div className="relative z-10">
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-6 transition-all duration-400"
                      style={{
                        background: isHovered ? f.accentBg.replace('0.08)', '0.18)') : f.accentBg,
                        border: `1px solid ${isHovered ? f.accentBorder.replace('0.2)', '0.5)') : f.accentBorder}`,
                        color: isHovered ? f.accent.replace('0.8)', '1)').replace('0.9)', '1)') : f.accent.replace('0.8)', '0.8)').replace('0.9)', '0.8)'),
                        boxShadow: isHovered ? `0 0 24px ${f.accentBg.replace('0.08)', '0.35)')}` : 'none',
                        transform: isHovered ? 'scale(1.1) translateZ(20px)' : 'scale(1)',
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <f.Icon size={20} strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h3
                      className="text-white font-bold mb-3 tracking-tight leading-snug"
                      style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}
                    >
                      {f.title}
                    </h3>

                    {/* Desc */}
                    <p
                      style={{
                        color: 'rgba(148,163,184,0.72)',
                        fontSize: '12.5px',
                        lineHeight: '1.72',
                      }}
                    >
                      {f.desc}
                    </p>
                  </div>

                  {/* ── Card footer ── */}
                  <div className="relative z-10 flex items-end justify-between mt-auto pt-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-[5px] h-[5px] rounded-full transition-all duration-500"
                        style={{
                          background: isHovered ? f.accent : 'rgba(99,102,241,0.3)',
                          boxShadow: isHovered ? `0 0 8px ${f.accent}` : 'none',
                        }}
                      />
                      <div
                        className="w-[4px] h-[4px] rounded-full transition-all duration-500 opacity-60"
                        style={{
                          background: isHovered ? 'rgba(52,211,153,0.9)' : 'rgba(52,211,153,0.2)',
                        }}
                      />
                    </div>

                    {/* Ghost number */}
                    <span
                      className="font-black select-none leading-none transition-all duration-500"
                      style={{
                        fontSize: '48px',
                        letterSpacing: '-0.04em',
                        color: isHovered ? f.accentBg.replace('0.08)', '0.18)') : 'rgba(255,255,255,0.025)',
                      }}
                    >
                      {f.num}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="relative z-20 flex flex-col items-center mt-10 gap-5"
          style={{ opacity: globalOpacity }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-[7px]">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === activeDotIndex ? 22 : 5,
                  height:     5,
                  background: i === activeDotIndex ? f.accent : 'rgba(255,255,255,0.1)',
                  opacity:    i === activeDotIndex ? 1 : 0.5,
                  boxShadow:  i === activeDotIndex ? `0 0 8px ${f.accent}` : 'none',
                }}
              />
            ))}
          </div>

          {/* Scroll hint */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span
              className="font-bold tracking-[0.22em] uppercase"
              style={{ fontSize: '9px', color: 'rgba(100,116,139,0.6)' }}
            >
              Scroll to discover
            </span>
            <div className="w-10 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>

      </section>
    </div>
  );
}