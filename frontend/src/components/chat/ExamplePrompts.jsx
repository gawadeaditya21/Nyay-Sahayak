import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Users, ShoppingBag, Briefcase, AlertOctagon } from 'lucide-react';

/**
 * ExamplePrompts - Renders categorized example prompts to help users start
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when a prompt is clicked
 * @returns {JSX.Element}
 */
export default function ExamplePrompts({ onSelect }) {
  const { t } = useTranslation();

  const categories = [
    {
      id: 'property',
      icon: <Home size={16} className="text-blue-400" />,
      title: t('week3.prompts.catProperty', 'Property & Land'),
      prompts: [
        t('week3.prompts.prop1', 'Landlord illegally evicting me, what to do?'),
        t('week3.prompts.prop2', 'Neighbor encroaching on my land'),
        t('week3.prompts.prop3', 'Property dispute with siblings')
      ]
    },
    {
      id: 'family',
      icon: <Users size={16} className="text-pink-400" />,
      title: t('week3.prompts.catFamily', 'Family Law'),
      prompts: [
        t('week3.prompts.fam1', 'How to file for divorce?'),
        t('week3.prompts.fam2', 'Child custody laws in India'),
        t('week3.prompts.fam3', 'Domestic violence complaint process')
      ]
    },
    {
      id: 'consumer',
      icon: <ShoppingBag size={16} className="text-green-400" />,
      title: t('week3.prompts.catConsumer', 'Consumer Rights'),
      prompts: [
        t('week3.prompts.con1', 'Product defective, seller refusing refund'),
        t('week3.prompts.con2', 'Online shopping fraud, what to do?'),
        t('week3.prompts.con3', 'Bank charging hidden fees')
      ]
    },
    {
      id: 'employment',
      icon: <Briefcase size={16} className="text-orange-400" />,
      title: t('week3.prompts.catEmployment', 'Employment'),
      prompts: [
        t('week3.prompts.emp1', 'Employer not paying salary'),
        t('week3.prompts.emp2', 'Wrongful termination steps'),
        t('week3.prompts.emp3', 'Sexual harassment at workplace')
      ]
    },
    {
      id: 'criminal',
      icon: <AlertOctagon size={16} className="text-red-400" />,
      title: t('week3.prompts.catCriminal', 'Criminal'),
      prompts: [
        t('week3.prompts.crim1', 'Cyber crime, how to file FIR?'),
        t('week3.prompts.crim2', 'Theft happened, what to do?'),
        t('week3.prompts.crim3', 'Someone threatening me online')
      ]
    }
  ];

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {t('week3.prompts.tryAsking', 'Try asking about:')}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(cat => (
          <div key={cat.id} className="rounded-2xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/50">
            <div className="mb-3 flex items-center gap-2 font-medium text-[var(--color-text-main)]">
              {cat.icon}
              {cat.title}
            </div>
            <div className="flex flex-col gap-2">
              {cat.prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect(prompt)}
                  className="text-left text-sm text-slate-500 hover:text-indigo-400 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                  aria-label={`Ask: ${prompt}`}
                >
                  &quot;{prompt}&quot;
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
