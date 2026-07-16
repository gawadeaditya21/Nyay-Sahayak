import { useState } from "react";
import { FileSignature, Send, X, Mic, MicOff, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useVoiceInput } from "../../hooks/useVoiceInput";

export default function FIRInputCard({ onSubmit, onCancel, defaultValue = "" }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);

  const handleVoiceResult = (transcript) => {
    setValue((prev) => (prev ? prev + " " + transcript : transcript));
  };
  
  const { isListening, toggleListening, isSupported, interimResult, error } = useVoiceInput(handleVoiceResult);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)]/80 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300">
            <FileSignature size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{t("fir.cardLabel")}</span>
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--color-text-main)]">{t("fir.describeComplaint")}</h3>
          <div className="mt-2.5 flex items-center gap-1.5 w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={12} />
            {t("trust.dataConfidential", "Data is 100% Confidential")}
          </div>
          <p className="mt-2 text-sm text-slate-500">{t("fir.describeComplaintHelp")}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-main)] bg-white/5 text-[var(--color-text-main)] hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <div className="relative">
        {isListening && (
          <div className="absolute -top-14 left-0 right-0 mb-2 flex items-center gap-3 rounded-2xl bg-indigo-500/10 px-4 py-3 border border-indigo-500/20 text-sm text-indigo-300 backdrop-blur-md z-10">
            <div className="flex gap-1 shrink-0">
              <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0ms' }} />
              <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
              <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="italic line-clamp-1 truncate">{interimResult || "Listening..."}</span>
          </div>
        )}
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("fir.cardPlaceholder")}
          className="mt-4 min-h-35 w-full resize-none rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-main)] px-4 py-3 pb-12 text-sm text-[var(--color-text-main)] outline-none focus:border-indigo-500"
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'text-slate-400 hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-main)]'
            }`}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-rose-400 font-semibold px-2">
          Voice recognition error: {error}. Please try again or check microphone permissions.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          <Send size={14} />
          {t("fir.generateDraft")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-main)] bg-white/5 px-5 py-2 text-xs font-semibold text-[var(--color-text-main)] hover:bg-white/10"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
