import Stripe from "stripe";
import User from "../models/User.js";
import { PLAN_LIMITS } from "../config/planLimits.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing uses centralized config from planLimits.js
const PRICING = {
    plus: {
        priceId: process.env.STRIPE_PLUS_PRICE_ID || "price_dummy_plus",
        name: "Plus Plan",
        amount: PLAN_LIMITS.plus.price     // ₹99.00 (9900 paise)
    },
    pro: {
        priceId: process.env.STRIPE_PRO_PRICE_ID || "price_dummy_pro",
        name: "Pro Plan",
        amount: PLAN_LIMITS.pro.price      // ₹199.00 (19900 paise)
    }
};

async function resolveStripePriceId(planType) {
    const configuredPriceId = PRICING[planType].priceId;

    if (configuredPriceId.startsWith("price_") && !configuredPriceId.startsWith("price_dummy_")) {
        return configuredPriceId;
    }

    if (configuredPriceId.startsWith("prod_")) {
        const prices = await stripe.prices.list({
            product: configuredPriceId,
            active: true,
            limit: 100,
        });

        const monthlyPrice = prices.data.find((price) => price.recurring?.interval === "month");
        if (monthlyPrice) {
            return monthlyPrice.id;
        }

        if (prices.data.length > 0) {
            return prices.data[0].id;
        }

        throw new Error(`No active price found for product ${configuredPriceId}`);
    }

    if (configuredPriceId.startsWith("price_dummy_")) {
        const product = await stripe.products.create({
            name: `Nyay Sahayak ${PRICING[planType].name}`,
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: PRICING[planType].amount,
            currency: 'inr',
            recurring: { interval: 'month' },
        });

        return price.id;
    }

    throw new Error(`Invalid Stripe pricing configuration for plan: ${planType}`);
}

export const createCheckoutSession = async (req, res) => {
    try {
        const { planType } = req.body;
        const userId = req.user.id; // Assuming auth middleware sets req.user

        if (!['plus', 'pro'].includes(planType)) {
            return res.status(400).json({ error: "Invalid plan type." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const stripePriceId = await resolveStripePriceId(planType);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: user.email,
            client_reference_id: userId,
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: userId,
                planType: planType
            },
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: "Failed to create checkout session." });
    }
};

export const stripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        // req.body MUST be a raw buffer here
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook Signature Verification Failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata.userId;
                const planType = session.metadata.planType;

                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        plan: planType,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                        subscriptionStatus: 'active'
                    });
                    console.log(`User ${userId} upgraded to ${planType}`);
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;
                
                if (subscriptionId) {
                    await User.findOneAndUpdate(
                        { stripeSubscriptionId: subscriptionId },
                        { subscriptionStatus: 'active' }
                    );
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;
                
                if (subscriptionId) {
                    await User.findOneAndUpdate(
                        { stripeSubscriptionId: subscriptionId },
                        { subscriptionStatus: 'past_due' }
                    );
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await User.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    { plan: 'free', subscriptionStatus: 'canceled', stripeSubscriptionId: null }
                );
                console.log(`Subscription ${subscription.id} canceled, user downgraded to free.`);
                break;
            }
            case 'customer.subscription.updated': {
                // Catches mid-cycle changes: trial ending, plan changes, payment method updates
                const subscription = event.data.object;
                const statusMap = {
                    active: 'active',
                    past_due: 'past_due',
                    unpaid: 'unpaid',
                    canceled: 'canceled',
                    incomplete: 'incomplete',
                    incomplete_expired: 'canceled',
                    trialing: 'active',
                };
                const mappedStatus = statusMap[subscription.status] || 'none';
                const updateData = { subscriptionStatus: mappedStatus };

                // If subscription is no longer active, downgrade to free
                if (['canceled', 'unpaid', 'incomplete'].includes(mappedStatus)) {
                    updateData.plan = 'free';
                }

                await User.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    updateData
                );
                console.log(`Subscription ${subscription.id} updated → status: ${mappedStatus}`);
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Error processing webhook event:", error);
        return res.status(500).send("Webhook processing error");
    }

    res.status(200).json({ received: true });
};
