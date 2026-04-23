import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, Ticket, Briefcase, Bot, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AiAdvocateSection = () => {
  const wrapperRef = useRef(null);

  // Document refs
  const doc1Ref = useRef(null);
  const doc2Ref = useRef(null);
  const doc3Ref = useRef(null);

  // Hub ref
  const hubRef = useRef(null);

  // Laser ref
  const laserRef = useRef(null);

  // Verdict ref
  const verdictRef = useRef(null);

  // Header refs
  const headerBadgeRef = useRef(null);
  const headerTitleRef = useRef(null);
  const headerSubRef = useRef(null);

  // CTA ref
  const ctaRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const docs = [doc1Ref.current, doc2Ref.current, doc3Ref.current];
      const hub = hubRef.current;
      const laser = laserRef.current;
      const verdict = verdictRef.current;

      // ─────── HEADER REVEAL ON SCROLL ───────
      gsap.from([headerBadgeRef.current, headerTitleRef.current, headerSubRef.current], {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });

      // ─────── INITIAL STATES ───────
      // Doc1: Rental Agreement → starts far top-left
      gsap.set(doc1Ref.current, { xPercent: -50, yPercent: -50, x: -280, y: -110, rotation: -12, opacity: 0, scale: 0 });
      // Doc2: Train Ticket → starts far bottom-left
      gsap.set(doc2Ref.current, { xPercent: -50, yPercent: -50, x: -200, y: 100, rotation: 6, opacity: 0, scale: 0 });
      // Doc3: Offer Letter → starts far top-right
      gsap.set(doc3Ref.current, { xPercent: -50, yPercent: -50, x: 280, y: -90, rotation: 12, opacity: 0, scale: 0 });
      // Hub
      gsap.set(hub, { scale: 0.75, opacity: 0 });
      // Laser inside hub
      gsap.set(laser, { top: '-10%', opacity: 0 });
      // Verdict badge
      gsap.set(verdict, { scale: 0.5, opacity: 0, y: 10 });
      // CTA
      gsap.set(ctaRef.current, { opacity: 0, y: 20 });

      // ─────── MASTER SCROLL TIMELINE ───────
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: '+=300%',
          anticipatePin: 1,
        },
      });

      // ═══════════════════════════════════════════
      // PHASE 1 — CHAOS (0 → 0.30)
      // Documents fly in and float around hub
      // ═══════════════════════════════════════════

      // Hub appears softly first
      tl.to(hub, {
        scale: 1,
        opacity: 1,
        duration: 0.08,
        ease: 'power2.out',
      }, 0.02);

      // Doc 1 — Rental Agreement swings in from top-left
      tl.to(doc1Ref.current, {
        x: -200,
        y: -80,
        rotation: -12,
        opacity: 1,
        scale: 1,
        duration: 0.10,
        ease: 'power3.out',
      }, 0.04);

      // Doc 2 — IRCTC ticket slides in from bottom-left
      tl.to(doc2Ref.current, {
        x: -140,
        y: 80,
        rotation: 6,
        opacity: 1,
        scale: 1,
        duration: 0.10,
        ease: 'power3.out',
      }, 0.07);

      // Doc 3 — Offer Letter flies in from top-right
      tl.to(doc3Ref.current, {
        x: 200,
        y: -60,
        rotation: 12,
        opacity: 1,
        scale: 1,
        duration: 0.10,
        ease: 'power3.out',
      }, 0.10);

      // Gentle bobbing while visible (scrub float effect)
      tl.to(doc1Ref.current, { y: -95, rotation: -8, duration: 0.04, ease: 'sine.inOut' }, 0.16);
      tl.to(doc1Ref.current, { y: -75, rotation: -14, duration: 0.04, ease: 'sine.inOut' }, 0.20);
      tl.to(doc2Ref.current, { y: 92, rotation: 10, duration: 0.04, ease: 'sine.inOut' }, 0.17);
      tl.to(doc2Ref.current, { y: 72, rotation: 4, duration: 0.04, ease: 'sine.inOut' }, 0.21);
      tl.to(doc3Ref.current, { y: -72, rotation: 8, duration: 0.04, ease: 'sine.inOut' }, 0.18);
      tl.to(doc3Ref.current, { y: -52, rotation: 14, duration: 0.04, ease: 'sine.inOut' }, 0.22);

      // ═══════════════════════════════════════════
      // PHASE 2 — CONSOLIDATION (0.30 → 0.52)
      // Documents get sucked into the hub
      // ═══════════════════════════════════════════

      // Hub grows and gets emphasized
      tl.to(hub, {
        scale: 1.1,
        boxShadow: '0 0 60px rgba(79,70,229,0.4), 0 0 120px rgba(79,70,229,0.15)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        duration: 0.10,
        ease: 'power2.inOut',
      }, 0.30);

      // Doc 1 collapses into hub center
      tl.to(doc1Ref.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0.2,
        opacity: 0,
        duration: 0.12,
        ease: 'power4.inOut',
      }, 0.32);

      // Doc 2 collapses
      tl.to(doc2Ref.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0.2,
        opacity: 0,
        duration: 0.12,
        ease: 'power4.inOut',
      }, 0.35);

      // Doc 3 collapses
      tl.to(doc3Ref.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0.2,
        opacity: 0,
        duration: 0.12,
        ease: 'power4.inOut',
      }, 0.38);

      // Hub pulse on absorb
      tl.to(hub, { scale: 1.2, duration: 0.03, ease: 'power2.out' }, 0.48);
      tl.to(hub, { scale: 1.0, duration: 0.04, ease: 'power2.in' }, 0.51);

      // ═══════════════════════════════════════════
      // PHASE 3 — FORENSIC SCAN (0.55 → 0.74)
      // Indigo laser sweeps inside the hub
      // ═══════════════════════════════════════════

      // Laser appears
      tl.to(laser, { opacity: 1, duration: 0.02 }, 0.55);

      // Laser sweeps from top to bottom of hub
      tl.fromTo(laser,
        { top: '-10%' },
        { top: '110%', duration: 0.16, ease: 'none' },
        0.56
      );

      // Laser fades out
      tl.to(laser, { opacity: 0, duration: 0.02 }, 0.72);

      // ═══════════════════════════════════════════
      // PHASE 4 — VERDICT (0.76 → 1.0)
      // Hub transitions green, verdict shield pops
      // ═══════════════════════════════════════════

      // Hub -> success green border
      tl.to(hub, {
        borderColor: 'rgba(16, 185, 129, 0.5)',
        boxShadow: '0 0 60px rgba(16,185,129,0.3), 0 0 100px rgba(16,185,129,0.1)',
        duration: 0.06,
      }, 0.76);

      // Verdict shield pops in below hub
      tl.to(verdict, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.08,
        ease: 'back.out(1.7)',
      }, 0.80);

      // CTA fades in
      tl.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.06,
        ease: 'power3.out',
      }, 0.88);

      // Hold everything visible
      tl.to({}, { duration: 0.10 }, 0.92);

    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full z-10 bg-[#050505]">
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6">

        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-indigo-600/8 blur-[120px] rounded-full pointer-events-none" />

        {/* ─── SECTION HEADER ─── */}
        <div className="relative z-10 text-center mb-12 md:mb-16 max-w-3xl mx-auto shrink-0">
          <div
            ref={headerBadgeRef}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Zap size={14} className="animate-pulse" />
            <span>Interactive Visualization</span>
          </div>

          <h2
            ref={headerTitleRef}
            className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-5 leading-tight"
          >
            Bring the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">
              Chaos.
            </span>
            <br />
            Get the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              Clarity.
            </span>
          </h2>

          <p
            ref={headerSubRef}
            className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto opacity-80 leading-relaxed"
          >
            Upload any legal document, receipt, or agreement. Our AI advocate
            forensically scans for hidden risks instantly.
          </p>
        </div>

        {/* ─── ANIMATION STAGE ─── */}
        <div
          className="relative w-full max-w-2xl h-[320px] md:h-[400px] mx-auto flex items-center justify-center shrink-0"
          style={{ perspective: '1000px' }}
        >

          {/* ░░ DOC 1 — Rental Agreement (tall card) ░░ */}
          <div
            ref={doc1Ref}
            className="absolute w-28 md:w-36 aspect-[3/4] bg-[#0a0a0c] border border-white/10 rounded-2xl p-3 md:p-4 flex flex-col shadow-2xl backdrop-blur-md z-10 will-change-transform"
            style={{ top: '50%', left: '50%' }}
          >
            <FileText size={20} className="text-slate-400 mb-2 shrink-0" />
            <div className="w-1/2 h-1.5 bg-slate-700 rounded-full mb-3" />
            <div className="space-y-1.5 flex-1">
              <div className="w-full h-1 bg-slate-800 rounded-full" />
              <div className="w-5/6 h-1 bg-slate-800 rounded-full" />
              <div className="w-full h-1 bg-slate-800 rounded-full" />
              <div className="w-4/6 h-1 bg-slate-800 rounded-full" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 tracking-wide">
              Rental Agr.
            </span>
          </div>

          {/* ░░ DOC 2 — IRCTC Train Ticket (wide card) ░░ */}
          <div
            ref={doc2Ref}
            className="absolute w-32 md:w-36 h-16 md:h-[72px] bg-[#0a0a0c] border border-white/10 rounded-xl p-2.5 md:p-3 flex shadow-2xl backdrop-blur-md z-10 will-change-transform"
            style={{ top: '50%', left: '50%' }}
          >
            <div className="border-r border-dashed border-slate-700 pr-2.5 mr-2.5 flex items-center justify-center">
              <Ticket size={20} className="text-amber-400/70" />
            </div>
            <div className="flex-1 flex flex-col justify-center gap-1.5">
              <div className="w-full h-1.5 bg-slate-700 rounded-full" />
              <div className="w-1/2 h-1.5 bg-slate-800 rounded-full" />
            </div>
            <span className="absolute bottom-1.5 right-2 text-[7px] font-bold text-slate-500 uppercase">
              IRCTC
            </span>
          </div>

          {/* ░░ DOC 3 — Offer Letter (tall card) ░░ */}
          <div
            ref={doc3Ref}
            className="absolute w-28 md:w-36 aspect-[3/4] bg-[#0a0a0c] border border-white/10 rounded-2xl p-3 md:p-4 flex flex-col shadow-2xl backdrop-blur-md z-10 will-change-transform"
            style={{ top: '50%', left: '50%' }}
          >
            <Briefcase size={20} className="text-indigo-400 mb-2 shrink-0" />
            <div className="w-2/3 h-1.5 bg-slate-700 rounded-full mb-3" />
            <div className="space-y-1.5 flex-1">
              <div className="w-full h-1 bg-slate-800 rounded-full" />
              <div className="w-full h-1 bg-slate-800 rounded-full" />
              <div className="w-3/4 h-1 bg-slate-800 rounded-full" />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 tracking-wide">
              Offer Letter
            </span>
          </div>

          {/* ░░ CENTRAL HUB — AI Bot (rounded square) ░░ */}
          <div
            ref={hubRef}
            className="relative w-36 h-36 md:w-44 md:h-44 rounded-3xl flex items-center justify-center z-20 backdrop-blur-xl overflow-hidden bg-[#0f0f12] border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.15)] will-change-transform"
          >
            {/* Inner gradient sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

            <Bot
              size={52}
              strokeWidth={1.5}
              className="text-indigo-400 relative z-10"
            />

            {/* Laser scan line */}
            <div
              ref={laserRef}
              className="absolute left-0 right-0 h-[3px] bg-indigo-400 z-30"
              style={{
                top: '-10%',
                opacity: 0,
                boxShadow: '0 0 20px 5px rgba(99,102,241,0.5), 0 0 40px 10px rgba(99,102,241,0.2)',
              }}
            />
          </div>

          {/* ░░ VERDICT — Shield badge below hub ░░ */}
          <div
            ref={verdictRef}
            className="absolute z-30 flex items-center gap-2.5 px-5 md:px-6 py-2.5 md:py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] will-change-transform"
            style={{ top: '72%', left: '50%', transform: 'translateX(-50%) scale(0.5)', opacity: 0 }}
          >
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <span className="text-xs md:text-sm font-bold tracking-widest text-emerald-300 uppercase whitespace-nowrap">
              Analysis Complete: Safe
            </span>
          </div>
        </div>

        {/* ─── BOTTOM CTA ─── */}
        <div ref={ctaRef} className="relative z-10 mt-8 shrink-0" style={{ opacity: 0 }}>
          <button
            onClick={() => window.location.href = '/chat'}
            className="group inline-flex items-center gap-4 px-8 py-4 bg-white text-[#050505] rounded-full font-bold text-base md:text-lg hover:bg-indigo-50 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            Start Scanning Now
            <span className="w-7 h-7 rounded-full bg-[#050505] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default AiAdvocateSection;
