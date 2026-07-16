import { useEffect, useRef, useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import {
  ArrowUp,
  FileText,
  Loader2,
  Upload,
  X,
  Shield,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  analyzeDocument,
  analyzeText,
  fetchAnalysisHistory,
} from "../services/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext.jsx";
import { formatAnalysisResponse } from "../utils/formatAnalysis";
import PrivacyToggle from "../components/common/PrivacyToggle.jsx";
import {
  canUseGuestFeature,
  getOrCreateGuestSessionId,
  getPrivacyMode,
  incrementGuestUsage,
  isGuestUser,
  loadGuestAnalysisHistory,
  saveGuestAnalysisHistory,
  setPrivacyMode,
} from "../utils/guestIdentity";

const riskBadgeStyles = {
  LOW: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  HIGH: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};

const warningStyles = {
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  HIGH: "border-rose-500/30 bg-rose-500/10 text-rose-100",
};

const LawReferenceBadge = ({ law }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popupRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text-main)] border border-[var(--color-border-main)] hover:bg-white/5 transition-colors focus:outline-none"
      >
        {law.law}
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-8 z-50 w-60 rounded-xl bg-[var(--color-bg-surface)] p-3 text-xs text-[var(--color-text-main)] shadow-xl border border-[var(--color-border-main)]">
          {law.description}
        </div>
      )}
    </div>
  );
};

