import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../hooks/useOnboarding';
import GuidedTour from '../onboarding/GuidedTour';

export default function AnalyzeTour() {
  const { t } = useTranslation();
  const { featuresExplored, exploreFeature } = useOnboarding();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!featuresExplored.analyze) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [featuresExplored.analyze]);

  const steps = [
    {
      target: '[data-tour="analyze-upload"]',
      title: t('week3.tour.analyzeUploadTitle', 'Upload Documents'),
      content: t('week3.tour.analyzeUploadDesc', 'Upload PDF or images of legal documents, notices, or contracts.')
    },
    {
      target: '[data-tour="analyze-text"]',
      title: t('week3.tour.analyzeTextTitle', 'Paste Text'),
      content: t('week3.tour.analyzeTextDesc', 'Or simply paste the legal text directly here.')
    },
    {
      target: '[data-tour="analyze-submit"]',
      title: t('week3.tour.analyzeSubmitTitle', 'Get AI Insights'),
      content: t('week3.tour.analyzeSubmitDesc', 'Click to scan for hidden risks, missing clauses, and plain-English explanations.')
    }
  ];

  const handleClose = () => {
    setShowTour(false);
    exploreFeature('analyze');
  };

  return <GuidedTour steps={steps} isOpen={showTour} onClose={handleClose} onComplete={handleClose} />;
}
