import User from "../models/User.js";

export const subscriptionCheck = (requiredPlan = 'free') => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized: User not found in request." });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            const planHierarchy = { free: 0, plus: 1, pro: 2 };
            const userPlanLevel = planHierarchy[user.plan || 'free'];
            const requiredPlanLevel = planHierarchy[requiredPlan];

            // Only enforce subscription status check if they are on a paid plan
            if (userPlanLevel > 0) {
                if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing') {
                    // Downgrade them to free if their subscription is no longer active
                    user.plan = 'free';
                    await user.save();
                    
                    if (requiredPlanLevel > 0) {
                        return res.status(403).json({ 
                            error: "Subscription inactive. Please update your payment details.",
                            code: "SUBSCRIPTION_INACTIVE"
                        });
                    }
                }
            } else if (requiredPlanLevel > 0) {
                return res.status(403).json({ 
                    error: `This feature requires the ${requiredPlan} plan. Please upgrade to continue.`,
                    code: "UPGRADE_REQUIRED"
                });
            }

            // Attach subscription details for downstream usage
            req.subscription = {
                plan: user.plan || 'free',
                level: planHierarchy[user.plan || 'free'],
                limits: getLimitsForPlan(user.plan || 'free')
            };

            next();
        } catch (error) {
            console.error("Subscription Check Error:", error);
            res.status(500).json({ error: "Server error while verifying subscription." });
        }
    };
};

function getLimitsForPlan(plan) {
    switch(plan) {
        case 'pro': return { maxDocs: Infinity, maxChats: Infinity };
        case 'plus': return { maxDocs: 50, maxChats: 500 };
        case 'free':
        default: return { maxDocs: 5, maxChats: 50 };
    }
}
