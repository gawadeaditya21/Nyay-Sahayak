import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import ExamplePrompts from './ExamplePrompts';

/**
 * ChatWelcome - Custom welcome screen for empty chat states
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onPromptSelect - Callback when example is clicked
 * @returns {JSX.Element}
 */
export default function ChatWelcome({ onPromptSelect }) {
  const { t } = useTranslation();

  return (
    <div className="mb-8 w-full max-w-4xl rounded-[28px] border border-[var(--color-border-main)] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_50%),#121215] p-6 sm:p-8 shadow-2xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-main)]">{t("chat.title", "AI Legal Assistant")}</h1>
          <p className="text-sm text-slate-400">{t("chat.subtitle", "Ask anything about Indian Law")}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">
        {t("week3.chat.welcomeDesc", "I am your AI legal assistant. I can help you understand laws, draft documents, or guide you on how to file an FIR. Start by typing below or pick an example to begin.")}
      </p>
      
      <ExamplePrompts onSelect={onPromptSelect} />
    </div>
  );
}
