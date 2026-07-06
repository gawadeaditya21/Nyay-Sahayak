export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "mr", label: "Marathi", native: "मराठी", dir: "ltr" },
  { code: "bn", label: "Bengali", native: "বাংলা", dir: "ltr" },
  { code: "ta", label: "Tamil", native: "தமிழ்", dir: "ltr" },
  { code: "te", label: "Telugu", native: "తెలుగు", dir: "ltr" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", dir: "ltr" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", dir: "ltr" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", dir: "ltr" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ", dir: "ltr" },
  { code: "ur", label: "Urdu", native: "اردو", dir: "rtl" },
  { code: "hinglish", label: "Hinglish", native: "Hinglish", dir: "ltr" },
];

export function resolveLanguage(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return DEFAULT_LANGUAGE;

  const byCode = SUPPORTED_LANGUAGES.find((lang) => lang.code === raw);
  if (byCode) return byCode.code;

  return DEFAULT_LANGUAGE;
}

