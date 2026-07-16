import React, { useLayoutEffect, useState, useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import GuidedTour from '../components/onboarding/GuidedTour';
import { useOnboarding } from '../hooks/useOnboarding';

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
  const { isFirstTimeUser, hasCompletedTour, completeTour } = useOnboarding();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Small delay to let initial animations finish
    if (isFirstTimeUser && !hasCompletedTour) {
      const timer = setTimeout(() => setShowTour(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFirstTimeUser, hasCompletedTour]);

  const tourSteps = [
    { target: null, title: t('week3.tour.step1Title'), content: t('week3.tour.step1Desc') },
    { target: null, title: t('week3.tour.step2Title'), content: t('week3.tour.step2Desc') },
    { target: null, title: t('week3.tour.step3Title'), content: t('week3.tour.step3Desc') },
    { target: null, title: t('week3.tour.step4Title'), content: t('week3.tour.step4Desc') },
    { target: '[data-tour="language-switcher"]', title: t('week3.tour.step5Title'), content: t('week3.tour.step5Desc') },
    { target: null, title: t('week3.tour.step6Title'), content: t('week3.tour.step6Desc') },
    { target: null, title: t('week3.tour.step7Title'), content: t('week3.tour.step7Desc') }
  ];

  const handleTourClose = () => {
    setShowTour(false);
    completeTour();
  };
  
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
    <div className="relative bg-[var(--color-bg-main)] min-h-screen text-[var(--color-text-main)] selection:bg-indigo-500/30 selection:text-indigo-200">
      
      <GuidedTour 
        steps={tourSteps}
        isOpen={showTour}
        onClose={handleTourClose}
        onComplete={handleTourClose}
      />

      {/* Simplified, high-performance static background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>
      
      {/* Floating Language Switcher for Landing Page */}
      <div data-tour="language-switcher" className="absolute top-6 right-6 z-50 rounded-full bg-white/5 p-1 backdrop-blur-md">
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
      
      <footer className="relative z-10 py-10 border-t border-[var(--color-border-main)] text-center text-slate-500 text-sm bg-[var(--color-bg-main)]">
        <p>{t("landing.footerCopyright")}</p>
      </footer>
    </div>
  );
}