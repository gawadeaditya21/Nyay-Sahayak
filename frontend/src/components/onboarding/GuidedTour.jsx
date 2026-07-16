import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import TourOverlay from './TourOverlay';
import TourTooltip from './TourTooltip';

/**
 * GuidedTour - Main interactive tour component
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects {target, title, content}
 * @param {boolean} props.isOpen - Whether the tour is currently open
 * @param {Function} props.onClose - Handler for when tour is skipped/closed
 * @param {Function} props.onComplete - Handler for when tour is finished
 * @returns {JSX.Element|null}
 */
export default function GuidedTour({ steps, isOpen, onClose, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !steps || !steps[currentIndex]) return;
    
    const targetSelector = steps[currentIndex].target;
    if (!targetSelector) {
      setTargetRect(null); // Centered modal mode if no target
      return;
    }

    const element = document.querySelector(targetSelector);
    if (element) {
      // Smooth scroll to ensure element is visible
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Small timeout to allow scrolling to finish before calculating bounds
      setTimeout(() => {
        setTargetRect(element.getBoundingClientRect());
      }, 300);
    } else {
      console.warn(`[Tour] Target element ${targetSelector} not found`);
      setTargetRect(null);
    }
  }, [currentIndex, isOpen, steps]);

  useEffect(() => {
    updateTargetRect();

    // Re-calculate on resize or scroll
    const handleScrollResize = () => {
      requestAnimationFrame(() => {
        if (steps && steps[currentIndex]?.target) {
          const el = document.querySelector(steps[currentIndex].target);
          if (el) setTargetRect(el.getBoundingClientRect());
        }
      });
    };

    window.addEventListener('resize', handleScrollResize);
    window.addEventListener('scroll', handleScrollResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleScrollResize);
      window.removeEventListener('scroll', handleScrollResize);
    };
  }, [updateTargetRect, currentIndex, steps]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, steps, onClose]); // Added onClose to avoid stale closure

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (onComplete) onComplete();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!isClient || !isOpen || !steps || steps.length === 0) return null;

  return createPortal(
    <>
      <TourOverlay targetRect={targetRect} onOverlayClick={onClose} />
      <TourTooltip
        step={steps[currentIndex]}
        targetRect={targetRect}
        currentIndex={currentIndex}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={onClose}
      />
    </>,
    document.body
  );
}
