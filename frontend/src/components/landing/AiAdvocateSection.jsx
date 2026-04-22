import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Bot, Briefcase, FileText, ShieldCheck, Ticket, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

gsap.registerPlugin(ScrollTrigger);

export default function AiAdvocateSection() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const doc1Ref = useRef(null);
  const doc2Ref = useRef(null);
  const doc3Ref = useRef(null);
  const hubRef = useRef(null);
  const laserRef = useRef(null);
  const verdictRef = useRef(null);
  const headerBadgeRef = useRef(null);
  const headerTitleRef = useRef(null);
  const headerSubRef = useRef(null);
  const ctaRef = useRef(null);

  useLayoutEffect(() => {
    if (!wrapperRef.current) return undefined;

    const ctx = gsap.context(() => {
      const docs = [doc1Ref.current, doc2Ref.current, doc3Ref.current].filter(Boolean);

      gsap.from([headerBadgeRef.current, headerTitleRef.current, headerSubRef.current], {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.set(doc1Ref.current, { xPercent: -50, yPercent: -50, x: -220, y: -120, rotation: -12, opacity: 0, scale: 0 });
      gsap.set(doc2Ref.current, { xPercent: -50, yPercent: -50, x: -180, y: 90, rotation: 6, opacity: 0, scale: 0 });
      gsap.set(doc3Ref.current, { xPercent: -50, yPercent: -50, x: 220, y: -90, rotation: 12, opacity: 0, scale: 0 });
      gsap.set(hubRef.current, { scale: 0.8, opacity: 0 });
      gsap.set(laserRef.current, { top: "-10%", opacity: 0 });
      gsap.set(verdictRef.current, { scale: 0.6, opacity: 0, y: 12 });
      gsap.set(ctaRef.current, { opacity: 0, y: 24 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          pin: true,
          scrub: 1,
          start: "top top",
          end: "+=300%",
          anticipatePin: 1,
        },
      });

      tl.to(hubRef.current, { scale: 1, opacity: 1, duration: 0.08 }, 0.02);
      tl.to(doc1Ref.current, { x: -190, y: -85, rotation: -12, opacity: 1, scale: 1, duration: 0.1 }, 0.04);
      tl.to(doc2Ref.current, { x: -140, y: 80, rotation: 6, opacity: 1, scale: 1, duration: 0.1 }, 0.07);
      tl.to(doc3Ref.current, { x: 190, y: -60, rotation: 12, opacity: 1, scale: 1, duration: 0.1 }, 0.1);
      tl.to(hubRef.current, { scale: 1.08, boxShadow: "0 0 60px rgba(79,70,229,0.35)", duration: 0.08 }, 0.3);
      docs.forEach((doc) => {
        tl.to(doc, { x: 0, y: 0, rotation: 0, scale: 0.2, opacity: 0, duration: 0.12 }, 0.35);
      });
      tl.to(hubRef.current, { scale: 1.15, duration: 0.03 }, 0.48);
      tl.to(hubRef.current, { scale: 1, duration: 0.04 }, 0.52);
      tl.to(laserRef.current, { opacity: 1, duration: 0.02 }, 0.55);
      tl.fromTo(laserRef.current, { top: "-10%" }, { top: "110%", duration: 0.16, ease: "none" }, 0.56);
      tl.to(laserRef.current, { opacity: 0, duration: 0.02 }, 0.72);
      tl.to(hubRef.current, { borderColor: "rgba(16,185,129,0.5)", boxShadow: "0 0 60px rgba(16,185,129,0.25)", duration: 0.06 }, 0.76);
      tl.to(verdictRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.08 }, 0.8);
      tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.06 }, 0.88);
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-10 w-full bg-[#050505]">
      <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] max-w-[800px] max-h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 mb-12 max-w-3xl shrink-0 text-center">
          <div ref={headerBadgeRef} className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
            <Zap size={14} className="animate-pulse" />
            <span>{t("landing.aiAdvocate.badge")}</span>
          </div>

          <h2 ref={headerTitleRef} className="mb-5 text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl font-serif">
            {t("landing.aiAdvocate.headlinePrefix")} <span className="bg-linear-to-r from-slate-400 to-slate-200 bg-clip-text text-transparent">{t("landing.aiAdvocate.headlineChaos")}</span>
            <br />
            {t("landing.aiAdvocate.headlineGetThe")} <span className="bg-linear-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">{t("landing.aiAdvocate.headlineClarity")}</span>
          </h2>

          <p ref={headerSubRef} className="mx-auto max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            {t("landing.aiAdvocate.subcopy")}
          </p>
        </div>

        <div className="relative mx-auto flex h-[320px] w-full max-w-2xl items-center justify-center shrink-0" style={{ perspective: "1000px" }}>
          <div ref={doc1Ref} className="absolute z-10 flex aspect-[3/4] w-28 flex-col rounded-2xl border border-white/10 bg-[#0a0a0c] p-3 shadow-2xl backdrop-blur-md md:w-36 md:p-4">
            <FileText size={20} className="mb-2 shrink-0 text-slate-400" />
            <div className="mb-3 h-1.5 w-1/2 rounded-full bg-slate-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-1 w-full rounded-full bg-slate-800" />
              <div className="h-1 w-5/6 rounded-full bg-slate-800" />
              <div className="h-1 w-full rounded-full bg-slate-800" />
              <div className="h-1 w-4/6 rounded-full bg-slate-800" />
            </div>
            <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">{t("landing.aiAdvocate.rentalAgreement")}</span>
          </div>

          <div ref={doc2Ref} className="absolute z-10 flex h-16 w-32 rounded-xl border border-white/10 bg-[#0a0a0c] p-2.5 shadow-2xl backdrop-blur-md md:h-[72px] md:w-36 md:p-3">
            <div className="mr-2.5 flex items-center justify-center border-r border-dashed border-slate-700 pr-2.5">
              <Ticket size={20} className="text-amber-400/70" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-700" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-800" />
            </div>
            <span className="absolute bottom-1.5 right-2 text-[7px] font-bold uppercase text-slate-500">IRCTC</span>
          </div>

          <div ref={doc3Ref} className="absolute z-10 flex aspect-[3/4] w-28 flex-col rounded-2xl border border-white/10 bg-[#0a0a0c] p-3 shadow-2xl backdrop-blur-md md:w-36 md:p-4">
            <Briefcase size={20} className="mb-2 shrink-0 text-indigo-400" />
            <div className="mb-3 h-1.5 w-2/3 rounded-full bg-slate-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-1 w-full rounded-full bg-slate-800" />
              <div className="h-1 w-full rounded-full bg-slate-800" />
              <div className="h-1 w-3/4 rounded-full bg-slate-800" />
            </div>
            <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">{t("landing.aiAdvocate.offerLetter")}</span>
          </div>

          <div ref={hubRef} className="relative z-20 flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border border-indigo-500/30 bg-[#0f0f12] shadow-[0_0_50px_rgba(79,70,229,0.15)] backdrop-blur-xl md:h-44 md:w-44">
            <div className="absolute inset-0 bg-linear-to-b from-indigo-500/10 to-transparent" />
            <Bot size={52} strokeWidth={1.5} className="relative z-10 text-indigo-400" />
            <div ref={laserRef} className="absolute left-0 right-0 z-30 h-[3px] bg-indigo-400" style={{ top: "-10%", opacity: 0, boxShadow: "0 0 20px 5px rgba(99,102,241,0.5), 0 0 40px 10px rgba(99,102,241,0.2)" }} />
          </div>

          <div ref={verdictRef} className="absolute left-1/2 top-[72%] z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-xl">
            <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
            <span className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-emerald-300 md:text-sm">{t("landing.aiAdvocate.analysisCompleteSafe")}</span>
          </div>
        </div>

        <div ref={ctaRef} className="relative z-10 mt-8 shrink-0">
          <button onClick={() => (window.location.href = "/chat")} className="group inline-flex items-center gap-4 rounded-full bg-white px-8 py-4 text-base font-bold text-[#050505] transition-colors hover:bg-indigo-50 md:text-lg">
            {t("landing.aiAdvocate.cta")}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#050505] text-white transition-transform group-hover:translate-x-1">
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
