import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldAlert,
  FileSearch,
  Zap,
  Lock,
  Scale,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const clamp = (value) => Math.max(0, Math.min(1, value));
const norm = (value, start, end) => clamp((value - start) / (end - start));
const lerp = (start, end, progress) => start + (end - start) * progress;

export default function Features() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(null);

  const targetRef = useRef({ entry: 0, scroll: 0, exit: 0 });
  const currentRef = useRef({ entry: 0, scroll: 0, exit: 0 });

  const [progress, setProgress] = useState({ entry: 0, scroll: 0, exit: 0 });
  const [maxScroll, setMaxScroll] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [cardTilts, setCardTilts] = useState({});

  const features = useMemo(
    () => [
      {
        title: t('landing.features.riskDetectionTitle'),
        desc: t('landing.features.riskDetectionDesc'),
        Icon: ShieldAlert,
        num: '01',
        accent: 'rgba(239,68,68,0.8)',
        accentBg: 'rgba(239,68,68,0.08)',
        accentBorder: 'rgba(239,68,68,0.2)',
      },
      {
        title: t('landing.features.legaleseDecoderTitle'),
        desc: t('landing.features.legaleseDecoderDesc'),
        Icon: Scale,
        num: '02',
        accent: 'rgba(99,102,241,0.9)',
        accentBg: 'rgba(99,102,241,0.08)',
        accentBorder: 'rgba(99,102,241,0.2)',
      },
      {
        title: t('landing.features.smartSummarizationTitle'),
        desc: t('landing.features.smartSummarizationDesc'),
        Icon: FileSearch,
        num: '03',
        accent: 'rgba(168,85,247,0.9)',
        accentBg: 'rgba(168,85,247,0.08)',
        accentBorder: 'rgba(168,85,247,0.2)',
      },
      {
        title: t('landing.features.interactiveAnalysisTitle'),
        desc: t('landing.features.interactiveAnalysisDesc'),
        Icon: MessageSquare,
        num: '04',
        accent: 'rgba(34,211,238,0.9)',
        accentBg: 'rgba(34,211,238,0.08)',
        accentBorder: 'rgba(34,211,238,0.2)',
      },
      {
        title: t('landing.features.forensicPrecisionTitle'),
        desc: t('landing.features.forensicPrecisionDesc'),
        Icon: Zap,
        num: '05',
        accent: 'rgba(251,191,36,0.9)',
        accentBg: 'rgba(251,191,36,0.07)',
        accentBorder: 'rgba(251,191,36,0.2)',
      },
      {
        title: t('landing.features.enterpriseSecurityTitle'),
        desc: t('landing.features.enterpriseSecurityDesc'),
        Icon: Lock,
        num: '06',
        accent: 'rgba(52,211,153,0.9)',
        accentBg: 'rgba(52,211,153,0.08)',
        accentBorder: 'rgba(52,211,153,0.2)',
      },
    ],
    [t]
  );

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const trackWidth = trackRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      const paddingRight = Math.min(120, Math.max(32, viewportWidth * 0.1));
      setMaxScroll(Math.max(0, trackWidth - viewportWidth + paddingRight));
    };

    measure();
    window.addEventListener('resize', measure);
    const timer = window.setTimeout(measure, 400);

    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalHeight = rect.height;

      targetRef.current.entry = clamp(1 - rect.top / viewportHeight);
      const scrollRange = totalHeight - viewportHeight;
      targetRef.current.scroll = scrollRange > 0 ? clamp(-rect.top / scrollRange) : 0;
      targetRef.current.exit = clamp((viewportHeight - rect.bottom) / viewportHeight);
    };

    const loop = () => {
      const next = targetRef.current;
      const current = currentRef.current;
      const speed = 0.075;

      current.entry = lerp(current.entry, next.entry, speed);
      current.scroll = lerp(current.scroll, next.scroll, speed);
      current.exit = lerp(current.exit, next.exit, speed);

      setProgress({ ...current });
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event, index) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setCardTilts((prev) => ({ ...prev, [index]: { x, y } }));
  };

  const handleMouseLeave = (index) => {
    setCardTilts((prev) => ({ ...prev, [index]: { x: 0, y: 0 } }));
    setHoveredCard(null);
  };

  const globalOpacity = clamp(progress.entry * 3) * clamp(1 - progress.exit * 4);
  const entityRotateY = -35 + progress.scroll * 70;
  const entityScale = 0.75 + progress.entry * 0.25 - progress.exit * 0.35;
  const entityOpacity = clamp(progress.entry * 2) * clamp(1 - progress.exit * 2);

  const activeDotIndex = Math.min(features.length - 1, Math.floor(progress.scroll * features.length));

  return (
    <div ref={wrapperRef} className="relative w-full bg-[#020205]" style={{ height: '500vh' }}>
      <section className="sticky top-0 flex h-screen w-full flex-col justify-center" style={{ perspective: '1200px' }}>
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 z-10 mix-blend-screen"
            style={{
              opacity: 0.035,
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />

          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, rgba(2,2,5,0.7) 100%)',
            }}
          />

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

          <div
            className="absolute rounded-full blur-[140px]"
            style={{
              width: '55vw',
              height: '55vw',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${entityScale * 1.1})`,
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
              opacity: entityOpacity * 0.8,
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative will-change-transform"
              style={{
                width: 480,
                height: 480,
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

        <div
          className="fixed top-0 left-0 right-0 z-100 h-0.5 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #34d399)',
            transform: `scaleX(${progress.scroll})`,
            transformOrigin: 'left center',
          }}
        />

        <div
          className="relative z-20 mb-10 px-8 will-change-transform md:px-16 lg:px-24"
          style={{
            opacity: globalOpacity,
            transform: `translateY(${(1 - clamp(progress.entry * 2)) * 40}px)`,
          }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/[0.07] px-3 py-1.5">
            <Sparkles size={11} className="text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300/90">
              {t('landing.features.badge')}
            </span>
          </div>

          <h2
            className="max-w-195 font-black leading-[1.05] tracking-tighter text-white"
            style={{ fontSize: 'clamp(36px, 5.5vw, 72px)' }}
          >
            {[t('landing.features.headline'), t('landing.features.headlineAccent')].map((part, index) => (
              <span key={index} className="mr-[0.22em] inline-block">
                {index === 1 ? (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #34d399 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {part}
                  </span>
                ) : (
                  part
                )}
              </span>
            ))}
          </h2>

          <p
            className="mt-5 max-w-110 leading-relaxed"
            style={{
              color: 'rgba(148,163,184,0.75)',
              fontSize: 'clamp(13px, 1.1vw, 15px)',
            }}
          >
            {t('landing.features.subcopy')}
          </p>
        </div>

        <div className="relative z-20 w-full">
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{
              gap: '18px',
              paddingLeft: 'clamp(32px, 8vw, 96px)',
              paddingRight: 'clamp(32px, 10vw, 120px)',
              width: 'max-content',
              transform: `translateX(${-progress.scroll * maxScroll}px)`,
            }}
          >
            {features.map((feature, index) => {
              let cardEntry;
              if (index === 0) {
                cardEntry = clamp(progress.entry * 3);
              } else {
                const base = ((index - 1) / (features.length - 1)) * 0.65;
                cardEntry = norm(progress.scroll, base, base + 0.15);
                if (progress.entry >= 0.98) {
                  cardEntry = Math.max(cardEntry, norm(progress.scroll, 0, 0.08));
                }
              }

              const cardVisible = clamp(cardEntry) * clamp(1 - progress.exit * 5);
              const tilt = cardTilts[index] || { x: 0, y: 0 };
              const isHovered = hoveredCard === index;

              return (
                <div
                  key={feature.title}
                  className="group relative flex shrink-0 cursor-pointer flex-col justify-between overflow-hidden"
                  style={{
                    width: 'clamp(270px, 21vw, 330px)',
                    height: 'clamp(290px, 36vh, 390px)',
                    padding: 'clamp(24px, 3vw, 34px)',
                    background: isHovered ? 'rgba(12, 10, 24, 0.92)' : 'rgba(8, 6, 18, 0.8)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    borderRadius: '20px',
                    border: isHovered
                      ? `1px solid ${feature.accentBorder.replace('0.2)', '0.45)')}`
                      : '1px solid rgba(255,255,255,0.065)',
                    boxShadow: isHovered
                      ? `0 32px 64px -12px rgba(0,0,0,0.65), 0 0 0 1px ${feature.accentBorder}, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : '0 24px 48px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                    opacity: cardVisible,
                    transform: `
                      translateY(${(1 - clamp(cardEntry)) * 52}px)
                      scale(${0.91 + clamp(cardEntry) * 0.09})
                      rotateX(${tilt.y * -7}deg)
                      rotateY(${tilt.x * 7}deg)
                    `,
                    transformStyle: 'preserve-3d',
                    transition: 'border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease',
                    willChange: 'transform, opacity',
                  }}
                  onMouseMove={(event) => handleMouseMove(event, index)}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(ellipse at 50% -15%, ${feature.accentBg.replace('0.08)', '0.22)')}, transparent 65%)`,
                    }}
                  />

                  <div
                    className="pointer-events-none absolute left-8 right-8 top-0 h-px rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div
                      className="mb-6 flex h-11 w-11 items-center justify-center rounded-[14px] transition-all duration-400"
                      style={{
                        background: isHovered ? feature.accentBg.replace('0.08)', '0.18)') : feature.accentBg,
                        border: `1px solid ${isHovered ? feature.accentBorder.replace('0.2)', '0.5)') : feature.accentBorder}`,
                        color: isHovered ? feature.accent.replace('0.8)', '1)').replace('0.9)', '1)') : feature.accent.replace('0.8)', '0.8)').replace('0.9)', '0.8)'),
                        boxShadow: isHovered ? `0 0 24px ${feature.accentBg.replace('0.08)', '0.35)')}` : 'none',
                        transform: isHovered ? 'scale(1.1) translateZ(20px)' : 'scale(1)',
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <feature.Icon size={20} strokeWidth={1.5} />
                    </div>

                    <h3 className="mb-3 leading-snug font-bold tracking-tight text-white" style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}>
                      {feature.title}
                    </h3>

                    <p style={{ color: 'rgba(148,163,184,0.72)', fontSize: '12.5px', lineHeight: '1.72' }}>
                      {feature.desc}
                    </p>
                  </div>

                  <div className="relative z-10 mt-auto flex items-end justify-between pt-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-1.25 w-1.25 rounded-full transition-all duration-500"
                        style={{
                          background: isHovered ? feature.accent : 'rgba(99,102,241,0.3)',
                          boxShadow: isHovered ? `0 0 8px ${feature.accent}` : 'none',
                        }}
                      />
                      <div
                        className="h-1 w-1 rounded-full opacity-60 transition-all duration-500"
                        style={{
                          background: isHovered ? 'rgba(52,211,153,0.9)' : 'rgba(52,211,153,0.2)',
                        }}
                      />
                    </div>

                    <span
                      className="select-none font-black leading-none transition-all duration-500"
                      style={{
                        fontSize: '48px',
                        letterSpacing: '-0.04em',
                        color: isHovered ? feature.accentBg.replace('0.08)', '0.18)') : 'rgba(255,255,255,0.025)',
                      }}
                    >
                      {feature.num}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-20 mt-10 flex flex-col items-center gap-5" style={{ opacity: globalOpacity }}>
          <div className="flex items-center gap-1.75">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-full transition-all duration-300"
                style={{
                  width: index === activeDotIndex ? 22 : 5,
                  height: 5,
                  background: index === activeDotIndex ? feature.accent : 'rgba(255,255,255,0.1)',
                  opacity: index === activeDotIndex ? 1 : 0.5,
                  boxShadow: index === activeDotIndex ? `0 0 8px ${feature.accent}` : 'none',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-[rgba(255,255,255,0.08)]" />
            <span className="font-bold uppercase tracking-[0.22em]" style={{ fontSize: '9px', color: 'rgba(100,116,139,0.6)' }}>
              {t('landing.features.badge')}
            </span>
            <div className="h-px w-10 bg-[rgba(255,255,255,0.08)]" />
          </div>
        </div>
      </section>
    </div>
  );
}
