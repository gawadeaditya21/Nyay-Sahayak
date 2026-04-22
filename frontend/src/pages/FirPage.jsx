import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { generateFir, fetchFirHistory } from "../services/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext.jsx";
import flowData from "../components/fir/firFlow.json";
import {
  canUseGuestFeature,
  getOrCreateGuestSessionId,
  getPrivacyMode,
  incrementGuestUsage,
  isGuestUser,
  setPrivacyMode,
} from "../utils/guestIdentity";

const flow = flowData.flow;
const firstStep = "start";

function getNextStep(currentQuestion, answer) {
  if (!currentQuestion) return "end";
  if (typeof currentQuestion.next === "object") {
    return answer === "Yes" ? currentQuestion.next.true : currentQuestion.next.false;
  }
  return currentQuestion.next;
}

function getAnswerLabels() {
  return Object.values(flow).reduce((labels, question) => {
    if (question.field) {
      labels[question.field] = question.question;
    }
    return labels;
  }, {});
}

export default function FirPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [step, setStep] = useState(firstStep);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [firText, setFirText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [privacyMode] = useState(getPrivacyMode());

  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { refreshSessions, sessionNonce } = useOutletContext() || {};

  const currentQuestion = flow[step];
  const answeredItems = useMemo(
    () =>
      Object.entries(answers).map(([field, value]) => ({
        field,
        label: getAnswerLabels()[field] || field,
        value,
      })),
    [answers]
  );
  const progressPercent = Math.min(
    Math.round((answeredItems.length / Object.keys(flow).length) * 100),
    100
  );

  useEffect(() => {
    setPrivacyMode(privacyMode);
  }, [privacyMode]);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setFirText("");
        setAnswers({});
        setCurrentAnswer("");
        setStep(firstStep);
        return;
      }

      setLoading(true);
      try {
        const response = await fetchFirHistory();
        if (response?.success && Array.isArray(response.data)) {
          const session = response.data.find((item) => item.sessionId === sessionId);
          if (session) {
            setFirText(session.content);
            setAnswers({});
            setCurrentAnswer("");
            setStep("end");
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
      resetFlow();
    }
  }, [sessionNonce, sessionId]);

  const resetFlow = () => {
    setStep(firstStep);
    setAnswers({});
    setCurrentAnswer("");
    setFirText("");
    setError("");
    setCopied(false);
  };

  const handleAnswerSubmit = async (value = currentAnswer) => {
    const trimmedValue = String(value || "").trim();
    if (!currentQuestion || !trimmedValue) {
      setError("Please answer the current question.");
      return;
    }

    const updatedAnswers = {
      ...answers,
      [currentQuestion.field]: trimmedValue,
    };
    const nextStep = getNextStep(currentQuestion, trimmedValue);

    setAnswers(updatedAnswers);
    setCurrentAnswer("");
    setError("");
    setCopied(false);

    if (nextStep === "end") {
      setStep("end");
      await handleGenerate(updatedAnswers);
      return;
    }

    setStep(nextStep);
  };

  const handleGenerate = async (finalAnswers = answers) => {
    if (Object.keys(finalAnswers).length === 0) {
      setError("Please answer the questions before generating the FIR.");
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
      const response = await generateFir(finalAnswers, {
        language,
        mode: privacyMode,
        sessionId: targetSessionId,
        answerLabels: getAnswerLabels(),
      });

      setFirText(response?.fir_text || "");

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
    } catch {
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

  const renderAnswerControl = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === "select") {
      return (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswerSubmit(option)}
              disabled={loading}
              className="min-h-12 rounded-xl border border-white/10 bg-[#0a0a0b] px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    const inputType = currentQuestion.type === "date" || currentQuestion.type === "time"
      ? currentQuestion.type
      : "text";

    if (currentQuestion.type === "textarea") {
      return (
        <textarea
          value={currentAnswer}
          onChange={(event) => setCurrentAnswer(event.target.value)}
          placeholder="Type your answer..."
          disabled={loading}
          className="mt-5 min-h-[132px] w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0b] px-4 py-4 text-[15px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-50"
        />
      );
    }

    return (
      <input
        type={inputType}
        value={currentAnswer}
        onChange={(event) => setCurrentAnswer(event.target.value)}
        disabled={loading}
        className="mt-5 h-12 w-full rounded-xl border border-white/10 bg-[#0a0a0b] px-4 text-[15px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-50"
      />
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0a0a0b] text-slate-300">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">{t("fir.title")}</h1>
                <p className="text-sm text-slate-400">
                  {t("fir.subtitle") || "Answer guided questions to generate a structured legal draft."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetFlow}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-indigo-400 hover:text-white disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Start over
            </button>
          </div>

          <div className="mt-6 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/10 bg-[#17171b] p-5">
              {step === "end" ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                  {loading ? (
                    <Loader2 size={34} className="animate-spin text-indigo-400" />
                  ) : (
                    <CheckCircle2 size={38} className="text-emerald-400" />
                  )}
                  <h2 className="mt-4 text-xl font-semibold text-white">
                    {loading ? "Generating your FIR draft" : "Guided answers complete"}
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-400">
                    {loading
                      ? t("fir.generating") || "Drafting professional FIR based on your context..."
                      : "Review the generated document below, or start over to create a fresh draft."}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Question {answeredItems.length + 1}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold leading-snug text-white">
                    {currentQuestion.question}
                  </h2>
                  {renderAnswerControl()}

                  {currentQuestion.type !== "select" && (
                    <button
                      type="button"
                      onClick={() => handleAnswerSubmit()}
                      disabled={loading || !currentAnswer.trim()}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-xl shadow-indigo-900/20 transition hover:bg-indigo-500 disabled:opacity-50 sm:w-auto"
                    >
                      <Send size={18} />
                      Continue
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#17171b] p-5">
              <h3 className="text-sm font-semibold text-white">Your answers</h3>
              {answeredItems.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Answers will appear here as you progress.</p>
              ) : (
                <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {answeredItems.map((item) => (
                    <div key={item.field} className="rounded-xl border border-white/10 bg-[#0a0a0b] p-3">
                      <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {firText && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {t("fir.generatedTitle") || "Generated FIR Document"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
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

        {loading && step !== "end" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400">
            <Loader2 size={16} className="animate-spin" />
            {t("fir.generating") || "Drafting professional FIR based on your context..."}
          </div>
        )}
      </div>
    </div>
  );
}
