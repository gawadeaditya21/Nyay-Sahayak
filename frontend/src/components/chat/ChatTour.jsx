import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../hooks/useOnboarding';
import GuidedTour from '../onboarding/GuidedTour';

/**
 * ChatTour - Guided tour specific to the chat interface
 * 
 * @component
 */
export default function ChatTour() {
  const { t } = useTranslation();
  const { featuresExplored, exploreFeature } = useOnboarding();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Only show if they haven't explored chat yet
    if (!featuresExplored.chat) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [featuresExplored.chat]);

  const steps = [
    {
      target: '[data-tour="chat-input"]',
      title: t('week3.tour.chatInputTitle', 'Type your question'),
      content: t('week3.tour.chatInputDesc', 'Describe your legal problem naturally in any language.')
    },
    {
      target: '[data-tour="chat-voice"]',
      title: t('week3.tour.chatVoiceTitle', 'Use Voice Input'),
      content: t('week3.tour.chatVoiceDesc', 'Don\'t want to type? Just tap the microphone and speak.')
    },
    {
      target: '[data-tour="chat-privacy"]',
      title: t('week3.tour.chatPrivacyTitle', 'Private Mode'),
      content: t('week3.tour.chatPrivacyDesc', 'Toggle this to prevent your chat history from being saved.')
    }
  ];

  const handleClose = () => {
    setShowTour(false);
    exploreFeature('chat'); // Mark chat as explored!
  };

  return (
    <GuidedTour 
      steps={steps}
      isOpen={showTour}
      onClose={handleClose}
      onComplete={handleClose}
    />
  );
}
