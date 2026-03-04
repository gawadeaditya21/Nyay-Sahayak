import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-base text-brand-primary p-6">
      <div className="text-center max-w-3xl">
        <p className="text-brand-accent font-medium uppercase tracking-wider mb-4">
          AI-Powered Legal Assistance
        </p>
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight">
          Introducing <br /> Nyay Sahayak
        </h1>
        <p className="text-xl opacity-80 mb-12 max-w-2xl mx-auto">
          Your personal AI shield against legal fraud. Instantly analyze documents, simplify complex clauses, and detect hidden risks.
        </p>
        
        <Link 
          to="/chat" 
          className="group relative inline-flex items-center gap-2 bg-brand-primary text-brand-base px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-accent transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          Get Started
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="absolute bottom-8 flex gap-6 text-sm opacity-60 font-medium">
        <a href="#" className="hover:text-brand-accent transition">Privacy Policy</a>
        <a href="#" className="hover:text-brand-accent transition">Terms of Service</a>
      </div>
    </div>
  );
}