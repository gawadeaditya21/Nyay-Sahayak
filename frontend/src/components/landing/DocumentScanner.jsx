import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScanSearch } from 'lucide-react';

const DocumentScanner = () => {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const laserRef = useRef(null);
  const decodedTextRef = useRef(null);

  useEffect(() => {
    // GSAP context for clean memory management
    const ctx = gsap.context(() => {
      
      // Create a timeline that pins the section and scrubs the animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,           // Locks the screen in place
          scrub: 1,            // Smooth tie to the scroll bar
          start: "center center", 
          end: "+=150%",       // Keeps it pinned for a long scroll distance
        }
      });

      // 1. Move the glowing laser line from top (0%) to bottom (100%)
      tl.to(laserRef.current, {
        top: "100%",
        ease: "none",
        duration: 1
      }, 0); // The '0' means it starts at the exact beginning of the timeline

      // 2. Reveal the translated "Simple Text" exactly as the laser passes over it
      // Using clip-path inset(top right bottom left)
      tl.to(decodedTextRef.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        duration: 1
      }, 0); // Runs at the exact same time as the laser

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen bg-transparent flex items-center justify-center overflow-hidden">
      
      {/* Background ambient glow for the section */}
      <div className="absolute inset-0 bg-indigo-900/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 w-full text-center relative z-10">
        
        <div className="mb-12">
          <h2 className="text-indigo-500 font-bold tracking-[0.2em] uppercase text-sm mb-4 inline-flex items-center gap-2">
            <ScanSearch size={16} />
            Live AI Decoding
          </h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-white">
            Watch the AI strip away complexity.
          </h3>
        </div>

        {/* The Document Container */}
        <div ref={containerRef} className="relative w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-8 md:p-14 text-left shadow-2xl overflow-hidden min-h-[300px]">
          
          {/* LAYER 1: The Complex Legal Jargon (Always visible in background) */}
          <div className="text-slate-600 font-mono text-lg md:text-2xl leading-relaxed select-none">
            "IN WITNESS WHEREOF, the parties hereto have caused this Agreement to be executed by their duly authorized representatives as of the Effective Date. The Receiving Party shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party. Furthermore, the Indemnifying Party agrees to defend, indemnify, and hold harmless the Indemnified Party from any unforeseen liabilities..."
          </div>

          {/* LAYER 2: The Decoded Simple English (Initially hidden by clip-path) */}
          <div 
            ref={decodedTextRef} 
            className="absolute inset-0 p-8 md:p-14 bg-[#0a0a0c] text-white font-serif text-xl md:text-3xl leading-relaxed select-none z-10"
            style={{ clipPath: "inset(0% 0% 100% 0%)" }} // Hides everything from the bottom up initially
          >
            <span className="text-indigo-400 font-bold">AI Summary:</span> Both parties agree to sign today. You must keep all shared information completely secret and only use it for the agreed purpose. If any unexpected costs arise, the party responsible will cover all expenses.
          </div>

          {/* LAYER 3: The Glowing Laser Scanning Line */}
          <div 
            ref={laserRef}
            className="absolute left-0 right-0 h-[2px] bg-indigo-500 z-20"
            style={{ 
              top: "0%",
              boxShadow: "0px 0px 20px 5px rgba(79, 70, 229, 0.6), 0px 0px 40px 10px rgba(79, 70, 229, 0.3)" 
            }}
          >
            {/* Laser light flares on the edges */}
            <div className="absolute top-1/2 left-0 w-4 h-4 bg-white rounded-full -translate-y-1/2 -translate-x-1/2 blur-[2px]" />
            <div className="absolute top-1/2 right-0 w-4 h-4 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-[2px]" />
          </div>

        </div>

        <p className="mt-8 text-slate-500 text-sm tracking-widest uppercase">
          Scroll down to scan document
        </p>

      </div>
    </section>
  );
};

export default DocumentScanner;