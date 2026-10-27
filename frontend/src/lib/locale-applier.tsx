import { useEffect } from "react";
import { useLocale } from "@/lib/locale-store";

/** Applies the current language & direction to <html> whenever it changes. */
export function LocaleApplier() {
  const language = useLocale(s => s.language);
  const rtl = useLocale(s => s.rtl);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", language || "en");
    html.setAttribute("dir", rtl ? "rtl" : "ltr");
  }, [language, rtl]);

  return null;
}
