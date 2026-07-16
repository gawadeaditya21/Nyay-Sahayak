import React from 'react';
import { Link } from 'react-router-dom';

export default function PaymentCancel() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Payment Cancelled</h1>
                <p className="text-gray-600 mb-8">
                    Your checkout process was cancelled. You have not been charged.
                </p>
                <Link to="/pricing" className="w-full inline-block py-3 px-4 bg-[var(--color-bg-main)] hover:bg-gray-800 text-white rounded-lg font-semibold transition">
                    Try Again
                </Link>
            </div>
        </div>
    );
}
