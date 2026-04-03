import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  ArrowUp,
  Bot,
  FileSignature,
  List,
  MessageSquare,
  Paperclip,
  Plus,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { analyzeDocument, generateFir, sendChatMessage, fetchChatSessions, fetchChatHistory } from "../services/api";
import { useLanguage } from "../context/LanguageContext.jsx";
import AnalysisCard from "../components/omni/AnalysisCard";
import FIRDraftCard from "../components/omni/FIRDraftCard";
import FIRInputCard from "../components/omni/FIRInputCard";
import LegalStepsCard from "../components/omni/LegalStepsCard";
import TypingIndicator from "../components/omni/TypingIndicator";

const FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ChatPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { registerChatActivity, chatNonce } = useOutletContext() || {};
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastUserInputRef = useRef("");
  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [stagedFile, setStagedFile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canSend = Boolean(input.trim() || stagedFile);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSessionId = searchParams.get("session");

  const initialMessage = useMemo(
    () => ({
      id: "intro",
      role: "assistant",
      type: "text",
      content: {
        topic: t("appName"),
        simple_explanation: t("chat.initialExplanation"),
        rules: [t("chat.initialRule1"), t("chat.initialRule2")],
        penalties: [],
        user_guidance: [t("chat.initialGuidance")],
      },
      suggestions: ["See Steps", "Analyze Document", "Generate FIR"],
      contextUsed: false,
    }),
    [t]
  );

  useEffect(() => {
    setMessages([initialMessage]);
  }, [initialMessage]);

  useEffect(() => {
    if (chatNonce > 0) {
      setMessages([initialMessage]);
      setInput("");
      setStagedFile(null);
      setChatId(null);
    }
  }, [chatNonce, initialMessage]);

  const loadSession = async (sessionId) => {
    setLoading(true);
    setIsInitializing(true);
    try {
      const history = await fetchChatHistory(sessionId);
      if (history && history.length > 0) {
        const formattedHistory = history.map(msg => ({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role: msg.role,
          type: "text",
          content: msg.content,
          suggestions: msg.suggestions || [],
          contextUsed: msg.contextUsed || false,
        }));
        setMessages([initialMessage, ...formattedHistory]);
      } else {
        setMessages([initialMessage]);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setMessages([
        initialMessage,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          type: "text",
          isError: true,
          content: "Failed to load chat history. Please try again later.",
        }
      ]);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentSessionId) {
      loadSession(currentSessionId);
    } else {
      setMessages([initialMessage]);
      setIsInitializing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const pushMessage = (message) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...message },
    ]);
  };

  const removeMessage = (id) => {
    setMessages((prev) => prev.filter((item) => item.id !== id));
  };

  const ensureChatRegistered = (title) => {
    if (!registerChatActivity) {
      return chatId;
    }

    if (chatId) {
      registerChatActivity(title, chatId);
      return chatId;
    }

    const newId = registerChatActivity(title, chatId);
    setChatId(newId);
    return newId;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      pushMessage({
        role: "assistant",
        type: "text",
        isError: true,
        content: "File size exceeds 15MB. Please upload a smaller file.",
      });
      return;
    }

    if (!FILE_TYPES.includes(selectedFile.type)) {
      pushMessage({
        role: "assistant",
        type: "text",
        isError: true,
        content: "Invalid file type. Please upload a PDF, image, or DOCX file.",
      });
      return;
    }

    setStagedFile(selectedFile);
  };

  const openFirComposer = (prefill = "") => {
    pushMessage({
      role: "assistant",
      type: "fir_input",
      content: { prefill },
    });
  };

  const handleGenerateFir = async (seedText) => {
    const content = seedText?.trim();
    if (!content) {
      openFirComposer("");
      return;
    }

    setLoading(true);
    try {
      pushMessage({ role: "user", type: "text", content });
      const response = await generateFir(content, language);
      pushMessage({
        role: "assistant",
        type: "fir",
        content: response?.fir_text || "",
      });
    } catch (error) {
      pushMessage({
        role: "assistant",
        type: "text",
        isError: true,
        content: error.message || "Unable to generate FIR.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowSteps = () => {
    pushMessage({
      role: "assistant",
      type: "steps",
      content: {
        completed: 1,
      },
    });
  };

  const handleSuggestion = async (suggestion) => {
    if (suggestion === "Analyze Document") {
      fileInputRef.current?.click();
      return;
    }

    if (suggestion === "See Steps") {
      handleShowSteps();
      return;
    }

    if (suggestion === "Generate FIR") {
      openFirComposer(lastUserInputRef.current);
    }
  };

  const submitMessage = async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !stagedFile) || loading) {
      return;
    }

    const file = stagedFile;
    const chatTitle = trimmedInput || file?.name || "New chat";
    ensureChatRegistered(chatTitle);

    pushMessage({
      role: "user",
      type: "text",
      content: trimmedInput,
      file,
    });

    setInput("");
    setStagedFile(null);
    setLoading(true);

    try {
      if (file) {
        const response = await analyzeDocument(file, null, language, currentSessionId);
        const structured = response?.data?.analysis?.structured || null;
        if (structured) {
          pushMessage({
            role: "assistant",
            type: "analysis",
            content: {
              analysis: structured,
              fileName: file.name,
              fileType: file.type,
            },
          });
        }
      }

      if (trimmedInput) {
        lastUserInputRef.current = trimmedInput;
        const response = await sendChatMessage(trimmedInput, language, currentSessionId);
        pushMessage({
          role: "assistant",
          type: "text",
          content: response.reply,
          suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
          contextUsed: Boolean(response.contextUsed),
        });
      }
    } catch (error) {
      pushMessage({
        role: "assistant",
        type: "text",
        isError: true,
        content: error.message || t("chat.errorMessage"),
      });
    } finally {
      setLoading(false);
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10, transformOrigin: "bottom left" },
    visible: { opacity: 1, scale: 1, y: 0, transformOrigin: "bottom left" },
    exit: { opacity: 0, scale: 0.96, y: 8 },
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#050505] text-slate-300">
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-8 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%),rgba(15,15,18,0.9)] p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t("chat.title")}</h1>
                <p className="text-sm text-slate-400">{t("chat.subtitle")}</p>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-slate-400">{t("chat.example")}</p>
          </div>

          <div className="space-y-6 pb-10">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2) }}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      message.isError ? "bg-red-500/20 text-red-300" : "bg-indigo-600 text-white"
                    }`}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div className="max-w-[90%]">
                  {message.type === "analysis" && (
                    <AnalysisCard
                      analysis={message.content.analysis}
                      fileName={message.content.fileName}
                      fileType={message.content.fileType}
                      onViewSteps={handleShowSteps}
                      onDraftNotice={() => handleGenerateFir(lastUserInputRef.current)}
                    />
                  )}

                  {message.type === "steps" && (
                    <LegalStepsCard completed={message.content.completed} />
                  )}

                  {message.type === "fir" && <FIRDraftCard firText={message.content} />}

                  {message.type === "fir_input" && (
                    <FIRInputCard
                      defaultValue={message.content?.prefill || ""}
                      onSubmit={handleGenerateFir}
                      onCancel={() => removeMessage(message.id)}
                    />
                  )}

                  {message.type === "text" && (
                    <div
                      className={`rounded-3xl p-4 text-sm leading-7 ${
                        message.role === "user"
                          ? "rounded-tr-none bg-indigo-600 text-white"
                          : message.isError
                          ? "border border-red-500/20 bg-red-500/10 text-red-100"
                          : "rounded-tl-none border border-white/10 bg-slate-900/60 text-slate-200 backdrop-blur-md"
                      }`}
                    >
                      <StructuredReply content={message.content} file={message.file} />
                      {message.role === "assistant" && !message.isError && (
                        <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {message.contextUsed ? "RAG context used" : "General legal guidance"}
                        </div>
                      )}
                    </div>
                  )}

                  {message.role === "assistant" && message.suggestions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestion(suggestion)}
                          className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-slate-200">
                    <User size={18} />
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Bot size={18} />
                </div>
                <TypingIndicator />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#050505] p-4 sm:p-6">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-[#121215] p-3 shadow-2xl backdrop-blur-md">
          {stagedFile && (
            <div className="mx-1 mb-3 flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
              <div className="flex items-center gap-2 truncate">
                <Paperclip size={14} />
                <span className="truncate font-semibold">{stagedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setStagedFile(null)}
                className="rounded-lg p-1 text-indigo-200 hover:bg-indigo-500/20"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="relative flex items-end gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                disabled={loading}
              >
                <Plus size={18} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute bottom-16 left-0 z-20 w-56 rounded-2xl border border-white/5 bg-[#1e1e24] p-2 shadow-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                      <Paperclip size={16} />
                      Upload Document
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        openFirComposer(lastUserInputRef.current);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                      <FileSignature size={16} />
                      Generate FIR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleShowSteps();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                      <List size={16} />
                      See Legal Steps
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.docx"
              onChange={(event) => {
                handleFileChange(event);
                setIsMenuOpen(false);
              }}
            />

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("chat.placeholder")}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-600"
              rows={1}
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
            />
            <button
              onClick={submitMessage}
              disabled={loading || !canSend}
              className={`rounded-2xl p-3 text-white transition ${
                canSend
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : "bg-slate-800/60 text-slate-500"
              }`}
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">{t("chat.disclaimer")}</p>
      </div>
    </div>
  );
}

function StructuredReply({ content, file }) {
  if (file) {
    return (
      <div className="space-y-2">
        {content && typeof content === "string" && (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        )}
        <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/90">
          Attached: {file.name}
        </div>
      </div>
    );
  }

  if (typeof content === "string") {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  const topic = content.topic || content.document_type || "Legal Guidance";
  const explanation = content.simple_explanation || content.reason_for_decision;

  return (
    <div className="space-y-3">
      {topic && <div className="text-base font-semibold text-white">{topic}</div>}
      
      {(content.classification || content.risk_level) && (
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {content.classification && (
            <span className={`rounded px-2 py-1 ${content.classification === 'NORMAL' ? 'bg-green-500/20 text-green-300' : content.classification === 'FRAUD' || content.classification === 'ILLEGAL' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              {content.classification}
            </span>
          )}
          {content.risk_level && (
            <span className={`rounded px-2 py-1 ${content.risk_level === 'LOW' ? 'bg-green-500/20 text-green-300' : content.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              Risk: {content.risk_level}
            </span>
          )}
          {content.final_decision && (
            <span className="rounded bg-indigo-500/20 px-2 py-1 text-indigo-300">
              {content.final_decision.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}

      {explanation && (
        <div className="whitespace-pre-wrap break-words text-[15px]">{explanation}</div>
      )}

      {Array.isArray(content.rules) && content.rules.length > 0 && (
        <SectionList title="Rules" items={content.rules} />
      )}
      {Array.isArray(content.penalties) && content.penalties.length > 0 && (
        <SectionList title="Penalties" items={content.penalties} />
      )}
      
      {Array.isArray(content.suspicious_clauses) && content.suspicious_clauses.length > 0 && (
        <SectionList title="Suspicious Clauses" items={content.suspicious_clauses} />
      )}
      {Array.isArray(content.top_risks) && content.top_risks.length > 0 && (
        <SectionList title="Top Risks" items={content.top_risks} />
      )}
      {Array.isArray(content.warnings) && content.warnings.length > 0 && (
        <SectionList title="Warnings" items={content.warnings} />
      )}

      {Array.isArray(content.user_guidance) && content.user_guidance.length > 0 && (
        <SectionList title="What You Should Do" items={content.user_guidance} />
      )}
      {Array.isArray(content.what_user_should_do) && content.what_user_should_do.length > 0 && (
        <SectionList title="Action Plan" items={content.what_user_should_do} />
      )}

      {Array.isArray(content.quantified_impact) && content.quantified_impact.length > 0 && (
        <SectionList title="Quantified Impact" items={content.quantified_impact} />
      )}
      
      {content.law_reference && content.law_reference.applicable && (
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Applicable Laws
          </div>
          {Array.isArray(content.law_reference.laws) && content.law_reference.laws.length > 0 && (
            <ul className="mb-2 list-none space-y-1">
              {content.law_reference.laws.map((law, idx) => (
                <li key={idx} className="text-sm font-medium text-indigo-200">
                  • {law}
                </li>
              ))}
            </ul>
          )}
          {content.law_reference.simple_explanation && (
            <div className="text-sm text-indigo-200/80">
              {content.law_reference.simple_explanation}
            </div>
          )}
        </div>
      )}

      {Array.isArray(content.legal_validity_flags) && content.legal_validity_flags.length > 0 && (
        <SectionList
          title="Legal Validity Flags"
          items={content.legal_validity_flags.map((flag) => {
            if (typeof flag === 'string') return flag;
            const parts = [flag.type, flag.clause, flag.law, flag.explanation]
              .filter(Boolean)
              .join(" | ");
            return parts || JSON.stringify(flag);
          })}
        />
      )}

      {content.lawyer_suggestion && (
        <div className="mt-4 text-sm italic text-slate-400 border-l-2 border-slate-700 pl-3">
          {content.lawyer_suggestion}
        </div>
      )}
    </div>
  );
}

function SectionList({ title, items }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="text-sm leading-6">
            - {item}
          </div>
        ))}
      </div>
    </div>
  );
}