const AIAnalysisCard = ({ analysis, t }) => {
  const [expanded, setExpanded] = useState(false);
  const riskLevel = String(analysis?.risk_level || "LOW").toUpperCase();
  const badgeClass = riskBadgeStyles[riskLevel] || riskBadgeStyles.LOW;
  const warningClass = warningStyles[riskLevel] || warningStyles.LOW;
  const topRisks = Array.isArray(analysis?.top_risks) ? analysis.top_risks : [];
  const detectedRisks = Array.isArray(analysis?.detected_risks) ? analysis.detected_risks : [];
  const lawReferences = Array.isArray(analysis?.law_reference) ? analysis.law_reference : [];
  const actions = Array.isArray(analysis?.what_user_should_do)
    ? analysis.what_user_should_do
    : [];

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--color-text-main)]">
          <Sparkles className="text-indigo-400" size={18} />
          <span className="font-semibold">{t("analysis.aiAnalysis")}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          <ShieldCheck size={12} />
          {t("trust.secureAnalysis", "Encrypted Analysis")}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-main)]">
            <FileText size={16} className="text-indigo-300" />
            <span className="font-semibold">{t("analysis.documentInfo")}</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
            <div>
              {t("analysis.type")}: <span className="text-[var(--color-text-main)] font-semibold">{analysis.document_type}</span>
            </div>
            <div>
              {t("analysis.classification")}: <span className="text-[var(--color-text-main)] font-semibold">{analysis.classification}</span>
            </div>
            <div>
              {t("analysis.decision")}: <span className="text-[var(--color-text-main)] font-semibold">{analysis.decision}</span>
            </div>
            <div>
              {t("analysis.confidence")}: <span className="text-[var(--color-text-main)] font-semibold">{analysis.confidence_score}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${warningClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span className="font-semibold">{t("analysis.keyWarning")}</span>
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
              {riskLevel} {t("analysis.risk")}
            </span>
          </div>
          <p className="mt-3 text-sm">{analysis.key_warning}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--color-text-main)]">
          <Sparkles size={16} className="text-indigo-300" />
          <span className="font-semibold">{t("analysis.smartExplanation")}</span>
        </div>
        <p className="mt-3 text-sm text-[var(--color-text-main)]">{analysis.smart_explanation}</p>
        {analysis.simple_explanation && (
          <p className="mt-3 text-sm text-slate-400">{t("analysis.simple")}: {analysis.simple_explanation}</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-main)]">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{t("analysis.topRisks")}</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
            {topRisks.length === 0 ? (
              <li>{t("analysis.noMajorRisksDetected")}</li>
            ) : (
              topRisks.map((risk, index) => <li key={index}>- {risk}</li>)
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-main)]">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{t("analysis.whatToDo")}</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-main)]">
            {actions.length === 0 ? (
              <li>{t("analysis.noActionItemsProvided")}</li>
            ) : (
              actions.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-[var(--color-text-main)]"
        >
          <span className="font-semibold">{t("analysis.detailedRisks")}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && (
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text-main)]">
            {detectedRisks.length === 0 ? (
              <p>{t("analysis.noDetailedRisksFound")}</p>
            ) : (
              detectedRisks.map((risk, index) => (
                <div key={index} className="rounded-xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-main)]">{risk.type}</span>
                    <span className="text-xs font-semibold text-slate-400">{risk.level}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-main)]">{risk.reason}</p>
                  {risk.snippet && (
                    <p className="mt-2 text-xs italic text-slate-500">{t("analysis.snippet")}: {risk.snippet}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--color-text-main)]">
          <Info size={16} className="text-indigo-300" />
          <span className="font-semibold">{t("analysis.lawReference")}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {lawReferences.length === 0 ? (
            <span className="text-sm text-slate-400">{t("analysis.noLegalReferencesDetected")}</span>
          ) : (
            lawReferences.map((law, index) => (
              <LawReferenceBadge key={index} law={law} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import AnalyzeTour from "../components/onboarding/AnalyzeTour";
import AILoadingIndicator from "../components/chat/AILoadingIndicator";

export default function AnalyzePage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [privacyMode, setPrivacyModeState] = useState(getPrivacyMode());

  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { refreshSessions, sessionNonce } = useOutletContext() || {};

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setPrivacyMode(privacyMode);
  }, [privacyMode]);

  useEffect(() => {
    const loadSession = async () => {
      setIsInitializing(true);
      if (!sessionId) {
        if (isGuestUser()) {
          const guestSessionId = getOrCreateGuestSessionId("analysis");
          const guestHistory = loadGuestAnalysisHistory() || [];
          setChatHistory(guestHistory);
          setSearchParams({ session: guestSessionId }, { replace: true });
        } else {
          setChatHistory([]);
        }
      } else {
        try {
          const history = await fetchAnalysisHistory(sessionId);
          if (history && history.length > 0) {
            setChatHistory(history);
          } else {
            setChatHistory([]);
          }
        } catch (e) {
          console.error("Failed to fetch analysis history:", e);
          setChatHistory([]);
        }
      }
      setIsInitializing(false);
    };

    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (sessionNonce > 0 && !sessionId && !isGuestUser()) {
      setChatHistory([]);
      setInputText("");
      setFile(null);
    }
  }, [sessionNonce, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading, analysisProgress]);

  const addUserMessage = (content, hasFile = false) => {
    setChatHistory((prev) => [...prev, { role: "user", content, hasFile }]);
  };

  const addAIMessage = (content, isError = false, structured = null) => {
    setChatHistory((prev) => [...prev, { role: "ai", content, isError, structured }]);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (selectedFile.size > maxSize) {
      addAIMessage(t("analysis.fileSizeExceeded"), true);
      return;
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      addAIMessage(t("analysis.invalidFileType"), true);
      return;
    }

    setFile(selectedFile);
  };

  const handleSend = async () => {
    if (!file && !inputText.trim()) {
      return;
    }

    const guest = isGuestUser();
    if (guest && !canUseGuestFeature("analysis")) {
      addAIMessage(t("common.pleaseLoginToContinue"), true);
      return;
    }

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = guest
        ? getOrCreateGuestSessionId("analysis")
        : crypto.randomUUID();
    }

    const currentFile = file;
    const currentText = inputText.trim();
    const parts = [];

    if (currentFile) {
      parts.push(t("analysis.uploadedDocument", { name: currentFile.name }));
      parts.push(t("analysis.fileSize", { size: (currentFile.size / 1024).toFixed(2) }));
    }

    if (currentText) {
      parts.push(currentText);
    }

    addUserMessage(parts.join("\n"), Boolean(currentFile));
    setInputText("");
    removeFile();
    setLoading(true);
    setAnalysisProgress(t("analysis.preparingAnalysis"));

    try {
      let response;

      if (currentFile) {
        response = await analyzeDocument(currentFile, (progress) => {
          if (progress.stage === "uploading") {
            setAnalysisProgress(t("analysis.uploadingAndExtractingText"));
          } else if (progress.stage === "analyzing") {
            setAnalysisProgress(t("analysis.analyzingWithAi"));
          } else if (progress.stage === "completed") {
            setAnalysisProgress(t("analysis.finalizingReport"));
          }
        }, { sessionId: targetSessionId, instructions: currentText, language, mode: privacyMode });
      } else {
        setAnalysisProgress(t("analysis.analyzingText"));
        response = await analyzeText(currentText, { sessionId: targetSessionId, language, mode: privacyMode });
      }

      const structured = response?.data?.analysis?.structured || null;
      if (structured) {
        addAIMessage("", false, structured);
      } else {
        addAIMessage(formatAnalysisResponse(response));
      }

      if (guest) {
        const history = [...chatHistory, { role: "user", content: parts.join("\n"), hasFile: Boolean(currentFile) }];
        const latest = structured
          ? { role: "ai", content: "", isError: false, structured }
          : { role: "ai", content: formatAnalysisResponse(response), isError: false };
        const nextHistory = [...history, latest].slice(-2);
        saveGuestAnalysisHistory(nextHistory);
        incrementGuestUsage("analysis");
      } 
      
      if (refreshSessions) {
        refreshSessions();
      }

      if (!sessionId) {
        setSearchParams({ session: targetSessionId }, { replace: true });
      }
    } catch (error) {
      addAIMessage(error.message || t("analysis.analysisFailed"), true);
    } finally {
      setLoading(false);
      setAnalysisProgress(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-bg-main)] text-[var(--color-text-main)]">
      <AnalyzeTour />
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {/* <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <PrivacyToggle value={privacyMode} onChange={setPrivacyModeState} />
            <span>Private mode skips saving analysis history.</span>
            {isGuestUser() && <span className="text-amber-300">Guest limit: 1 analysis.</span>}
          </div> */}
          {isInitializing ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="mt-20 rounded-3xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
                <Shield className="text-indigo-400" size={28} />
              </div>
              <h1 className="mb-3 text-3xl font-bold text-[var(--color-text-main)]">{t("analysis.documentAnalysis")}</h1>
              <p className="mx-auto max-w-xl text-sm leading-7 text-slate-400">
                {t("analysis.documentAnalysisSubtitle")}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-10">
              {chatHistory.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${msg.isError ? "bg-red-500/20" : "bg-indigo-600/90"}`}>
                      {msg.isError ? <AlertCircle size={18} className="text-red-300" /> : <Shield size={18} className="text-white" />}
                    </div>
                  )}
                  {msg.role === "ai" && msg.structured ? (
                    <AIAnalysisCard analysis={msg.structured} t={t} />
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-7 ${
                        msg.role === "user"
                          ? "rounded-tr-none bg-indigo-600 text-[var(--color-text-main)]"
                          : msg.isError
                          ? "border border-red-500/20 bg-red-500/10 text-red-100"
                          : "rounded-tl-none border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] text-[var(--color-text-main)]"
                      }`}
                    >
                      {msg.role === "ai" && typeof msg.content === "object" ? (
                        <div className="whitespace-pre-wrap wrap-break-word">
                          {formatAnalysisResponse(
                            msg.content.success !== undefined
                              ? msg.content
                              : { success: true, data: { analysis: msg.content } }
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap wrap-break-word">{msg.content}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <AILoadingIndicator text={analysisProgress || t("common.processing")} />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--color-border-main)] bg-[var(--color-bg-main)] p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-2">
          {file && (
            <div className="mx-2 mb-2 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText size={16} />
                <span className="truncate text-xs font-semibold">{file.name}</span>
              </div>
              <button onClick={removeFile} className="rounded-lg p-1 hover:bg-white/5">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              data-tour="analyze-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="rounded-xl p-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title={t("analysis.uploadDocument")}
            >
              <Upload size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.docx" />

            <textarea
              data-tour="analyze-text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder={t("analysis.pasteLegalTextOrInstructions")}
              className="max-h-32 flex-1 resize-none bg-transparent py-3 text-[15px] text-[var(--color-text-main)] outline-none placeholder:text-slate-600"
              rows={1}
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              data-tour="analyze-submit"
              onClick={handleSend}
              disabled={loading || (!file && !inputText.trim())}
              className="rounded-xl bg-indigo-600 p-3 text-white transition hover:bg-indigo-500 disabled:opacity-30"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
