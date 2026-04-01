import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { analyzeDocument, analyzeText } from "../services/api";
import { formatAnalysisResponse } from "../utils/formatAnalysis";

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

const AIAnalysisCard = ({ analysis }) => {
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
    <div className="w-full rounded-2xl border border-white/10 bg-[#121215] p-5 shadow-xl">
      <div className="flex items-center gap-2 text-slate-200">
        <Sparkles className="text-indigo-400" size={18} />
        <span className="font-semibold">AI Analysis</span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-200">
            <FileText size={16} className="text-indigo-300" />
            <span className="font-semibold">Document Info</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div>
              Type: <span className="text-white font-semibold">{analysis.document_type}</span>
            </div>
            <div>
              Classification: <span className="text-white font-semibold">{analysis.classification}</span>
            </div>
            <div>
              Decision: <span className="text-white font-semibold">{analysis.decision}</span>
            </div>
            <div>
              Confidence: <span className="text-white font-semibold">{analysis.confidence_score}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${warningClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span className="font-semibold">Key Warning</span>
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
              {riskLevel} RISK
            </span>
          </div>
          <p className="mt-3 text-sm">{analysis.key_warning}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f0f12] p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-200">
          <Sparkles size={16} className="text-indigo-300" />
          <span className="font-semibold">Smart Explanation</span>
        </div>
        <p className="mt-3 text-sm text-slate-300">{analysis.smart_explanation}</p>
        {analysis.simple_explanation && (
          <p className="mt-3 text-sm text-slate-400">Simple: {analysis.simple_explanation}</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">Top Risks</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {topRisks.length === 0 ? (
              <li>No major risks detected.</li>
            ) : (
              topRisks.map((risk, index) => <li key={index}>- {risk}</li>)
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">What To Do</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {actions.length === 0 ? (
              <li>No action items provided.</li>
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

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f0f12] p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-slate-200"
        >
          <span className="font-semibold">Detailed Risks</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && (
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {detectedRisks.length === 0 ? (
              <p>No detailed risks found.</p>
            ) : (
              detectedRisks.map((risk, index) => (
                <div key={index} className="rounded-xl border border-white/10 bg-[#121215] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{risk.type}</span>
                    <span className="text-xs font-semibold text-slate-400">{risk.level}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{risk.reason}</p>
                  {risk.snippet && (
                    <p className="mt-2 text-xs italic text-slate-500">Snippet: {risk.snippet}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f0f12] p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-200">
          <Info size={16} className="text-indigo-300" />
          <span className="font-semibold">Law Reference</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {lawReferences.length === 0 ? (
            <span className="text-sm text-slate-400">No legal references detected.</span>
          ) : (
            lawReferences.map((law, index) => (
              <div key={index} className="group relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#121215] px-3 py-1 text-xs font-semibold text-slate-100 border border-white/10">
                  {law.law}
                </span>
                <div className="absolute left-0 top-8 z-10 hidden w-60 rounded-xl bg-[#0a0a0b] px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  {law.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default function AnalyzePage() {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

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
      addAIMessage("File size exceeds 15MB limit. Please upload a smaller file.", true);
      return;
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      addAIMessage("Invalid file type. Please upload a PDF, image, or DOCX file.", true);
      return;
    }

    setFile(selectedFile);
  };

  const handleSend = async () => {
    if (!file && !inputText.trim()) {
      return;
    }

    const currentFile = file;
    const currentText = inputText.trim();
    const parts = [];

    if (currentFile) {
      parts.push(`Uploaded: ${currentFile.name}`);
      parts.push(`Size: ${(currentFile.size / 1024).toFixed(2)} KB`);
    }

    if (currentText) {
      parts.push(currentText);
    }

    addUserMessage(parts.join("\n"), Boolean(currentFile));
    setInputText("");
    removeFile();
    setLoading(true);
    setAnalysisProgress("Preparing analysis...");

    try {
      let response;

      if (currentFile) {
        response = await analyzeDocument(currentFile, (progress) => {
          if (progress.stage === "uploading") {
            setAnalysisProgress("Uploading and extracting text...");
          } else if (progress.stage === "analyzing") {
            setAnalysisProgress("Analyzing with AI...");
          } else if (progress.stage === "completed") {
            setAnalysisProgress("Finalizing report...");
          }
        });
      } else {
        setAnalysisProgress("Analyzing text...");
        response = await analyzeText(currentText);
      }

      const structured = response?.data?.analysis?.structured || null;
      if (structured) {
        addAIMessage("", false, structured);
      } else {
        addAIMessage(formatAnalysisResponse(response));
      }
    } catch (error) {
      addAIMessage(error.message || "Analysis failed. Please try again.", true);
    } finally {
      setLoading(false);
      setAnalysisProgress(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0a0b] text-slate-300">
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {chatHistory.length === 0 ? (
            <div className="mt-20 rounded-3xl border border-white/10 bg-[#121215] p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
                <Shield className="text-indigo-400" size={28} />
              </div>
              <h1 className="mb-3 text-3xl font-bold text-white">Document Analysis</h1>
              <p className="mx-auto max-w-xl text-sm leading-7 text-slate-400">
                Upload agreements, notices, or legal documents for OCR, privacy masking, and Gemini-powered risk analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-10">
              {chatHistory.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        msg.isError ? "bg-red-500/20" : "bg-indigo-600/90"
                      }`}
                    >
                      {msg.isError ? (
                        <AlertCircle size={18} className="text-red-300" />
                      ) : (
                        <Shield size={18} className="text-white" />
                      )}
                    </div>
                  )}
                  {msg.role === "ai" && msg.structured ? (
                    <AIAnalysisCard analysis={msg.structured} />
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-7 ${
                        msg.role === "user"
                          ? "rounded-tr-none bg-indigo-600 text-white"
                          : msg.isError
                          ? "border border-red-500/20 bg-red-500/10 text-red-100"
                          : "rounded-tl-none border border-white/5 bg-[#121215] text-slate-300"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-[#121215]">
                    <Loader2 size={18} className="animate-spin text-indigo-400" />
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-[#121215] px-4 py-3 text-sm italic text-slate-400">
                    {analysisProgress || "Processing..."}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#0a0a0b] p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#121215] p-2">
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
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="rounded-xl p-3 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="Upload document"
            >
              <Upload size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.docx" />

            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Paste legal text or add instructions for the uploaded document..."
              className="max-h-32 flex-1 resize-none bg-transparent py-3 text-[15px] text-slate-200 outline-none placeholder:text-slate-600"
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
