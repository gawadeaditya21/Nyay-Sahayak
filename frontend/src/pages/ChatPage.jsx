import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Bot, Loader2, User, Sparkles } from "lucide-react";
import { sendChatMessage } from "../services/api";

const ACTION_ROUTES = {
  "Generate FIR": "/fir",
  "See Steps": "/steps",
  "Analyze Document": "/analyze",
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: {
        topic: "Nyay Sahayak",
        simple_explanation:
          "Namaste. Main aapka legal assistant hoon. Aap seedha sawaal pooch sakte hain, jaise railway rules, property agreement, ya mobile chori ke baare mein.",
        rules: ["Simple sawaal poochiye.", "Indian context mein practical guidance milegi."],
        penalties: [],
        user_guidance: ["Agar matter urgent ho to lawyer ya authority se turant contact karein."],
      },
      suggestions: ["See Steps", "Analyze Document"],
      contextUsed: false,
    },
  ]);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submitMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: trimmedInput }]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(trimmedInput);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
          contextUsed: Boolean(response.contextUsed),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: {
            topic: "Legal Guidance",
            simple_explanation:
              error.message || "Assistant abhi available nahi hai. Thodi der baad phir try kijiye.",
            rules: [],
            penalties: [],
            user_guidance: ["Agar issue urgent hai to legal expert se consult karein."],
          },
          suggestions: ["See Steps"],
          contextUsed: false,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0a0b] text-slate-300">
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_50%),#121215] p-8 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">RAG Legal Chatbot</h1>
                <p className="text-sm text-slate-400">
                  TF-IDF retrieval + Gemini response + legal action suggestions
                </p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              Example: <span className="text-slate-200">"Mera mobile chori ho gaya kya karu?"</span>
            </p>
          </div>

          <div className="space-y-6 pb-8">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${message.isError ? "bg-red-500/20 text-red-300" : "bg-indigo-600 text-white"}`}>
                    <Bot size={18} />
                  </div>
                )}

                <div className="max-w-[88%]">
                  <div
                    className={`rounded-3xl p-4 text-sm leading-7 ${
                      message.role === "user"
                        ? "rounded-tr-none bg-white text-[#111827]"
                        : message.isError
                          ? "border border-red-500/20 bg-red-500/10 text-red-100"
                          : "rounded-tl-none border border-white/10 bg-[#121215] text-slate-200"
                    }`}
                  >
                    <StructuredReply content={message.content} />
                    {message.role === "assistant" && !message.isError && (
                      <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        {message.contextUsed ? "RAG context used" : "General legal guidance"}
                      </div>
                    )}
                  </div>

                  {message.role === "assistant" && message.suggestions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => navigate(ACTION_ROUTES[suggestion] || "/chat")}
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
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Loader2 size={18} className="animate-spin" />
                </div>
                <div className="rounded-3xl rounded-tl-none border border-white/10 bg-[#121215] px-4 py-3 text-sm italic text-slate-400">
                  Relevant legal context fetch karke answer prepare ho raha hai...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#0a0a0b] p-4 sm:p-6">
        <div className="mx-auto max-w-4xl rounded-[24px] border border-white/10 bg-[#121215] p-2 shadow-2xl">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Apna legal sawaal yahan likhiye..."
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
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-indigo-600 p-3 text-white transition hover:bg-indigo-500 disabled:opacity-30"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
            </button>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          AI guidance ko final legal opinion na maanein. Urgent matter ho to local vakil ya police se turant contact karein.
        </p>
      </div>
    </div>
  );
}

function StructuredReply({ content }) {
  if (typeof content === "string") {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  return (
    <div className="space-y-3">
      {content.topic && <div className="text-base font-semibold text-white">{content.topic}</div>}
      {content.simple_explanation && (
        <div className="whitespace-pre-wrap break-words">{content.simple_explanation}</div>
      )}
      {Array.isArray(content.rules) && content.rules.length > 0 && (
        <SectionList title="Rules" items={content.rules} />
      )}
      {Array.isArray(content.penalties) && content.penalties.length > 0 && (
        <SectionList title="Penalties" items={content.penalties} />
      )}
      {Array.isArray(content.user_guidance) && content.user_guidance.length > 0 && (
        <SectionList title="What You Should Do" items={content.user_guidance} />
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
