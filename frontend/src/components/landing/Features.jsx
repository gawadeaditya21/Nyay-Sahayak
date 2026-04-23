import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

gsap.registerPlugin(ScrollTrigger);

export default function Features() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);

  const features = [
    {
      title: t('landing.features.riskDetectionTitle'),
      description: t('landing.features.riskDetectionDesc'),
      icon: <ShieldAlert size={32} />,
    },
    {
      title: t('landing.features.legaleseDecoderTitle'),
      description: t('landing.features.legaleseDecoderDesc'),
      icon: <Scale size={32} />,
    },
    {
      title: t('landing.features.smartSummarizationTitle'),
      description: t('landing.features.smartSummarizationDesc'),
      icon: <FileSearch size={32} />,
    },
    {
      title: t('landing.features.interactiveAnalysisTitle'),
      description: t('landing.features.interactiveAnalysisDesc'),
      icon: <MessageSquare size={32} />,
    },
    {
      title: t('landing.features.forensicPrecisionTitle'),
      description: t('landing.features.forensicPrecisionDesc'),
      icon: <Zap size={32} />,
    },
    {
      title: t('landing.features.enterpriseSecurityTitle'),
      description: t('landing.features.enterpriseSecurityDesc'),
      icon: <Lock size={32} />,
    },
  ];

  useLayoutEffect(() => {
    if (!wrapperRef.current || !trackRef.current) return undefined;

    const ctx = gsap.context(() => {
      const getScrollAmount = () => -(trackRef.current.scrollWidth - window.innerWidth + 120);

      const scrollTween = gsap.to(trackRef.current, {
        x: getScrollAmount,
        ease: 'none',
      });

      ScrollTrigger.create({
        trigger: wrapperRef.current,
        pin: true,
        start: 'top top',
        end: () => `+=${trackRef.current.scrollWidth}`,
        animation: scrollTween,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      });

      gsap.utils.toArray('.feature-card').forEach((card) => {
        gsap.from(card, {
          y: 80,
          opacity: 0,
          scale: 0.92,
          duration: 0.8,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: card,
            containerAnimation: scrollTween,
            start: 'left 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-10 w-full bg-[#050505]">
      <section className="relative flex h-screen flex-col justify-center overflow-hidden">
        <div className="mb-12 shrink-0 px-6 md:px-20">
          <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-indigo-500">
            <Sparkles size={14} /> {t('landing.features.badge')}
          </h2>
          <h3 className="max-w-2xl text-4xl font-bold text-white md:text-6xl font-serif">
            {t('landing.features.headline')}{' '}
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              {t('landing.features.headlineAccent')}
            </span>
          </h3>
          <p className="mt-5 max-w-xl leading-relaxed text-slate-400">
            {t('landing.features.subcopy')}
          </p>
        </div>

        <div ref={trackRef} className="flex w-max gap-8 px-6 pb-20 will-change-transform md:px-20">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card group relative flex w-[85vw] flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0c]/80 p-10 shadow-2xl backdrop-blur-md transition-colors hover:border-indigo-500/30"
              style={{ height: '28rem' }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-indigo-400 transition-all duration-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white">
                  {feature.icon}
                </div>

                <h4 className="mb-4 text-3xl font-bold leading-tight text-white">
                  {feature.title}
                </h4>

                <p className="text-lg leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>

              <div className="pointer-events-none absolute bottom-8 right-8 text-6xl font-serif font-bold text-white/5 transition-colors duration-500">
                0{index + 1}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-4 text-sm uppercase tracking-widest text-slate-500 opacity-60">
          <div className="h-px w-12 bg-slate-700" />
          {t('landing.features.badge')}
          <div className="h-px w-12 bg-slate-700" />
        </div>
      </section>
    </div>
  );
}
