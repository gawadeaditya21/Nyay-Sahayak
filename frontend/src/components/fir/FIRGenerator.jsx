import { useState } from "react";
import { Copy, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";
import { generateFir } from "../../services/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function FIRGenerator() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [firText, setFirText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError("Please enter your problem description.");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    setFirText("");

    try {
      const response = await generateFir(userInput.trim(), language);
      setFirText(response?.fir_text || "");
    } catch (err) {
      setError(err.message || "Unable to generate FIR.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!firText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(firText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError("Copy failed. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!firText) {
      return;
    }

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
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <Sparkles className="text-indigo-400" size={22} />
          <div>
            <h1 className="text-2xl font-semibold text-white">{t("fir.title")}</h1>
            <p className="text-sm text-slate-400">
              {t("fir.subtitle")}
            </p>
          </div>
        </div>

        <textarea
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          placeholder={t("fir.placeholder")}
          className="mt-6 min-h-[160px] w-full resize-none rounded-2xl border border-white/10 bg-[#0a0a0b] px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
        />

        {error && (
          <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {t("fir.generate")}
        </button>

        {loading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            {t("fir.generating")}
          </div>
        )}
      </div>

      {firText && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{t("fir.generatedTitle")}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Copy size={14} />
                {copied ? t("fir.copied") : t("fir.copy")}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Download size={14} />
                {t("fir.download")}
              </button>
            </div>
          </div>

          <div className="mt-4 max-h-[520px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
            <pre className="whitespace-pre-wrap font-sans">{firText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
