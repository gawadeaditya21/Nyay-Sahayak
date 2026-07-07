import React, { useLayoutEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

import Hero from '../components/landing/Hero';
import CinematicRevealSection from '../components/landing/CinematicRevealSection';
import LegaleseDecoder from '../components/landing/LegaleseDecoder';
import AiAdvocateSection from '../components/landing/AiAdvocateSection';
import Features from '../components/landing/Features';
import DocumentScanner from '../components/landing/DocumentScanner';
import HowItWorks from '../components/landing/HowItWorks';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const { t } = useTranslation();
  
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0, 0);

    // Forces GSAP to recalculate all layouts after rendering to prevent overlapping
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <div className="relative bg-[#050505] min-h-screen text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Simplified, high-performance static background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>
      
      {/* Floating Language Switcher for Landing Page */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <main className="relative z-10 w-full overflow-x-clip">
        <Hero />
        <CinematicRevealSection />
        <LegaleseDecoder />
        <AiAdvocateSection />
        <Features />
        <DocumentScanner />
        <HowItWorks />
      </main>
      
      <footer className="relative z-10 py-10 border-t border-white/5 text-center text-slate-500 text-sm bg-[#050505]">
        <p>{t("landing.footerCopyright")}</p>
      </footer>
    </div>
  );
}