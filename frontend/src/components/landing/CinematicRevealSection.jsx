import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Scale,
  ScanSearch,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const clamp = (value) => Math.max(0, Math.min(1, value));
const normalize = (value, start, end) => clamp((value - start) / (end - start));

export default function CinematicRevealSection() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const features = [
    {
      title: t("landing.cinematic.features.riskMitigationTitle"),
      desc: t("landing.cinematic.features.riskMitigationDesc"),
      icon: Shield,
    },
    {
      title: t("landing.cinematic.features.aiReviewTitle"),
      desc: t("landing.cinematic.features.aiReviewDesc"),
      icon: Sparkles,
    },
    {
      title: t("landing.cinematic.features.legalPrecisionTitle"),
      desc: t("landing.cinematic.features.legalPrecisionDesc"),
      icon: Scale,
    },
  ];

  useEffect(() => {
    let rafId = 0;

    const updateProgress = () => {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = Math.max(1, rect.height - windowHeight);
      const scrolled = -rect.top;
      const nextProgress = clamp(scrolled / totalScrollable);

      setProgress((current) => (Math.abs(current - nextProgress) < 0.001 ? current : nextProgress));
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const arrival = normalize(progress, 0, 0.25);
  const unfold = normalize(progress, 0.25, 0.5);
  const zoom = normalize(progress, 0.5, 0.8);
  const reveal = normalize(progress, 0.75, 1.0);

  const docY = (1 - arrival) * 100;
  const docRotateZ = (1 - arrival) * -45;
  const docRotateX = (1 - arrival) * 60;
  const topFlapRotate = unfold * 180;
  const bottomFlapRotate = unfold * -180;
  const contentOpacity = unfold;
  const docScale = 1 + Math.pow(zoom, 3) * 30;
  const docOpacity = 1 - normalize(progress, 0.75, 0.8);
  const laserTop = zoom * 100;
  const laserOpacity = zoom > 0 && zoom < 0.9 ? 1 : 0;

  return (
    <section ref={wrapperRef} className="relative h-[400vh] w-full bg-[#050505]">
      <div className="sticky top-0 h-screen w-full overflow-hidden px-4 sm:px-6">
        <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: '2000px' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.12),transparent_40%),linear-gradient(180deg,rgba(5,5,5,0.95),rgba(5,5,5,1))]" />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.28) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[70vw] w-[70vw] max-w-225 max-h-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />

        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8"
          style={{
            opacity: reveal,
            transform: `scale(${0.82 + reveal * 0.18})`,
            pointerEvents: 'none',
          }}
        >
          <div className="max-w-5xl w-full text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] mb-6 sm:mb-8 backdrop-blur-sm">
              <CheckCircle2 size={14} />
              <span>{t("landing.cinematic.scanComplete")}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              {t("landing.cinematic.headline")}
            </h2>
            <p className="mt-5 sm:mt-6 text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {t("landing.cinematic.subcopy")}
            </p>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-14 text-left">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="p-5 sm:p-6 rounded-3xl bg-[#0a0a0c]/90 border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="relative"
          style={{
            width: 'clamp(320px, 78vw, 560px)',
            height: 'clamp(420px, 72vh, 760px)',
            transformStyle: 'preserve-3d',
            transform: `translate3d(0, ${docY}vh, 0) rotateZ(${docRotateZ}deg) rotateX(${docRotateX}deg) scale(${docScale})`,
            transformOrigin: 'center center',
            opacity: docOpacity,
          }}
        >
          <div className="absolute inset-0 rounded-[1.75rem] bg-[#0a0a0c] border border-indigo-500/30 shadow-[0_0_60px_rgba(79,70,229,0.22)] overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(79,70,229,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 text-center">
              <div style={{ opacity: contentOpacity }} className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-5 sm:mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.28)]">
                  <Scale size={34} className="text-indigo-300" />
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                  {t("appName")}
                </h3>

                <div className="space-y-3 sm:space-y-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  <p>{t("landing.cinematic.initializing")}</p>
                  <p className="text-indigo-300 font-medium">{t("landing.cinematic.status")}</p>
                  <div className="w-full h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent my-4" />
                  <p>{t("landing.cinematic.prepare")}</p>
                </div>
              </div>
            </div>

            <div
              className="absolute left-0 right-0 h-0.5 bg-cyan-400 z-20 transition-opacity"
              style={{
                top: `${laserTop}%`,
                opacity: laserOpacity,
                boxShadow: '0 0 20px 5px rgba(34, 211, 238, 0.6), 0 0 40px 10px rgba(79, 70, 229, 0.35)',
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-200 flex items-center gap-2 bg-[#050505] px-3 py-1 rounded-full border border-cyan-500/50">
                <ScanSearch size={14} className="animate-spin" />
                <span className="text-[10px] font-bold tracking-[0.28em] uppercase">{t("landing.cinematic.scanning")}</span>
              </div>
            </div>
          </div>

          <div
            className="absolute top-0 left-0 w-full h-1/2 origin-top z-30"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${topFlapRotate}deg)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="absolute inset-0 rounded-t-[1.75rem] bg-linear-to-b from-[#15151a] to-[#111115] border-x border-t border-b border-indigo-500/20 shadow-xl flex items-end justify-center pb-0">
              <div className="w-16 h-8 bg-[#050505] border-t border-x border-indigo-500/40 rounded-t-full translate-y-px flex items-end justify-center pb-1">
                <Lock size={16} className="text-indigo-500" />
              </div>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 w-full h-1/2 origin-bottom z-30"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${bottomFlapRotate}deg)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="absolute inset-0 rounded-b-[1.75rem] bg-linear-to-t from-[#15151a] to-[#0a0a0c] border border-indigo-500/20 shadow-2xl flex items-start justify-center pt-0">
              <div className="w-16 h-8 bg-[#050505] border-b border-x border-indigo-500/40 rounded-b-full -translate-y-px flex items-start justify-center pt-1" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-slate-500 text-[11px] sm:text-xs tracking-[0.28em] uppercase">
          <div className="w-10 sm:w-12 h-px bg-slate-700" />
          {t("landing.cinematic.footerLeft")}
          <div className="w-10 sm:w-12 h-px bg-slate-700" />
          <ArrowRight size={14} className="text-slate-600" />
        </div>
        </div>
      </div>
    </section>
  );
}
