import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TourProgress from './TourProgress';

/**
 * TourTooltip - The actual card displaying information pointing to the target
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.step - Step data
 * @param {DOMRect} props.targetRect - Target element bounds
 * @param {number} props.currentIndex - Current step index
 * @param {number} props.totalSteps - Total steps
 * @param {Function} props.onNext - Next step handler
 * @param {Function} props.onPrev - Previous step handler
 * @param {Function} props.onSkip - Skip tour handler
 * @returns {JSX.Element}
 */
export default function TourTooltip({ 
  step, 
  targetRect, 
  currentIndex, 
  totalSteps, 
  onNext, 
  onPrev, 
  onSkip 
}) {
  const { t } = useTranslation();
  const tooltipRef = useRef(null);

  // Auto focus the next button for accessibility
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextBtn = tooltipRef.current?.querySelector('[data-tour-next]');
      if (nextBtn) nextBtn.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const calculatePosition = () => {
    if (!targetRect) {
      // Center screen fallback (e.g. for welcome step without target)
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    // Default positioning logic
    const padding = 16;
    const windowWidth = window.innerWidth;
    const isMobile = windowWidth < 768;

    if (isMobile) {
      // On mobile, dock it to the bottom safely
      return {
        bottom: padding,
        left: padding,
        right: padding,
        width: `calc(100% - ${padding * 2}px)`,
      };
    }

    // Desktop positioning
    let top = targetRect.bottom + padding;
    let left = targetRect.left;

    // Prevent going off right edge
    if (left + 320 > windowWidth) {
      left = windowWidth - 320 - padding;
    }

    // Prevent going off bottom edge
    if (top + 200 > window.innerHeight) {
      top = targetRect.top - 200 - padding;
    }

    return { top, left, width: 320 };
  };

  const style = {
    position: 'fixed',
    ...calculatePosition(),
    zIndex: 9999,
  };

  return (
    <div
      ref={tooltipRef}
      style={style}
      className="flex flex-col gap-3 rounded-2xl bg-[var(--color-bg-surface)] p-5 shadow-2xl ring-1 ring-[var(--color-border-main)] transition-all duration-300 animate-in fade-in zoom-in-95"
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-content"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 id="tour-title" className="text-lg font-bold text-[var(--color-text-main)]">
          {step.title}
        </h3>
        <button
          onClick={onSkip}
          aria-label={t('common.close', 'Close tour')}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X size={16} />
        </button>
      </div>

      <p id="tour-content" className="text-sm text-slate-500 dark:text-slate-400">
        {step.content}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <TourProgress total={totalSteps} current={currentIndex} />
        
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {t('common.back', 'Back')}
            </button>
          )}
          <button
            data-tour-next
            onClick={onNext}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0c]"
          >
            {currentIndex === totalSteps - 1 
              ? t('common.finish', 'Finish') 
              : t('common.next', 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}
