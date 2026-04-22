import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, CheckCircle2, FileSearch, ShieldAlert, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

gsap.registerPlugin(ScrollTrigger);

const ClauseBlock = ({ clause, isActive }) => (
  <div className={`rounded-xl border p-4 font-mono text-sm leading-loose transition-all duration-700 ease-out ${isActive ? `border-white/10 ${clause.activeBg} text-white opacity-100` : "border-transparent bg-transparent text-slate-500 opacity-30 blur-[2px]"}`}>
    {clause.legal}
  </div>
);

const TranslationCard = ({ clause, isActive, direction }) => {
  const Icon = clause.icon;
  const VerdictIcon = clause.verdictIcon;

  return (
    <div className={`absolute w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transition-all duration-700 ease-out md:p-8 ${clause.cardBg} ${clause.cardBorder} ${isActive ? "z-10 scale-100 translate-x-0 translate-y-0 opacity-100" : direction === "up" ? "z-0 -translate-y-12 scale-95 opacity-0" : "z-0 translate-x-12 scale-95 opacity-0"}`}>
      <div className="mb-6 flex items-center gap-3">
        <div className={`rounded-xl p-3 ${clause.iconBg}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white md:text-xl">{clause.title}</h3>
          <p className={`text-sm ${clause.riskText}`}>{clause.risk}</p>
        </div>
      </div>

      <p className="mb-6 text-base leading-relaxed text-slate-300 md:text-lg">
        {clause.explanation}
        {clause.highlightText ? <><span className="rounded bg-rose-500/20 px-2 py-0.5 font-bold text-white">{clause.highlightText}</span>{" "}{clause.explanationAfter}</> : null}
      </p>

      <div className={`flex items-center gap-2 text-sm font-medium ${clause.verdictText}`}>
        <VerdictIcon size={16} />
        <span>{clause.verdict}</span>
      </div>
    </div>
  );
};

export default function LegaleseDecoder() {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const headerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);

  const clauses = [
    {
      id: 1,
      legal: `"1.1 INDEMNIFICATION: The Party of the Second Part agrees to indemnify, defend, and hold harmless the Party of the First Part from and against any and all claims, damages, liabilities, costs, and expenses..."`,
      activeBg: "bg-indigo-500/10",
      title: t("landing.legaleseDecoder.clauses.indemnityTitle"),
      risk: t("landing.legaleseDecoder.clauses.indemnityRisk"),
      riskText: "text-indigo-300",
      icon: Zap,
      explanation: t("landing.legaleseDecoder.clauses.indemnityExplanation"),
      verdict: t("landing.legaleseDecoder.clauses.indemnityVerdict"),
      verdictIcon: CheckCircle2,
      verdictText: "text-indigo-500",
      iconBg: "bg-indigo-500/20 text-indigo-400",
      cardBg: "bg-[#0f0f12]",
      cardBorder: "border-indigo-500/30",
    },
    {
      id: 2,
      legal: `"2.4 TERMINATION FOR CONVENIENCE: Notwithstanding any other provision in this Agreement, the Company reserves the unilateral right to terminate this contract at its sole discretion..."`,
      activeBg: "bg-rose-500/10",
      title: t("landing.legaleseDecoder.clauses.terminationTitle"),
      risk: t("landing.legaleseDecoder.clauses.terminationRisk"),
      riskText: "text-rose-400",
      icon: ShieldAlert,
      explanation: t("landing.legaleseDecoder.clauses.terminationExplanationPrefix"),
      highlightText: t("landing.legaleseDecoder.clauses.terminationHighlight"),
      explanationAfter: t("landing.legaleseDecoder.clauses.terminationExplanationSuffix"),
      verdict: t("landing.legaleseDecoder.clauses.terminationVerdict"),
      verdictIcon: AlertTriangle,
      verdictText: "text-rose-400",
      iconBg: "bg-rose-500/20 text-rose-400",
      cardBg: "bg-[#1a0f12]",
      cardBorder: "border-rose-500/30",
    },
    {
      id: 3,
      legal: `"5.2 DATA USAGE: User grants the Platform a perpetual, irrevocable, worldwide, royalty-free, and non-exclusive license to reproduce, adapt, modify, translate, publish, publicly perform, publicly display, and distribute any Content..."`,
      activeBg: "bg-emerald-500/10",
      title: t("landing.legaleseDecoder.clauses.contentTitle"),
      risk: t("landing.legaleseDecoder.clauses.contentRisk"),
      riskText: "text-emerald-400",
      icon: CheckCircle2,
      explanation: t("landing.legaleseDecoder.clauses.contentExplanation"),
      verdict: t("landing.legaleseDecoder.clauses.contentVerdict"),
      verdictIcon: CheckCircle2,
      verdictText: "text-emerald-500",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      cardBg: "bg-[#0f1a14]",
      cardBorder: "border-emerald-500/30",
    },
  ];

  useLayoutEffect(() => {
    if (!wrapperRef.current) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(headerRef.current.children, {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      ScrollTrigger.create({
        trigger: wrapperRef.current,
        pin: true,
        scrub: 1,
        start: "top top",
        end: "+=300%",
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          if (progress <= 0.33) setActiveStep(1);
          else if (progress <= 0.66) setActiveStep(2);
          else setActiveStep(3);
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative z-10 w-full bg-[#050505]">
      <section className="relative flex h-screen w-full flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vw] w-[80vw] max-h-225 max-w-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-900/10 blur-[120px]" />

        <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-6 py-12 md:py-20">
          <div ref={headerRef} className="mb-8 shrink-0 text-center md:mb-10 md:text-left">
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
              <FileSearch size={16} />
              <span>{t("landing.legaleseDecoder.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold text-white md:text-5xl font-serif">
              {t("landing.legaleseDecoder.headlineLine1")}<br />{t("landing.legaleseDecoder.headlineLine2")}
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row md:gap-8">
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[#121215] p-6 shadow-2xl md:w-1/2 md:p-8">
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-20 w-full rounded-t-3xl bg-linear-to-b from-[#121215] to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-20 w-full rounded-b-3xl bg-linear-to-t from-[#121215] to-transparent" />

              <div className="relative z-0 flex h-full flex-col justify-center gap-6 md:gap-8">
                {clauses.map((clause) => (
                  <ClauseBlock key={clause.id} clause={clause} isActive={activeStep === clause.id} />
                ))}
              </div>

              <div className="absolute left-0 z-20 w-1 rounded-full bg-indigo-500 transition-all duration-700 ease-out" style={{ top: activeStep === 1 ? "15%" : activeStep === 2 ? "42%" : "70%", height: "22%", boxShadow: "0 0 12px rgba(99,102,241,0.6), 0 0 30px rgba(99,102,241,0.2)" }} />
            </div>

            <div className="relative flex h-full w-full items-center justify-center md:w-1/2">
              {clauses.map((clause) => (
                <TranslationCard key={clause.id} clause={clause} isActive={activeStep === clause.id} direction={activeStep > clause.id ? "up" : "down"} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
