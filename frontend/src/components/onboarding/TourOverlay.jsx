import React from 'react';

/**
 * TourOverlay - Creates a spotlight effect around the target element
 * 
 * @component
 * @param {Object} props
 * @param {DOMRect|null} props.targetRect - The bounding box of the target element
 * @param {Function} props.onOverlayClick - Optional click handler if user clicks outside
 * @returns {JSX.Element}
 */
export default function TourOverlay({ targetRect, onOverlayClick }) {
  if (!targetRect) {
    return (
      <div 
        className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300"
        onClick={onOverlayClick}
      />
    );
  }

  // Add some padding to the spotlight for visual breathing room
  const padding = 8;
  const borderRadius = 12;

  const spotlightStyle = {
    position: 'fixed',
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: borderRadius,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[9997] cursor-pointer" 
        onClick={onOverlayClick} 
        aria-hidden="true"
      />
      <div style={spotlightStyle} aria-hidden="true" />
    </>
  );
}
