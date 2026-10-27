import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useLocale } from "@/lib/locale-store";
import { TRANSLATIONS, en } from "./translations";

/** Build i18next resources from our flat dictionaries. */
const resources = Object.fromEntries(
  Object.entries(TRANSLATIONS).map(([lng, dict]) => [lng, { translation: dict }])
);

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    // Default to English until the locale store hydrates from localStorage.
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    // Our keys use dots as delimiters, not nested namespaces.
    keySeparator: false,
    nsSeparator: false,
    returnEmptyString: false,
  });
}

export { i18n };

/** All translation keys as a union (based on English master dict). */
export type TKey = keyof typeof en;

/**
 * Reactive `t()` hook. Prefer this everywhere.
 * Falls back to English, then to the raw key, so nothing renders blank.
 */
export function useT() {
  const { t } = useTranslation();
  return (key: TKey | string, fallback?: string): string => {
    const v = t(key, { defaultValue: fallback ?? (en as Record<string, string>)[key as string] ?? key });
    return String(v);
  };
}

/**
 * Bridges the persistent `useLocale` Zustand store to i18next so a language
 * change anywhere in the app instantly re-renders every consumer of `useT()`.
 * Must be mounted once, high in the tree.
 */
export function I18nSync() {
  const language = useLocale((s) => s.language);
  useEffect(() => {
    const target = TRANSLATIONS[language] ? language : "en";
    if (i18n.language !== target) void i18n.changeLanguage(target);
  }, [language]);
  return null;
}
