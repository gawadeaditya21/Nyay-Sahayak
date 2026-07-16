/**
 * @file onboardingHelpers.js
 * @description Helper functions to manage onboarding state in localStorage safely
 * @created Week 3 Polish
 */

const ONBOARDING_KEY = 'nyaySahayakOnboarding';

const DEFAULT_STATE = {
  isFirstTimeUser: true,
  hasCompletedTour: false,
  featuresExplored: {
    chat: false,
    analyze: false,
    fir: false,
  },
};

/**
 * Gets the current onboarding state from localStorage
 * @returns {Object} The onboarding state
 */
export const getOnboardingState = () => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) return DEFAULT_STATE;
    
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_STATE, ...parsed };
  } catch (error) {
    console.error('[Onboarding] Error reading state:', error);
    return DEFAULT_STATE;
  }
};

/**
 * Saves the onboarding state to localStorage
 * @param {Object} state - The state to save
 */
export const saveOnboardingState = (state) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Onboarding] Error saving state:', error);
  }
};
