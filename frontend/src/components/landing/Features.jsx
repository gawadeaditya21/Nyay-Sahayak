import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldAlert, FileSearch, Zap, Lock, Scale, MessageSquare } from 'lucide-react';

const Features = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    // Wait for layout to settle
    setTimeout(() => {
      const ctx = gsap.context(() => {
        // Calculate the track's width
        const trackWidth = trackRef.current.scrollWidth;
        const windowWidth = window.innerWidth;
        
        // Horizontal Scroll Animation
        gsap.to(trackRef.current, {
          x: -(trackWidth - windowWidth + 100), // Scroll all the way to the end
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            pin: true, // Pin the screen here
            scrub: 1,  // Smooth movement tied to scroll
            end: () => "+=" + trackWidth, // Total scroll distance
            invalidateOnRefresh: true
          }
        });
      });
      return () => ctx.revert();
    }, 100);
  }, []);

  const features = [
    { 
      title: "Risk Detection", 
      description: "Instantly identify hidden liabilities and dangerous clauses before you sign.", 
      icon: <ShieldAlert size={32} /> 
    },
    { 
      title: "Legalese Decoder", 
      description: "Translate complex legal jargon into simple, actionable English.", 
      icon: <Scale size={32} /> 
    },
    { 
      title: "Smart Summarization", 
      description: "Get a high-level executive summary of 50+ page documents in just 10 seconds.", 
      icon: <FileSearch size={32} /> 
    },
    { 
      title: "Interactive Analysis", 
      description: "Chat directly with your documents to ask specific questions about obligations or dates.", 
      icon: <MessageSquare size={32} /> 
    },
    { 
      title: "Forensic Precision", 
      description: "Powered by Gemini AI, specifically tuned for structural legal document analysis.", 
      icon: <Zap size={32} /> 
    },
    { 
      title: "Enterprise Security", 
      description: "Your documents are AES-256 protected and masked before analysis to ensure total privacy.", 
      icon: <Lock size={32} /> 
    },
  ];

  return (
    // Initial section height is 100vh, GSAP ScrollTrigger handles auto-height during the pin
    <section ref={sectionRef} className="relative h-screen bg-transparent overflow-hidden flex flex-col justify-center">
      
      {/* Section Header */}
      <div className="px-6 md:px-20 mb-12 shrink-0">
        <h2 className="text-indigo-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
          Powerful Capabilities
        </h2>
        <h3 className="text-4xl md:text-6xl font-serif font-bold text-white max-w-2xl">
          Designed for Legal Clarity.
        </h3>
      </div>

      {/* Horizontal Scrolling Track */}
      <div ref={trackRef} className="flex gap-8 px-6 md:px-20 pb-20 w-[max-content]">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="w-[85vw] md:w-[400px] h-[450px] p-10 rounded-3xl bg-[#0a0a0c]/80 backdrop-blur-md border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-colors flex flex-col justify-between shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                {feature.icon}
              </div>
              <h4 className="text-3xl font-bold text-white mb-4 leading-tight">
                {feature.title}
              </h4>
              <p className="text-slate-400 leading-relaxed text-lg">
                {feature.description}
              </p>
            </div>

            <div className="absolute bottom-8 right-8 text-6xl font-serif font-bold text-white/[0.03] group-hover:text-white/[0.08] transition-colors pointer-events-none">
              0{index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-500 text-sm tracking-widest uppercase">
        <div className="w-12 h-[1px] bg-slate-700" />
        Scroll to explore
        <div className="w-12 h-[1px] bg-slate-700" />
      </div>
    </section>
  );
};

export default Features;