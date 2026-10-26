import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type Dictionary, type Language } from "./en";
import { ta } from "./ta";

const STORAGE_KEY = "surakshit.lang";

interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ta" ? "ta" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Private browsing can block storage. The choice still applies for this visit.
    }
  }, [language]);

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t: language === "ta" ? ta : en }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}
