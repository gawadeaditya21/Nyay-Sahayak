import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Scale, FileSearch, ShieldCheck } from 'lucide-react';

/**
 * AILoadingIndicator - A beautifully polished loading state for AI processing
 * Shows bouncing dots, glowing effects, and rotating legal tips.
 * 
 * @component
 */
export default function AILoadingIndicator({ text }) {
  const { t } = useTranslation();
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    { text: t('week3.loading.tip1', 'Reading through legal clauses...'), icon: Scale },
    { text: t('week3.loading.tip2', 'Cross-referencing Indian Laws...'), icon: FileSearch },
    { text: t('week3.loading.tip3', 'Ensuring your privacy is protected...'), icon: ShieldCheck },
    { text: t('week3.loading.tip4', 'Generating simple explanations...'), icon: Sparkles },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [tips.length]);

  const Icon = tips[tipIndex].icon;

  return (
    <div className="flex max-w-[85%] gap-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]">
        <Sparkles size={18} className="animate-pulse" />
      </div>
      <div className="flex flex-col gap-2 rounded-3xl rounded-tl-none border border-indigo-500/30 bg-indigo-500/10 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-semibold text-indigo-300">{text || t('common.processing')}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-indigo-200/80">
          <Icon size={12} className="opacity-70" />
          <span className="animate-pulse">{tips[tipIndex].text}</span>
        </div>
      </div>
    </div>
  );
}
