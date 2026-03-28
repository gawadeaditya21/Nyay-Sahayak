import { Gavel, ShieldCheck, Zap, ArrowRight, MousePointerClick } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0a0a0b] px-6">
      {/* Background Decorative Gradient - Matching ChatPage Depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge - Consistent with ChatPage Indigo Accents */}
        <div className="opacity-0 animate-fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
          <Zap size={14} />
          <span>Next-Gen Legal Intelligence</span>
        </div>

        {/* Main Heading - Using Serif for Professional Legal Aesthetic */}
        <h1 className="opacity-0 animate-fade-up animation-delay-200 text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.1]">
          Don't just read contracts. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
            Forensically analyze them.
          </span>
        </h1>

        {/* Subheading - Matches Slate-400 Text from ChatPage */}
        <p className="opacity-0 animate-fade-up animation-delay-400 text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Nyay Sahayak uses advanced AI to strip away legal complexity, 
          identifying hidden risks and predatory clauses in seconds.
        </p>

        {/* CTA Buttons - Consistent with 'Start New Analysis' Button Style */}
        <div className="opacity-0 animate-fade-up animation-delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="group px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95" onClick={() => navigate('/chat')}>
            Get Started Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="px-8 py-4 bg-white/5 text-slate-300 border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-all active:scale-95">
            Explore Features
          </button>
        </div>

        {/* Trust Markers - Utilizing Icons from ChatPage for Continuity */}
        <div className="opacity-0 animate-fade-up animation-delay-400 mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 opacity-50">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={18} />
            <span>AES-256 Protected</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Gavel size={18} />
            <span>Nyay Sahayak v1.0</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;