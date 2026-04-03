import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext.jsx';
import { motion } from 'framer-motion';
import { Globe, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { language, setLanguage, languages } = useLanguage();
  
  return (
    <main className="flex-1 p-6 sm:p-10 overflow-y-auto bg-[#0d0d0f] text-slate-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('settings.title') || 'Settings'}</h1>
          <p className="mt-2 text-sm text-slate-400">Manage your account preferences and application settings.</p>
        </div>
        
        <div className="rounded-[28px] border border-white/5 bg-[#121215] shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Globe size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('settings.preferences') || 'Preferences'}</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-white/5 gap-4">
              <div>
                <h3 className="text-base font-medium text-slate-200">{t('settings.language') || 'Language'}</h3>
                <p className="text-xs text-slate-500 mt-1">Select your preferred language for the legal assistant interface.</p>
              </div>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-white transition-all cursor-pointer hover:border-white/20"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/5 bg-[#121215]/50 shadow-xl overflow-hidden backdrop-blur-md opacity-60">
          <div className="p-6 sm:p-8 space-y-6 pointer-events-none">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/5 rounded-xl">
                <User size={20} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Account Details</h2>
            </div>
            <div className="py-4 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-medium text-slate-200">Basic Plan</h3>
                <p className="text-xs text-slate-500 mt-1">Manage billing and features.</p>
              </div>
              {/* <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg">Professional</span> */}
            </div>
          </div>
        </div>

      </motion.div>
    </main>
  );
}