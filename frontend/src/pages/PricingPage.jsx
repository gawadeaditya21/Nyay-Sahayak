import React, { useState } from 'react';
import { createCheckoutSession } from '../services/api';

const PLAN_PRICING = {
    free: { amount: 0, currency: 'INR' },
    plus: { amount: 199, currency: 'INR' },
    pro: { amount: 99, currency: 'INR' },
};

const formatPrice = (amount, currency) =>
    currency === 'INR'
        ? `₹${amount.toLocaleString('en-IN')}`
        : `$${amount.toLocaleString('en-US')}`;

export default function PricingPage() {
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [error, setError] = useState(null);

    const handleUpgrade = async (planType) => {
        setLoadingPlan(planType);
        setError(null);
        try {
            const data = await createCheckoutSession(planType);
            if (data && data.url) {
                window.location.href = data.url; // Redirect to Stripe Checkout
            }
        } catch (err) {
            setError(err.message || 'Failed to initiate checkout. Please try again later.');
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                    Choose Your Plan
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                    Unlock the full power of Nyay Sahayak AI for your legal workflow.
                </p>
                {error && <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
                {/* Free Plan */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col">
                    <h3 className="text-2xl font-semibold text-gray-900">Free</h3>
                    <p className="mt-4 text-gray-500">Perfect for exploring our AI capabilities.</p>
                    <div className="mt-6 text-5xl font-extrabold text-gray-900">
                        {formatPrice(PLAN_PRICING.free.amount, PLAN_PRICING.free.currency)}
                        <span className="text-xl font-medium text-gray-500">/mo</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 5 Document Analyses</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 50 AI Chat Messages</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Standard Support</li>
                    </ul>
                    <button className="mt-8 w-full py-3 px-4 bg-gray-100 text-gray-800 rounded-lg font-semibold cursor-not-allowed">
                        Current Plan
                    </button>
                </div>

                {/* Plus Plan */}
                <div className="bg-white border-2 border-indigo-600 rounded-2xl shadow-lg p-8 flex flex-col relative transform md:-translate-y-4">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold tracking-wide">
                        MOST POPULAR
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">Plus</h3>
                    <p className="mt-4 text-gray-500">For active users who need more power.</p>
                    <div className="mt-6 text-5xl font-extrabold text-gray-900">
                        {formatPrice(PLAN_PRICING.plus.amount, PLAN_PRICING.plus.currency)}
                        <span className="text-xl font-medium text-gray-500">/mo</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 50 Document Analyses</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 500 AI Chat Messages</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Priority Support</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Advanced Document OCR</li>
                    </ul>
                    <button 
                        onClick={() => handleUpgrade('plus')}
                        disabled={loadingPlan === 'plus'}
                        className="mt-8 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition flex justify-center items-center"
                    >
                        {loadingPlan === 'plus' ? 'Processing...' : 'Upgrade to Plus'}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col">
                    <h3 className="text-2xl font-semibold text-gray-900">Pro</h3>
                    <p className="mt-4 text-gray-500">Unlimited power for professional usage.</p>
                    <div className="mt-6 text-5xl font-extrabold text-gray-900">
                        {formatPrice(PLAN_PRICING.pro.amount, PLAN_PRICING.pro.currency)}
                        <span className="text-xl font-medium text-gray-500">/mo</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited Document Analyses</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited AI Chat Messages</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 24/7 Priority Support</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Custom AI Models</li>
                    </ul>
                    <button 
                        onClick={() => handleUpgrade('pro')}
                        disabled={loadingPlan === 'pro'}
                        className="mt-8 w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition flex justify-center items-center"
                    >
                        {loadingPlan === 'pro' ? 'Processing...' : 'Upgrade to Pro'}
                    </button>
                </div>
            </div>
        </div>
    );
}
