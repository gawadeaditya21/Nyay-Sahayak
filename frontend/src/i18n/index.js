import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resolveLanguage } from "../config/languages.js";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import hinglish from "./locales/hinglish.json";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  hinglish: { translation: hinglish },
};

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    return resolveLanguage(localStorage.getItem("nyaySahayakLanguage") || "en");
  } catch {
    return "en";
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
