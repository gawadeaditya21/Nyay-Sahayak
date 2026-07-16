import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  BarChart3,
  FileSearch,
  FileText,
  Loader2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchDashboardSummary } from "../services/api";
import { isGuestUser } from "../utils/guestIdentity";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";

const emptyDashboard = {
  totals: {
    chats: 0,
    analyses: 0,
    firs: 0,
    messages: 0,
    analysisRecords: 0,
    overall: 0,
  },
  weeklyActivity: {
    chats: 0,
    analyses: 0,
    firs: 0,
  },
  recentActivity: [],
  lastActivity: null,
};

const activityMeta = {
  chat: {
    labelKey: "dashboard.labels.chats",
    icon: MessageSquareText,
    color: "text-sky-300",
    bg: "bg-sky-500/10",
    bar: "bg-sky-500/60",
    border: "border-sky-500/20",
  },
  analysis: {
    labelKey: "dashboard.labels.analyses",
    icon: FileSearch,
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    bar: "bg-violet-500/60",
    border: "border-violet-500/20",
  },
  fir: {
    labelKey: "dashboard.labels.firs",
    icon: FileText,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500/60",
    border: "border-emerald-500/20",
  },
};

function getDateLocale(language) {
  if (language === "hi") return "hi-IN";
  if (language === "mr") return "mr-IN";
  return "en-IN";
}

function formatDateForLanguage(value, fallback, language) {
  if (!value) return fallback;
  return new Date(value).toLocaleString(getDateLocale(language), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(value, t) {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
  if (diffMinutes < 60) return t("dashboard.time.minutesAgo", { count: diffMinutes });
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return t("dashboard.time.hoursAgo", { count: diffHours });
  const diffDays = Math.round(diffHours / 24);
  return t("dashboard.time.daysAgo", { count: diffDays });
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isGuestUser()) {
      navigate("/chat", { replace: true });
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchDashboardSummary();
        setDashboard(response?.data || emptyDashboard);
      } catch (err) {
        setError(err.message || t("dashboard.errors.load"));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, t]);

  const totalWeekly = useMemo(
    () =>
      dashboard.weeklyActivity.chats +
      dashboard.weeklyActivity.analyses +
      dashboard.weeklyActivity.firs,
    [dashboard]
  );

  const statCards = [
    {
      label: t("dashboard.labels.overall"),
      value: dashboard.totals.overall,
      detail: t("dashboard.details.messages", { count: dashboard.totals.messages }),
      icon: Activity,
      accent: "text-indigo-300",
      bg: "bg-indigo-500/10",
    },
    {
      label: t("dashboard.labels.chats"),
      value: dashboard.totals.chats,
      detail: t("dashboard.details.chatSessions"),
      icon: MessageSquareText,
      accent: "text-sky-300",
      bg: "bg-sky-500/10",
    },
    {
      label: t("dashboard.labels.analyses"),
      value: dashboard.totals.analyses,
      detail: t("dashboard.details.analysisRecords", { count: dashboard.totals.analysisRecords }),
      icon: FileSearch,
      accent: "text-violet-300",
      bg: "bg-violet-500/10",
    },
    {
      label: t("dashboard.labels.firs"),
      value: dashboard.totals.firs,
      detail: t("dashboard.details.firDrafts"),
      icon: FileText,
      accent: "text-emerald-300",
      bg: "bg-emerald-500/10",
    },
  ];

  const weeklyRows = [
    { type: "chat", value: dashboard.weeklyActivity.chats },
    { type: "analysis", value: dashboard.weeklyActivity.analyses },
    { type: "fir", value: dashboard.weeklyActivity.firs },
  ];

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto overflow-x-hidden bg-[var(--color-bg-main)] text-[var(--color-text-main)]">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
              {t("dashboard.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {t("dashboard.lastSaved")}: {formatDateForLanguage(dashboard.lastActivity, t("dashboard.empty.noSaved"), i18n.language)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={18} />
              {t("dashboard.loggedInHistory")}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-10 flex min-h-[360px] items-center justify-center rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)]">
            <div className="flex items-center gap-3 text-sm text-indigo-300">
              <Loader2 size={20} className="animate-spin" />
              {t("dashboard.loading")}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="min-w-0 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-5 shadow-xl"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} ${card.accent}`}>
                      <Icon size={21} />
                    </div>
                    <p className="mt-5 text-3xl font-semibold text-[var(--color-text-main)]">{card.value}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[var(--color-text-main)]">{card.label}</p>
                    <p className="mt-2 break-words text-xs text-slate-500">{card.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
              <div className="min-w-0 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-main)]">{t("dashboard.pastSevenDays")}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {t("dashboard.savedActivities", { count: totalWeekly })}
                    </p>
                  </div>
                  <BarChart3 size={22} className="text-indigo-300" />
                </div>

                <div className="mt-6 space-y-5">
                  {weeklyRows.map((row) => {
                    const meta = activityMeta[row.type];
                    const width = totalWeekly > 0 ? Math.max((row.value / totalWeekly) * 100, 8) : 0;
                    return (
                      <div key={row.type}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="min-w-0 break-words pr-3 font-semibold text-[var(--color-text-main)]">
                            {t(meta.labelKey)}
                          </span>
                          <span className={meta.color}>{row.value}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full ${meta.bar}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-main)]">{t("dashboard.recentActivity")}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t("dashboard.recentSubtitle")}</p>
                  </div>
                </div>

                {dashboard.recentActivity.length === 0 ? (
                  <DashboardEmptyState />
                ) : (
                  <div className="mt-6 space-y-3">
                    {dashboard.recentActivity.map((item) => {
                      const meta = activityMeta[item.type] || activityMeta.chat;
                      const Icon = meta.icon;
                      return (
                        <Link
                          key={`${item.type}-${item.sessionId}-${item.createdAt}`}
                          to={item.route}
                          className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-main)] p-4 transition hover:border-indigo-400/40 hover:bg-white/[0.07] sm:flex-row sm:items-center"
                        >
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.border} ${meta.bg} ${meta.color}`}>
                            <Icon size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[var(--color-text-main)]">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{t(meta.labelKey)}</p>
                          </div>
                          <div className="w-full shrink-0 text-left text-xs text-slate-500 sm:w-auto sm:text-right">
                            <p>{getRelativeTime(item.createdAt, t)}</p>
                            <p className="mt-1 break-words">{formatDateForLanguage(item.createdAt, "", i18n.language)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
