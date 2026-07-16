import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, Sparkles, WandSparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext.jsx";
import { generateComplaintLetter } from "../services/api";
import { sanitizeComplaintText } from "../utils/complaintText";

const INPUT_STORAGE_KEY = "nyaySahayak:complaintInput";
const DRAFT_STORAGE_KEY = "nyaySahayak:complaintDraft";

function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

import FirTour from "../components/onboarding/FirTour";

export default function FirPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = useMemo(() => {
    const localized = {
      en: {
        appName: "Nyay Sahayak",
        title: "Complaint Generator",
        subtitle: "Describe your issue in simple words",
        helper:
          "Write the incident in your own words. Include dates, places, people, amounts, and any proof you have.",
        placeholder: "e.g., my phone was stolen in Mumbai...",
        generate: "Generate complaint letter",
        generating: "Generating complaint letter...",
        clear: "Clear",
      },
      hi: {
        appName: "Nyay Sahayak",
        title: "शिकायत जनरेटर",
        subtitle: "अपनी समस्या सरल शब्दों में लिखें",
        helper: "घटना को अपने शब्दों में लिखें। तारीख, स्थान, व्यक्ति, राशि और उपलब्ध सबूत शामिल करें।",
        placeholder: "उदाहरण: मेरा फोन मुंबई में चोरी हो गया...",
        generate: "शिकायत पत्र बनाएं",
        generating: "शिकायत पत्र बनाया जा रहा है...",
        clear: "साफ करें",
      },
      mr: {
        appName: "Nyay Sahayak",
        title: "तक्रार जनरेटर",
        subtitle: "आपली समस्या सोप्या शब्दांत लिहा",
        helper: "घटना तुमच्या शब्दांत लिहा. तारीख, ठिकाण, व्यक्ती, रक्कम आणि उपलब्ध पुरावे जोडा.",
        placeholder: "उदा. माझा फोन मुंबईत चोरीला गेला...",
        generate: "तक्रार पत्र तयार करा",
        generating: "तक्रार पत्र तयार केले जात आहे...",
        clear: "काढून टाका",
      },
    };

    return localized[language] || localized.en;
  }, [language]);

  useEffect(() => {
    const savedInput = sessionStorage.getItem(INPUT_STORAGE_KEY);
    if (savedInput) {
      setText(savedInput);
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current);
  }, [text]);

  const handleGenerate = async () => {
    const input = text.trim();
    if (!input) {
      setError(t("fir.enterProblemDescription") || "Please enter your problem description.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await generateComplaintLetter(input, {
        language,
        mode: "save",
      });

      const draftText = sanitizeComplaintText(response?.complaint_text || "");
      sessionStorage.setItem(INPUT_STORAGE_KEY, input);
      sessionStorage.setItem(DRAFT_STORAGE_KEY, draftText);
      navigate("/fir/output", { state: { draftText, sourceText: input } });
    } catch (err) {
      setError(err.message || t("fir.unableToGenerate") || "Unable to generate complaint letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setError("");
    sessionStorage.removeItem(INPUT_STORAGE_KEY);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="min-h-full overflow-y-auto bg-[var(--color-bg-main)] px-4 py-6 text-[var(--color-text-main)] sm:px-6 lg:px-8 lg:py-8">
      <FirTour />
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl items-center">
        <div className="w-full rounded-4xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border-main)] pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">{copy.appName}</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-4xl">{copy.title}</h1>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-[var(--color-text-main)] sm:text-3xl">{copy.subtitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">{copy.helper}</p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <label className="mb-3 block text-sm font-semibold text-[var(--color-text-main)]">
              {t("fir.describeComplaint") || "Describe your complaint"}
            </label>
            <textarea
              data-tour="fir-input"
              ref={textareaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={copy.placeholder}
              rows={8}
              className="w-full resize-none overflow-hidden rounded-[1.75rem] border border-[var(--color-border-main)] bg-[var(--color-bg-main)] p-5 text-[15px] leading-7 text-[var(--color-text-main)] outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
            />

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-200">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                data-tour="fir-generate"
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                {loading ? copy.generating : copy.generate}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-main)] bg-white/5 px-6 py-3 text-sm font-semibold text-[var(--color-text-main)] transition hover:bg-white/10"
              >
                <RotateCcw size={16} />
                {copy.clear}
              </button>
            </div>

            <p className="mt-5 text-center text-xs leading-6 text-slate-500">
              The next page will show the generated complaint letter and let you copy or download it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}