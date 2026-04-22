import React, { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldAlert, CheckCircle2, Zap, AlertTriangle, FileSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

gsap.registerPlugin(ScrollTrigger);

// ─── Color maps for Tailwind dynamic classes ───
const bgActiveMap = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20',
  rose: 'bg-rose-500/10 border-rose-500/20',
  emerald: 'bg-emerald-500/10 border-emerald-500/20',
};

const iconBgMap = {
  indigo: 'bg-indigo-500/20 text-indigo-400',
  rose: 'bg-rose-500/20 text-rose-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
};

const riskTextMap = {
  indigo: 'text-indigo-300',
  rose: 'text-rose-400',
  emerald: 'text-emerald-400',
};

const verdictColorMap = {
  indigo: 'text-indigo-500',
  rose: 'text-rose-400',
  emerald: 'text-emerald-500',
};

// ─── Clause component on the left panel ───
const ClauseBlock = ({ clause, isActive }) => {
  const activeStyle = bgActiveMap[clause.activeColor];
  return (
    <div
      className={`p-4 rounded-xl transition-all duration-700 ease-out border font-mono text-sm leading-loose ${
        isActive
          ? `opacity-100 text-white ${activeStyle}`
          : 'opacity-30 blur-[2px] bg-transparent border-transparent text-slate-500'
      }`}
    >
      {clause.legal}
    </div>
  );
};

