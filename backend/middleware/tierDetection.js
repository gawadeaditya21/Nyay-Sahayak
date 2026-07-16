/**
 * Tier Detection Middleware
 * Yeh middleware existing authentication (JWT) ke baad chalega 
 * aur determine karega ki user kaunse tier mein aata hai.
 */
export const detectUserTier = (req, res, next) => {
  try {
    // 1. Agar user logged in nahi hai (no req.user), usko GUEST bana do
    if (!req.user) {
      req.user = { subscriptionTier: 'GUEST' };
      return next();
    }

    // 2. Agar user ADMIN hai, toh unko priority access do
    if (req.user.role === 'admin' || req.user.role === 'ADMIN') {
      req.user.subscriptionTier = 'ADMIN';
      return next();
    }

    // 3. User ki tier unke 'subscriptionTier' ya purane 'plan' field se nikalo
    // This ensures backward compatibility (NO BREAKING CHANGES)
    const rawTier = req.user.subscriptionTier || req.user.plan || 'FREE';
    
    // 4. Config array ke sath match karne ke liye UpperCase format karo
    req.user.subscriptionTier = rawTier.toUpperCase();
    
    next();
  } catch (error) {
    console.error('[TierDetection] Error ❌:', error.message);
    
    // Fallback: Taki app crash na ho
    if (!req.user) req.user = {};
    req.user.subscriptionTier = 'GUEST';
    next();
  }
};
