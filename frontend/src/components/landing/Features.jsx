import { ShieldAlert, FileSearch, Zap, Lock, Scale, MessageSquare } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: "Risk Detection",
      description: "Instantly identify predatory clauses, hidden liabilities, and high-risk terms before you sign.",
      icon: <ShieldAlert className="text-indigo-500" size={24} />,
    },
    {
      title: "Legalese Decoder",
      description: "Translates complex legal jargon into plain, actionable English using advanced NLP.",
      icon: <Scale className="text-indigo-500" size={24} />,
    },
    {
      title: "Smart Summarization",
      description: "Get a high-level executive summary of 50+ page documents in under 10 seconds.",
      icon: <FileSearch className="text-indigo-500" size={24} />,
    },
    {
      title: "Interactive Analysis",
      description: "Chat directly with your documents to ask specific questions about obligations or dates.",
      icon: <MessageSquare className="text-indigo-500" size={24} />,
    },
    {
      title: "Forensic Precision",
      description: "Powered by Gemini AI, specifically tuned for legal document structural analysis.",
      icon: <Zap className="text-indigo-500" size={24} />,
    },
    {
      title: "Enterprise Security",
      description: "Your documents are AES-256 protected and masked before analysis to ensure total privacy.",
      icon: <Lock className="text-indigo-500" size={24} />,
    },
  ];

  return (
    <section className="features py-24 bg-[#0a0a0b] px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 opacity-0 animate-fade-up">
          <h2 className="text-indigo-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            Powerful Capabilities
          </h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-white">
            Designed for Legal Clarity
          </h3>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`opacity-0 animate-fade-up p-8 rounded-2xl bg-[#121215] border border-white/5 hover:border-indigo-500/30 transition-all group`}
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h4>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;