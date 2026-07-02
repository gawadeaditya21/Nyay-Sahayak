import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Crown, Shield, Sparkles, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../services/api';

const PLAN_PRICING = {
    free: { amount: 0, currency: 'INR' },
    plus: { amount: 99, currency: 'INR' },
    pro: { amount: 199, currency: 'INR' },
};

const PLAN_META = {
    free: {
        name: 'Free',
        description: 'Explore core AI tools with a lightweight starter plan.',
        features: ['5 Document Analyses', '50 AI Chat Messages', 'Standard Support'],
        buttonLabel: 'Current Plan',
        buttonVariant: 'current',
        icon: Shield,
    },
    plus: {
        name: 'Plus',
        description: 'For active users who want faster legal workflow momentum.',
        features: ['50 Document Analyses', '500 AI Chat Messages', 'Priority Support', 'Advanced OCR'],
        buttonLabel: 'Upgrade to Plus',
        buttonVariant: 'gradient',
        icon: Sparkles,
        badge: 'Most Popular',
        highlighted: true,
    },
    pro: {
        name: 'Pro',
        description: 'Unlimited power for professionals handling serious volume.',
        features: ['Unlimited Document Analyses', 'Unlimited AI Chat Messages', '24/7 Priority Support', 'Custom AI Models'],
        buttonLabel: 'Upgrade to Pro',
        buttonVariant: 'dark',
        icon: Crown,
    },
};

const formatPrice = (amount, currency) =>
    currency === 'INR'
        ? `₹${amount.toLocaleString('en-IN')}`
        : `$${amount.toLocaleString('en-US')}`;

function FeatureItem({ children }) {
    return (
        <li className="flex items-start gap-3 text-sm leading-6 text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>{children}</span>
        </li>
    );
}

function PlanCard({ planKey, loadingPlan, onUpgrade }) {
    const plan = PLAN_META[planKey];
    const pricing = PLAN_PRICING[planKey];
    const Icon = plan.icon;
    const isLoading = loadingPlan === planKey;
    const isCurrent = plan.buttonVariant === 'current';

    const cardInner = (
        <article
            className={[
                'group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-[#111318] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl md:p-8',
                plan.highlighted
                    ? 'border-transparent ring-1 ring-white/10'
                    : 'border-white/10 hover:border-white/20',
            ].join(' ')}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg shadow-black/20 transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5 text-indigo-300" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-white">{plan.name}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">{plan.description}</p>
                </div>

                {plan.badge ? (
                    <span className="inline-flex items-center rounded-full border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200 shadow-lg shadow-fuchsia-500/10">
                        {plan.badge}
                    </span>
                ) : null}
            </div>

            <div className="relative z-10 mt-8 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-white">{formatPrice(pricing.amount, pricing.currency)}</span>
                <span className="pb-1 text-sm font-medium text-slate-400">/mo</span>
            </div>

            <ul className="relative z-10 mt-8 space-y-4">
                {plan.features.map((feature) => (
                    <FeatureItem key={feature}>{feature}</FeatureItem>
                ))}
            </ul>

            <div className="relative z-10 mt-8 pt-2">
                {isCurrent ? (
                    <button
                        type="button"
                        disabled
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-800 px-5 py-3.5 text-sm font-semibold text-slate-300 shadow-lg shadow-black/20"
                    >
                        {plan.buttonLabel}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onUpgrade(planKey)}
                        disabled={isLoading}
                        className={[
                            'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70',
                            plan.buttonVariant === 'gradient'
                                ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                                : 'bg-slate-950 ring-1 ring-white/10 shadow-lg shadow-black/40 hover:ring-indigo-400/40',
                        ].join(' ')}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>{isLoading ? 'Processing...' : plan.buttonLabel}</span>
                        {!isLoading ? <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" /> : null}
                    </button>
                )}
            </div>
        </article>
    );

    if (plan.highlighted) {
        return (
            <div className="rounded-[1.9rem] bg-gradient-to-br from-fuchsia-500/60 via-violet-500/35 to-sky-500/50 p-px shadow-[0_20px_80px_rgba(99,102,241,0.18)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_100px_rgba(99,102,241,0.24)]">
                {cardInner}
            </div>
        );
    }

    return cardInner;
}

export default function PricingPage() {
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [error, setError] = useState(null);

    const handleUpgrade = async (planType) => {
        setLoadingPlan(planType);
        setError(null);

        try {
            const data = await createCheckoutSession(planType);

            if (data?.url) {
                window.location.href = data.url;
                return;
            }

            throw new Error('Checkout session could not be created. Please try again.');
        } catch (err) {
            setError(err.message || 'Failed to initiate checkout. Please try again later.');
            setLoadingPlan(null);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#050816_50%,#020617_100%)]" />
            <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

            <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="mb-14 max-w-3xl text-center">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 shadow-lg shadow-black/20 backdrop-blur-xl">
                        <Sparkles className="h-4 w-4 text-indigo-300" />
                        Premium plans for legal workflows
                    </div>

                    <h1 className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
                        Choose Your Plan
                    </h1>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                        Unlock the full power of Nyay Sahayak AI for your legal workflow.
                    </p>

                    {error ? (
                        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 shadow-lg shadow-rose-950/20 backdrop-blur-xl">
                            {error}
                        </div>
                    ) : null}
                </div>

                <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 lg:gap-7">
                    <PlanCard planKey="free" loadingPlan={loadingPlan} onUpgrade={handleUpgrade} />
                    <PlanCard planKey="plus" loadingPlan={loadingPlan} onUpgrade={handleUpgrade} />
                    <PlanCard planKey="pro" loadingPlan={loadingPlan} onUpgrade={handleUpgrade} />
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Secure Stripe checkout</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Cancel anytime</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Built for productivity</span>
                </div>
            </section>
        </div>
    );
}