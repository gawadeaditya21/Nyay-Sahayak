import { Upload, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      title: "Upload Document",
      description: "Securely upload your PDF or image files. Our system immediately masks sensitive data to protect your identity.",
      icon: <Upload size={24} />,
    },
    {
      title: "Forensic Analysis",
      description: "Our Gemini-powered AI scans every clause, identifying hidden risks and summarizing complex legal jargon.",
      icon: <Cpu size={24} />,
    },
    {
      title: "Get Instant Clarity",
      description: "Review a high-level risk report or chat directly with the document to ask specific legal questions.",
      icon: <ShieldCheck size={24} />,
    },
  ];

  return (
    <section className="py-24 bg-[#0a0a0b] relative overflow-hidden">
      {/* Decorative Line (Desktop Only) */}
      <div className="hidden lg:block absolute top-[60%] left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 opacity-0 animate-fade-up">
          <h2 className="text-indigo-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            The Process
          </h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-white">
            Three Steps to Legal Safety
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="opacity-0 animate-fade-up flex flex-col items-center text-center group"
              style={{ animationDelay: `${(index + 1) * 200}ms` }}
            >
              {/* Step Number & Icon */}
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-[#121215] border border-white/10 rounded-3xl flex items-center justify-center text-indigo-500 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-all duration-500">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full border-4 border-[#0a0a0b] flex items-center justify-center text-white text-xs font-bold">
                  0{index + 1}
                </div>
              </div>

              <h4 className="text-2xl font-bold text-white mb-4">{step.title}</h4>
              <p className="text-slate-400 leading-relaxed max-w-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA for this section */}
        <div className="mt-20 text-center opacity-0 animate-fade-up animation-delay-400">
          <button className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors group">
            Start your first analysis
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;