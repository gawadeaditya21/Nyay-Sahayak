import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCurrentUser, verifyCheckoutSession } from '../services/api';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState('Verifying your subscription...');
    const [error, setError] = useState('');

    useEffect(() => {
        const syncSubscription = async () => {
            try {
                if (sessionId) {
                    await verifyCheckoutSession(sessionId);
                }

                const response = await fetchCurrentUser();
                if (response?.user) {
                    localStorage.setItem('user', JSON.stringify(response.user));
                    setStatus(`Your ${response.user.plan || 'free'} plan is now active.`);
                } else {
                    setStatus('Your subscription is active.');
                }
            } catch (err) {
                setError(err.message || 'Payment completed, but subscription sync needs a refresh.');
                setStatus('Payment completed.');
            }
        };

        syncSubscription();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Payment Successful!</h1>
                <p className="text-gray-600 mb-8">
                    Thank you for your subscription. {status}
                </p>
                {error && <p className="mb-6 text-sm text-amber-700">{error}</p>}
                <Link to="/chat" className="w-full inline-block py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
