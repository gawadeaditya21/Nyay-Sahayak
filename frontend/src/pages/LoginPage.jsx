import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-base text-brand-primary p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-surface max-w-md w-full">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold mb-2">
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="opacity-80 text-sm">
            {isRegister ? "Sign up to save your legal analysis history." : "Log in to view your past document scans."}
          </p>
        </div>
        
        <form className="space-y-4 mb-6" onSubmit={(e) => e.preventDefault()}>
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">Full Name</label>
              <input type="text" placeholder="John Doe" className="w-full p-3 rounded-lg border border-brand-surface bg-brand-base/30 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Email Address</label>
            <input type="email" placeholder="you@example.com" className="w-full p-3 rounded-lg border border-brand-surface bg-brand-base/30 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Password</label>
            <input type="password" placeholder="••••••••" className="w-full p-3 rounded-lg border border-brand-surface bg-brand-base/30 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
          </div>
          
          <button className="w-full bg-brand-primary text-brand-base py-3 rounded-lg font-bold hover:bg-brand-accent transition shadow-md">
            {isRegister ? "Sign Up" : "Sign In with Email"}
          </button>
        </form>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-brand-surface"></div>
          <span className="flex-shrink-0 mx-4 text-brand-primary/50 text-sm font-medium">Or</span>
          <div className="flex-grow border-t border-brand-surface"></div>
        </div>
        
        <button className="w-full flex items-center justify-center gap-3 bg-white border-2 border-brand-surface text-brand-primary py-3 rounded-lg font-bold hover:bg-brand-base transition mb-6">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        
        <div className="text-center text-sm font-medium">
          <span className="opacity-80">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button onClick={() => setIsRegister(!isRegister)} className="text-brand-accent hover:underline font-bold">
            {isRegister ? "Log In" : "Sign Up"}
          </button>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs font-medium hover:underline opacity-60">
            ← Back to Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}