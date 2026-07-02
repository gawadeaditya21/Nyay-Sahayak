import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, PencilLine, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";
import { sanitizeComplaintText } from "../../utils/complaintText";

export default function FIRDraftCard({
  firText,
  editable = false,
  onChange,
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const cleanedText = useMemo(() => sanitizeComplaintText(firText), [firText]);
  const hasText = cleanedText.length > 0;

  useEffect(() => {
    if (!editable || !onChange || !textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [cleanedText, editable, onChange]);

  const handleCopy = async () => {
    if (!hasText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!hasText) {
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    const lines = doc.splitTextToSize(cleanedText, maxWidth);

    doc.setFont("Times", "Normal");
    doc.setFontSize(12);
    doc.text(lines, margin, 60);
    doc.save("FIR_Complaint.pdf");
  };

  const handleEdit = (event) => {
    if (!onChange) {
      return;
    }

    onChange(sanitizeComplaintText(event.target.value));
  };

  return (
    <div className="flex h-full w-full flex-col rounded-[2rem] border border-white/10 bg-[#10131d]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
            <Sparkles size={12} />
            Complaint Draft
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-white">Your complaint letter</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {hasText
              ? "Review and refine the final draft before copying or exporting it."
              : "Your generated complaint will appear here after you click generate."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!hasText}
            className="inline-flex items-center gap-2 rounded-full border border-slate-400/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy size={14} />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!hasText}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {!hasText ? (
        <div className="mt-4 flex min-h-[420px] flex-1 items-center justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-[#0a0a0b] px-6 py-10 text-center">
          <div className="max-w-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <PencilLine size={22} />
            </div>
            <h4 className="mt-4 text-lg font-semibold text-white">Draft preview</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Paste or generate your complaint summary to see the final letter here.
            </p>
          </div>
        </div>
      ) : editable && onChange ? (
        <textarea
          ref={textareaRef}
          value={cleanedText}
          onChange={handleEdit}
          rows={12}
          className="mt-4 min-h-[420px] flex-1 resize-none overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0a0a0b] p-5 font-serif text-[15px] leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
        />
      ) : (
        <div className="mt-4 flex-1 rounded-[1.6rem] border border-white/10 bg-[#0a0a0b] p-5 font-serif text-[15px] leading-7 text-slate-100 shadow-inner">
          <pre className="whitespace-pre-wrap font-serif">{cleanedText}</pre>
        </div>
      )}

      {hasText && (
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
          <span>{cleanedText.split(/\s+/).filter(Boolean).length} words</span>
          <span>{editable && onChange ? "Editable draft" : "Ready to copy"}</span>
        </div>
      )}
    </div>
  );
}
