import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, Scale, ScanSearch, Shield, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const clamp = (value) => Math.max(0, Math.min(1, value));
const normalize = (value, start, end) => clamp((value - start) / (end - start));

export default function CinematicRevealSection() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const features = [
    {
      title: t('landing.cinematic.features.riskMitigationTitle'),
      desc: t('landing.cinematic.features.riskMitigationDesc'),
      icon: Shield,
    },
    {
      title: t('landing.cinematic.features.aiReviewTitle'),
      desc: t('landing.cinematic.features.aiReviewDesc'),
      icon: Sparkles,
    },
    {
      title: t('landing.cinematic.features.legalPrecisionTitle'),
      desc: t('landing.cinematic.features.legalPrecisionDesc'),
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
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.28) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vw] w-[70vw] max-h-225 max-w-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[140px]" />

          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8"
            style={{ opacity: reveal, transform: `scale(${0.82 + reveal * 0.18})` }}
          >
            <div className="max-w-5xl w-full text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 mb-6 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 backdrop-blur-sm sm:mb-8">
                <CheckCircle2 size={14} />
                <span>{t('landing.cinematic.scanComplete')}</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl font-serif">
                {t('landing.cinematic.headline')}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:mt-6 md:text-lg">
                {t('landing.cinematic.subcopy')}
              </p>

              <div className="mt-10 grid gap-4 text-left md:grid-cols-3 sm:mt-14 sm:gap-6">
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div key={feature.title} className="rounded-3xl border border-white/5 bg-[#0a0a0c]/90 p-5 shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/15 bg-indigo-500/10 text-indigo-400">
                        <Icon size={22} />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-400 sm:text-base">{feature.desc}</p>
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
            <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-indigo-500/30 bg-[#0a0a0c] shadow-[0_0_60px_rgba(79,70,229,0.22)]">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(79,70,229,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

              <div className="absolute inset-0 flex items-center justify-center p-8 text-center sm:p-12">
                <div style={{ opacity: contentOpacity }} className="relative z-10 flex h-full w-full flex-col items-center justify-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 shadow-[0_0_30px_rgba(79,70,229,0.28)] sm:mb-6">
                    <Scale size={34} className="text-indigo-300" />
                  </div>

                  <h3 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl font-serif">{t('appName')}</h3>

                  <div className="mx-auto max-w-md space-y-3 text-sm leading-relaxed text-slate-400 sm:space-y-4 sm:text-base">
                    <p>{t('landing.cinematic.initializing')}</p>
                    <p className="font-medium text-indigo-300">{t('landing.cinematic.status')}</p>
                    <div className="my-4 h-px w-full bg-linear-to-r from-transparent via-indigo-500/50 to-transparent" />
                    <p>{t('landing.cinematic.prepare')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute left-0 right-0 z-20 h-0.5 bg-cyan-400 transition-opacity" style={{ top: `${laserTop}%`, opacity: laserOpacity, boxShadow: '0 0 20px 5px rgba(34, 211, 238, 0.6), 0 0 40px 10px rgba(79, 70, 229, 0.35)' }}>
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-cyan-500/50 bg-[#050505] px-3 py-1 text-cyan-200">
                  <ScanSearch size={14} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em]">{t('landing.cinematic.scanning')}</span>
                </div>
              </div>
            </div>

            <div className="absolute left-0 top-0 z-30 h-1/2 w-full origin-top" style={{ transformStyle: 'preserve-3d', transform: `rotateX(${topFlapRotate}deg)`, backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 rounded-t-[1.75rem] border border-indigo-500/20 bg-linear-to-b from-[#15151a] to-[#111115] shadow-xl" />
              <div className="absolute bottom-0 left-1/2 flex h-8 w-16 -translate-x-1/2 translate-y-px items-end justify-center rounded-t-full border-x border-t border-indigo-500/40 bg-[#050505] pb-1">
                <Lock size={16} className="text-indigo-500" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 z-30 h-1/2 w-full origin-bottom" style={{ transformStyle: 'preserve-3d', transform: `rotateX(${bottomFlapRotate}deg)`, backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 rounded-b-[1.75rem] border border-indigo-500/20 bg-linear-to-t from-[#15151a] to-[#0a0a0c] shadow-2xl" />
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-slate-500 sm:text-xs">
            <div className="h-px w-10 bg-slate-700 sm:w-12" />
            {t('landing.cinematic.footerLeft')}
            <div className="h-px w-10 bg-slate-700 sm:w-12" />
            <ArrowRight size={14} className="text-slate-600" />
          </div>
        </div>
      </div>
    </section>
  );
}
