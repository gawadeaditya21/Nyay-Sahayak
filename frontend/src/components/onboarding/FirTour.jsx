import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../hooks/useOnboarding';
import GuidedTour from '../onboarding/GuidedTour';

export default function FirTour() {
  const { t } = useTranslation();
  const { featuresExplored, exploreFeature } = useOnboarding();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!featuresExplored.fir) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [featuresExplored.fir]);

  const steps = [
    {
      target: '[data-tour="fir-input"]',
      title: t('week3.tour.firInputTitle', 'Describe the Incident'),
      content: t('week3.tour.firInputDesc', 'Write what happened in your own words. Don\'t worry about legal terms.')
    },
    {
      target: '[data-tour="fir-generate"]',
      title: t('week3.tour.firGenerateTitle', 'Generate FIR'),
      content: t('week3.tour.firGenerateDesc', 'Our AI will automatically translate and format it into an official police complaint.')
    }
  ];

  const handleClose = () => {
    setShowTour(false);
    exploreFeature('fir');
  };

  return <GuidedTour steps={steps} isOpen={showTour} onClose={handleClose} onComplete={handleClose} />;
}
