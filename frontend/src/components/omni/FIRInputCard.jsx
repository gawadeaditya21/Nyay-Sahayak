import { useState } from "react";
import { FileSignature, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FIRInputCard({ onSubmit, onCancel, defaultValue = "" }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300">
            <FileSignature size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{t("fir.cardLabel")}</span>
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">{t("fir.describeComplaint")}</h3>
          <p className="mt-1 text-sm text-slate-400">{t("fir.describeComplaintHelp")}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("fir.cardPlaceholder")}
        className="mt-4 min-h-35 w-full resize-none rounded-2xl border border-white/10 bg-[#0a0a0b] px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500"
      />

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
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