// ─── Translation card on the right panel ───
const TranslationCard = ({ clause, isActive, direction }) => {
  const Icon = clause.icon;
  const VerdictIcon = clause.verdictIcon;

  return (
    <div
      className={`absolute w-full max-w-md rounded-3xl p-6 md:p-8 backdrop-blur-xl transition-all duration-700 ease-out shadow-2xl border ${clause.cardBg} ${clause.cardBorder} ${
        isActive
          ? 'opacity-100 scale-100 translate-y-0 translate-x-0 z-10'
          : direction === 'up'
          ? 'opacity-0 scale-95 -translate-y-12 z-0'
          : 'opacity-0 scale-95 translate-x-12 z-0'
      }`}
    >
      {/* Icon + Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${iconBgMap[clause.riskColor]}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white">{clause.title}</h3>
          <p className={`text-sm ${riskTextMap[clause.riskColor]}`}>{clause.risk}</p>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
        {clause.explanation}
        {clause.highlightText && (
          <>
            {' '}
            <span className="text-white font-bold bg-rose-500/20 px-2 py-0.5 rounded">
              {clause.highlightText}
            </span>{' '}
          </>
        )}
        {clause.explanationAfter || ''}
      </p>

      {/* Verdict */}
      <div className={`flex items-center gap-2 text-sm font-medium ${verdictColorMap[clause.riskColor]}`}>
        <VerdictIcon size={16} />
        <span>{clause.verdict}</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
const LegaleseDecoder = () => {
  const { t } = useTranslation();
  const wrapperRef = useRef(null);
  const headerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);
  const clauses = [
    {
      id: 1,
      legal: `"1.1 INDEMNIFICATION: The Party of the Second Part agrees to indemnify, defend, and hold harmless the Party of the First Part from and against any and all claims, damages, liabilities, costs, and expenses (including but not limited to reasonable attorneys' fees)..."`,
      activeColor: 'indigo',
      title: t('landing.legaleseDecoder.clauses.indemnityTitle'),
      risk: t('landing.legaleseDecoder.clauses.indemnityRisk'),
      riskColor: 'indigo',
      icon: Zap,
      explanation: t('landing.legaleseDecoder.clauses.indemnityExplanation'),
      verdict: t('landing.legaleseDecoder.clauses.indemnityVerdict'),
      verdictIcon: CheckCircle2,
      cardBg: 'bg-[#0f0f12]',
      cardBorder: 'border-indigo-500/30',
    },
    {
      id: 2,
      legal: `"2.4 TERMINATION FOR CONVENIENCE: Notwithstanding any other provision in this Agreement, the Company reserves the unilateral right to terminate this contract at its sole discretion, at any time, with or without cause, upon providing a written notice period of no less than twenty-four (24) hours..."`,
      activeColor: 'rose',
      title: t('landing.legaleseDecoder.clauses.terminationTitle'),
      risk: t('landing.legaleseDecoder.clauses.terminationRisk'),
      riskColor: 'rose',
      icon: ShieldAlert,
      explanation: t('landing.legaleseDecoder.clauses.terminationExplanationPrefix'),
      highlightText: t('landing.legaleseDecoder.clauses.terminationHighlight'),
      explanationAfter: t('landing.legaleseDecoder.clauses.terminationExplanationSuffix'),
      verdict: t('landing.legaleseDecoder.clauses.terminationVerdict'),
      verdictIcon: AlertTriangle,
      cardBg: 'bg-[#1a0f12]',
      cardBorder: 'border-rose-500/30',
    },
    {
      id: 3,
      legal: `"5.2 DATA USAGE: User grants the Platform a perpetual, irrevocable, worldwide, royalty-free, and non-exclusive license to reproduce, adapt, modify, translate, publish, publicly perform, publicly display, and distribute any Content which User submits..."`,
      activeColor: 'emerald',
      title: t('landing.legaleseDecoder.clauses.contentTitle'),
      risk: t('landing.legaleseDecoder.clauses.contentRisk'),
      riskColor: 'emerald',
      icon: CheckCircle2,
      explanation: t('landing.legaleseDecoder.clauses.contentExplanation'),
      verdict: t('landing.legaleseDecoder.clauses.contentVerdict'),
      verdictIcon: CheckCircle2,
      cardBg: 'bg-[#0f1a14]',
      cardBorder: 'border-emerald-500/30',
    },
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      // ── Header reveal on scroll ──
      gsap.from(headerRef.current.children, {
        y: 50,
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

      // ── Main pinned ScrollTrigger with progress tracking ──
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: '+=300%',
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          if (p <= 0.33) setActiveStep(1);
          else if (p <= 0.66) setActiveStep(2);
          else setActiveStep(3);
        },
      });

    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full z-10 bg-[#050505]">
      <section className="relative h-screen w-full flex flex-col justify-center overflow-hidden">

        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full h-full flex flex-col py-12 md:py-20 z-10">

          {/* ─── Section Header ─── */}
          <div ref={headerRef} className="mb-8 md:mb-10 text-center md:text-left shrink-0">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
              <FileSearch size={16} />
              <span>{t('landing.legaleseDecoder.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white">
              {t('landing.legaleseDecoder.headlineLine1')}
              <br />
              {t('landing.legaleseDecoder.headlineLine2')}
            </h2>
          </div>

          {/* ─── SPLIT LAYOUT ─── */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 min-h-0">

            {/* ░░ LEFT PANEL — The Complex Document ░░ */}
            <div className="w-full md:w-1/2 h-full bg-[#121215] border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl relative">
              {/* Top/bottom fade masks */}
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#121215] to-transparent z-10 pointer-events-none rounded-t-3xl" />
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#121215] to-transparent z-10 pointer-events-none rounded-b-3xl" />

              {/* Clauses */}
              <div className="relative z-0 h-full flex flex-col justify-center gap-6 md:gap-8">
                {clauses.map((clause) => (
                  <ClauseBlock
                    key={clause.id}
                    clause={clause}
                    isActive={activeStep === clause.id}
                  />
                ))}
              </div>

              {/* Scan line indicator */}
              <div
                className="absolute left-0 w-1 bg-indigo-500 rounded-full z-20 transition-all duration-700 ease-out"
                style={{
                  top: activeStep === 1 ? '15%' : activeStep === 2 ? '42%' : '70%',
                  height: '22%',
                  boxShadow: '0 0 12px rgba(99,102,241,0.6), 0 0 30px rgba(99,102,241,0.2)',
                }}
              />
            </div>

            {/* ░░ RIGHT PANEL — AI Translation Cards ░░ */}
            <div className="w-full md:w-1/2 h-full relative flex items-center justify-center">
              {clauses.map((clause) => (
                <TranslationCard
                  key={clause.id}
                  clause={clause}
                  isActive={activeStep === clause.id}
                  direction={activeStep > clause.id ? 'up' : 'down'}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LegaleseDecoder;
