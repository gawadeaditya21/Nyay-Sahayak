import React from "react";
import { ScanSearch, Bot, AlertTriangle, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const DocumentScanner = () => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full z-10 bg-[#050505] py-20 border-y border-white/5">
      <section className="max-w-6xl mx-auto px-6 w-full text-center">
        <div className="mb-10">
          <h2 className="text-indigo-500 font-bold tracking-[0.2em] uppercase text-sm mb-4 inline-flex items-center gap-2">
            <ScanSearch size={16} /> {t("landing.documentScanner.badge", "DOCUMENT SCANNER")}
          </h2>
          <h3 className="text-3xl md:text-5xl font-serif font-bold text-white">
            {t("landing.documentScanner.headline", "AI that reads the fine print")}
          </h3>
        </div>

        <div className="w-full flex flex-col md:flex-row items-stretch gap-6 md:gap-10 text-left mt-12">
          {/* Simulated Document Input */}
          <div className="flex-1 bg-slate-100 rounded-3xl p-8 shadow-inner overflow-hidden relative opacity-90">
            <img
              src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1000"
              alt="Legal Document"
              className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-multiply pointer-events-none"
            />
            <div className="relative z-10 text-slate-800 font-mono text-sm leading-relaxed text-justify">
              "IN WITNESS WHEREOF, the parties hereto have caused this Agreement to be executed by their duly
              authorized representatives. The Receiving Party shall hold and maintain the Confidential
              Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party.
              Furthermore, the Indemnifying Party agrees to defend, indemnify, and hold harmless the
              Indemnified Party from any and all unforeseen, unbounded liabilities, costs, damages, and
              expenses whatsoever arising out of..."
            </div>
          </div>

          {/* AI Analysis Output */}
          <div className="flex-1 bg-[#0a0a0c] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 text-indigo-400 mb-6">
              <Bot size={28} />
              <span className="font-bold tracking-widest uppercase text-sm">
                {t("landing.documentScanner.analysisComplete", "ANALYSIS COMPLETE")}
              </span>
            </div>
            
            <h4 className="text-2xl font-serif font-bold text-white mb-6 leading-tight">
              {t("landing.documentScanner.liabilityQuotePrefix", "You are taking on")} <span className="text-rose-500">{t("landing.documentScanner.liabilityQuoteEmphasis", "unlimited liability")}</span> {t("landing.documentScanner.liabilityQuoteSuffix", "here.")}
            </h4>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-4">
                <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={20} />
                <div>
                  <div className="text-white font-bold text-base mb-1">{t("landing.documentScanner.highRiskDetected", "High Risk Detected")}</div>
                  <div className="text-rose-400/80 text-sm">{t("landing.documentScanner.highRiskCopy", "The indemnification clause makes you responsible for all unforeseen costs.")}</div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                <CheckCircle className="text-emerald-500 shrink-0 mt-1" size={20} />
                <div>
                  <div className="text-white font-bold text-base mb-1">{t("landing.documentScanner.standardConfidentiality", "Standard Confidentiality")}</div>
                  <div className="text-emerald-400/80 text-sm">{t("landing.documentScanner.safeCopy", "The NDA terms are standard and safe to sign.")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DocumentScanner;