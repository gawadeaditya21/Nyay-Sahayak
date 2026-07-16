import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Sparkles, FileSearch, MessageSquareText, FileText } from 'lucide-react';

export default function DashboardEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="mt-6 rounded-3xl border border-[var(--color-border-main)] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.1),transparent_70%),var(--color-bg-surface)] p-8 sm:p-12 text-center shadow-xl">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
        <Sparkles size={28} />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-[var(--color-text-main)]">
        {t("week3.empty.dashboardTitle", "Your journey starts here")}
      </h3>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400">
        {t("week3.empty.dashboardDesc", "You haven't saved any chats or documents yet. Choose an option below to get started.")}
      </p>

      <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
        <Link to="/chat" className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-main)] p-6 transition-all hover:border-sky-500/50 hover:bg-sky-500/5 hover:shadow-lg hover:shadow-sky-500/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition-transform group-hover:scale-110">
            <MessageSquareText size={22} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-main)]">{t("nav.chat", "Ask AI")}</span>
        </Link>
        <Link to="/analyze" className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-main)] p-6 transition-all hover:border-violet-500/50 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 transition-transform group-hover:scale-110">
            <FileSearch size={22} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-main)]">{t("nav.analyze", "Analyze Document")}</span>
        </Link>
        <Link to="/fir" className="group flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-main)] p-6 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-transform group-hover:scale-110">
            <FileText size={22} />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-main)]">{t("nav.fir", "Generate FIR")}</span>
        </Link>
      </div>
    </div>
  );
}
