import { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../i18n";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, resolveLanguage } from "../config/languages";
import { updateLanguagePreference } from "../services/api";

const LANGUAGE_STORAGE_KEY = "nyaySahayakLanguage";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  languages: SUPPORTED_LANGUAGES,
});

export function LanguageProvider({ children }) {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const getStoredUser = () => {
    try {
      const rawUser = localStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  };

  const initialLanguage = resolveLanguage(
    stored || getStoredUser()?.preferredLanguage || DEFAULT_LANGUAGE
  );

  const [language, setLanguageState] = useState(initialLanguage);

  const setLanguage = (nextLanguage) => {
    const resolved = resolveLanguage(nextLanguage);
    setLanguageState(resolved);
    void i18n.changeLanguage(resolved);
  };

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

    const user = getStoredUser();
    if (user?.id) {
      updateLanguagePreference(user.id, language).catch(() => {});
    }
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, languages: SUPPORTED_LANGUAGES }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
