/**
 * @file OnboardingContext.jsx
 * @description Context provider for managing user onboarding state across the application
 * @created Week 3 Polish
 * @dependencies react, ./onboardingHelpers
 */

import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getOnboardingState, saveOnboardingState } from '../utils/onboardingHelpers';

export const OnboardingContext = createContext(null);

/**
 * OnboardingProvider - Manages the onboarding state for the user
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const OnboardingProvider = ({ children }) => {
  const [onboardingState, setOnboardingState] = useState(getOnboardingState());
  const [isReady, setIsReady] = useState(false);

  // Hydrate state on mount
  useEffect(() => {
    setOnboardingState(getOnboardingState());
    setIsReady(true);
  }, []);

  // Sync to local storage whenever state changes
  useEffect(() => {
    if (isReady) {
      saveOnboardingState(onboardingState);
    }
  }, [onboardingState, isReady]);

  const completeTour = useCallback(() => {
    setOnboardingState(prev => ({
      ...prev,
      isFirstTimeUser: false,
      hasCompletedTour: true
    }));
  }, []);

  const exploreFeature = useCallback((featureId) => {
    setOnboardingState(prev => ({
      ...prev,
      featuresExplored: {
        ...prev.featuresExplored,
        [featureId]: true
      }
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    const resetState = {
      isFirstTimeUser: true,
      hasCompletedTour: false,
      featuresExplored: {
        chat: false,
        analyze: false,
        fir: false,
      }
    };
    setOnboardingState(resetState);
  }, []);

  const value = useMemo(() => ({
    ...onboardingState,
    completeTour,
    exploreFeature,
    resetOnboarding
  }), [onboardingState, completeTour, exploreFeature, resetOnboarding]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
