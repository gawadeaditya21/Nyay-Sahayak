import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Loader2, Upload, X, Shield, AlertCircle, PlusCircle, LayoutList } from "lucide-react";
import { analyzeDocument, analyzeText, fetchAnalysisSessions, fetchAnalysisHistory } from "../services/api";
import { formatAnalysisResponse } from "../utils/formatAnalysis";

export default function AnalyzePage() {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initializeSessions = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const sess = await fetchAnalysisSessions();
          setSessions(sess);
          if (sess.length > 0) {
            await loadSession(sess[0].sessionId);
          } else {
            setIsInitializing(false);
          }
        } catch (error) {
          console.error("Failed to fetch analysis sessions:", error);
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    initializeSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading, analysisProgress]);

  const loadSession = async (sessionId) => {
    setIsInitializing(true);
    setCurrentSessionId(sessionId);
    try {
      const history = await fetchAnalysisHistory(sessionId);
      if (history && history.length > 0) {
        setChatHistory(history);
      } else {
        setChatHistory([]);
      }
    } catch (e) {
      setChatHistory([]);
    }
    setIsInitializing(false);
  };

  const startNewAnalysis = () => {
    setCurrentSessionId(null);
    setChatHistory([]);
    setFile(null);
    setInputText("");
  };

  const refreshSessions = async () => {
    try {
      const sess = await fetchAnalysisSessions();
      setSessions(sess);
    } catch (e) {
      console.error(e);
    }
  };

  const addUserMessage = (content, hasFile = false) => {
    setChatHistory((prev) => [...prev, { role: "user", content, hasFile }]);
  };

  const addAIMessage = (content, isError = false) => {
    setChatHistory((prev) => [...prev, { role: "ai", content, isError }]);
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

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      targetSessionId = crypto.randomUUID();
      setCurrentSessionId(targetSessionId);
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
        }, targetSessionId, currentText);
      } else {
        setAnalysisProgress("Analyzing text...");
        response = await analyzeText(currentText, targetSessionId);
      }

      addAIMessage(formatAnalysisResponse(response));
      refreshSessions();
    } catch (error) {
      addAIMessage(error.message || "Analysis failed. Please try again.", true);
    } finally {
      setLoading(false);
      setAnalysisProgress(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0a0b] text-slate-300 md:flex-row">
      {/* Sidebar for Sessions */}
      <div className="hidden w-64 flex-col border-r border-white/5 bg-[#0d0d0f] md:flex">
        <div className="p-4">
          <button
            onClick={startNewAnalysis}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <PlusCircle size={18} /> New Analysis
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Analyses
          </div>
          {sessions.map((sess) => (
            <button
              key={sess.sessionId}
              onClick={() => loadSession(sess.sessionId)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                currentSessionId === sess.sessionId
                  ? "bg-indigo-500/10 text-indigo-300 font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <LayoutList size={16} className="shrink-0" />
              <span className="truncate">{sess.title}</span>
            </button>
          ))}
          {sessions.length === 0 && !isInitializing && (
             <div className="px-2 py-4 text-xs text-slate-600 text-center">No analysis history yet.</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            {isInitializing ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
              </div>
            ) : chatHistory.length === 0 ? (
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
                  <div key={`${msg.role}-${index}`} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && (
                      <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${msg.isError ? "bg-red-500/20" : "bg-indigo-600/90"}`}>
                        {msg.isError ? <AlertCircle size={18} className="text-red-300" /> : <Shield size={18} className="text-white" />}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-7 ${
                        msg.role === "user"
                          ? "rounded-tr-none bg-indigo-600 text-white"
                          : msg.isError
                            ? "border border-red-500/20 bg-red-500/10 text-red-100"
                            : "rounded-tl-none border border-white/5 bg-[#121215] text-slate-300"
                      }`}
                    >
                      {msg.role === 'ai' && typeof msg.content === 'object' ? (
                        <div className="whitespace-pre-wrap break-words">
                          {formatAnalysisResponse(
                            msg.content.success !== undefined 
                              ? msg.content 
                              : { success: true, data: { analysis: msg.content } }
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      )}
                    </div>
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
    </div>
  );
}
