/**
 * Rate Limiting Tier Configuration
 * Yeh file sabhi users ke subscription tiers aur unke limits define karti hai.
 * Exact limits as per the Nyay-Sahayak specs.
 */

export const TIERS = {
  GUEST: {
    name: 'GUEST',
    displayName: 'Guest User',
    tracking: 'ip',  // Track by IP address for non-logged in users
    limits: {
      chat: {
        perHour: 5,
        perDay: 10
      },
      analysis: {
        perHour: 1,
        perDay: 1
      },
      fir: {
        perHour: 1,
        perDay: 1
      },
      voice: {
        perDay: 0  // Not allowed
      }
    },
    upgradeMessage: 'Sign up for free to get 20 chats/hour!'
  },
  
  FREE: {
    name: 'FREE',
    displayName: 'Free User',
    tracking: 'user',  // Track by user ID
    limits: {
      chat: {
        perHour: 20,
        perDay: 100
      },
      analysis: {
        perHour: 2,
        perDay: 3
      },
      fir: {
        perHour: 1,
        perDay: 2
      },
      voice: {
        perDay: 300  // 5 minutes in seconds
      }
    },
    upgradeMessage: 'Upgrade to Pro for 100 chats/hour!',
    upgradeUrl: '/pricing'
  },
  
  PRO: {
    name: 'PRO',
    displayName: 'Pro User',
    tracking: 'user',
    price: '₹99/month',
    limits: {
      chat: {
        perHour: 100,
        perDay: 500
      },
      analysis: {
        perHour: 10,
        perDay: 20
      },
      fir: {
        perHour: 5,
        perDay: 10
      },
      voice: {
        perDay: 1800  // 30 minutes
      }
    },
    priority: true,
    upgradeMessage: 'Upgrade to Plus for unlimited access!',
    upgradeUrl: '/pricing'
  },
  
  PLUS: {
    name: 'PLUS',
    displayName: 'Plus User',
    tracking: 'user',
    price: '₹499/month',
    limits: {
      chat: {
        perHour: 500,
        perDay: -1  // -1 means unlimited
      },
      analysis: {
        perHour: -1,
        perDay: -1
      },
      fir: {
        perHour: -1,
        perDay: -1
      },
      voice: {
        perDay: -1
      }
    },
    priority: true,
    features: ['unlimited_access', 'priority_queue', 'advanced_templates']
  },
  
  ENTERPRISE: {
    name: 'ENTERPRISE',
    displayName: 'Enterprise User',
    tracking: 'user',
    price: 'Custom',
    limits: {
      chat: { perHour: -1, perDay: -1 },
      analysis: { perHour: -1, perDay: -1 },
      fir: { perHour: -1, perDay: -1 },
      voice: { perDay: -1 }
    },
    priority: true,
    bypassRateLimit: true,
    features: ['everything_unlimited', 'sla', 'dedicated_support']
  },
  
  ADMIN: {
    name: 'ADMIN',
    displayName: 'Administrator',
    tracking: 'user',
    limits: {
      chat: { perHour: -1, perDay: -1 },
      analysis: { perHour: -1, perDay: -1 },
      fir: { perHour: -1, perDay: -1 },
      voice: { perDay: -1 }
    },
    bypassRateLimit: true
  }
};

/**
 * Helper to get tier by name safely (default to GUEST)
 */
export const getTierConfig = (tierName) => {
  const upperTier = tierName ? tierName.toUpperCase() : 'GUEST';
  return TIERS[upperTier] || TIERS.GUEST;
};
