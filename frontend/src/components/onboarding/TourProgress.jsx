import React from 'react';

/**
 * TourProgress - Progress indicator dots for the guided tour
 * 
 * @component
 * @param {Object} props
 * @param {number} props.total - Total number of steps
 * @param {number} props.current - Current step index
 * @returns {JSX.Element}
 */
export default function TourProgress({ total, current }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current + 1} of ${total}`} role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            idx === current
              ? 'w-4 bg-indigo-600'
              : idx < current
              ? 'w-1.5 bg-indigo-300'
              : 'w-1.5 bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}
