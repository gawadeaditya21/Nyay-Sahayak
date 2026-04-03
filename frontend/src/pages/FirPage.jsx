import { useEffect, useState } from "react";
import { Copy, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { generateFir, fetchFirHistory } from "../services/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext.jsx";
import PrivacyToggle from "../components/common/PrivacyToggle.jsx";
import {
  canUseGuestFeature,
  getOrCreateGuestSessionId,
  getPrivacyMode,
  incrementGuestUsage,
  isGuestUser,
  setPrivacyMode,
} from "../utils/guestIdentity";

export default function FirPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [firText, setFirText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [privacyMode, setPrivacyModeState] = useState(getPrivacyMode());

  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { refreshSessions, sessionNonce } = useOutletContext() || {};

  useEffect(() => {
    setPrivacyMode(privacyMode);
  }, [privacyMode]);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setFirText("");
        setUserInput("");
        return;
      }

      setLoading(true);
      try {
        const response = await fetchFirHistory();
        if (response?.success && Array.isArray(response.data)) {
          const session = response.data.find(s => s.sessionId === sessionId);
          if (session) {
            setFirText(session.content);
            setUserInput("");
          }
        }
      } catch (err) {
        console.error("Failed to fetch FIR history:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (sessionNonce > 0 && !sessionId) {
      setFirText("");
      setUserInput("");
      setError("");
    }
  }, [sessionNonce, sessionId]);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError("Please enter your problem description.");
      return;
    }

    const guest = isGuestUser();
    if (guest && !canUseGuestFeature("fir")) {
      setError("Please login to continue");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    setFirText("");

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = guest ? getOrCreateGuestSessionId("fir") : crypto.randomUUID();
    }

    try {
      const response = await generateFir(userInput.trim(), {
        language,
        mode: privacyMode,
        sessionId: targetSessionId,
      });

      const newFirText = response?.fir_text || "";
      setFirText(newFirText);

      if (guest) {
        incrementGuestUsage("fir");
      }
      
      if (refreshSessions) {
        refreshSessions();
      }

      if (!sessionId) {
        setSearchParams({ session: targetSessionId }, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Unable to generate FIR.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!firText) return;
    try {
      await navigator.clipboard.writeText(firText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError("Copy failed. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!firText) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    const lines = doc.splitTextToSize(firText, maxWidth);

    doc.setFont("Times", "Normal");
    doc.setFontSize(12);
    doc.text(lines, margin, 60);
    doc.save("FIR_Complaint.pdf");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0a0a0b] text-slate-300">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
               <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">{t("fir.title")}</h1>
              <p className="text-sm text-slate-400">
                {t("fir.subtitle") || "Generate an official, structured legal draft."}
              </p>
            </div>
          </div>
          {/* <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <PrivacyToggle value={privacyMode} onChange={setPrivacyModeState} />
            <span>Private mode skips saving FIR history.</span>
            {isGuestUser() && <span className="text-amber-300">Guest limit: 1 FIR.</span>}
          </div> */}

          <textarea
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            placeholder={t("fir.placeholder") || "Describe the incident..."}
            className="mt-6 min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-[#0a0a0b] px-4 py-4 text-[15px] text-slate-200 outline-none focus:border-indigo-500 placeholder:text-slate-600"
          />

          {error && (
            <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || (!userInput.trim() && !firText)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-xl shadow-indigo-900/20 transition hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {t("fir.generate") || "Generate Draft"}
          </button>

          {loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400">
              <Loader2 size={16} className="animate-spin" />
              {t("fir.generating") || "Drafting professional FIR based on your context..."}
            </div>
          )}
        </div>

        {firText && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {t("fir.generatedTitle") || "Generated FIR Document"}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                >
                  <Copy size={16} />
                  {copied ? t("fir.copied") || "Copied!" : t("fir.copy") || "Copy Draft"}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download size={16} />
                  {t("fir.download") || "Download PDF"}
                </button>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto rounded-xl border border-slate-100 bg-[#f8fafc] p-6 text-[15px] leading-relaxed text-slate-800 shadow-inner">
              <pre className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed">{firText}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
