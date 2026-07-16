/**
 * @file useOnboarding.js
 * @description Custom hook to access onboarding state and actions safely
 * @created Week 3 Polish
 */

import { useContext } from 'react';
import { OnboardingContext } from '../context/OnboardingContext';

/**
 * useOnboarding - Hook to use the OnboardingContext
 * 
 * @returns {Object} Onboarding state and actions
 * @throws {Error} If used outside of OnboardingProvider
 */
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  
  if (context === null) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
};
