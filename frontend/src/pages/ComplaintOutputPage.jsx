import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext.jsx";
import FIRDraftCard from "../components/omni/FIRDraftCard.jsx";

const INPUT_STORAGE_KEY = "nyaySahayak:complaintInput";
const DRAFT_STORAGE_KEY = "nyaySahayak:complaintDraft";

export default function ComplaintOutputPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [draftText, setDraftText] = useState("");

  const copyByLanguage = useMemo(() => {
    const localized = {
      en: {
        back: "Back",
        title: "Your Complaint Letter",
        subtitle: "Review the generated letter, then copy or download it.",
        ready: "Ready to export",
      },
      hi: {
        back: "वापस",
        title: "आपका शिकायत पत्र",
        subtitle: "तैयार पत्र की समीक्षा करें, फिर कॉपी या डाउनलोड करें।",
        ready: "एक्सपोर्ट के लिए तैयार",
      },
      mr: {
        back: "मागे",
        title: "तुमचे तक्रार पत्र",
        subtitle: "तयार पत्र तपासा, नंतर कॉपी किंवा डाउनलोड करा.",
        ready: "Export करण्यासाठी तयार",
      },
    };

    return localized[language] || localized.en;
  }, [language]);

  useEffect(() => {
    const stateDraft = location.state?.draftText || "";
    const storedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY) || "";
    const draft = stateDraft || storedDraft;

    if (!draft) {
      navigate("/fir", { replace: true });
      return;
    }

    setDraftText(draft);
    if (!storedDraft && draft) {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, draft);
    }
  }, [location.state, navigate]);

  const handleBack = () => {
    navigate("/fir");
  };

  return (
    <div className="min-h-full overflow-y-auto bg-[#060607] px-4 py-6 text-slate-100 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-4xl border border-white/10 bg-[#111215]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft size={16} />
              {copyByLanguage.back}
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              <Sparkles size={12} />
              {copyByLanguage.ready}
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-3xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {copyByLanguage.title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              {copyByLanguage.subtitle}
            </p>
          </div>

          <div className="mt-8">
            <FIRDraftCard firText={draftText} editable={Boolean(draftText)} onChange={setDraftText} />
          </div>
        </div>
      </div>
    </div>
  );
}