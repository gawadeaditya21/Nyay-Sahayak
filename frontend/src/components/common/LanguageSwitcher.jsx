import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { updateLanguagePreference } from '../../services/api';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    // Sync RTL direction
    document.documentElement.dir = currentLang.dir;
    document.documentElement.lang = currentLang.code;
  }, [currentLang]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.id) {
          await updateLanguagePreference(user.id, langCode);
        }
      }
    } catch (err) {
      console.error("Failed to sync language preference with backend", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe size={16} className="text-indigo-400" />
        <span className="text-sm font-medium hidden sm:block">{currentLang.native}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 max-h-80 overflow-y-auto rounded-xl bg-[#121214] border border-white/10 shadow-2xl z-50">
          <ul role="listbox" className="p-2 space-y-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLang.code === lang.code;
              return (
                <li key={lang.code}>
                  <button
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold' 
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[13px]">{lang.native}</span>
                      {lang.code !== 'en' && lang.code !== 'hinglish' && (
                        <span className="text-[10px] text-slate-500">{lang.label}</span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-indigo-400" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
