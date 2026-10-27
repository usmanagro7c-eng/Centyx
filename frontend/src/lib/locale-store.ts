import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LANGUAGES, COUNTRIES, CURRENCIES } from "./locale-data";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12h" | "24h";
export type NumberFormat = "1,234.56" | "1.234,56" | "1 234,56" | "12,34,567";

export type LocaleState = {
  language: string;      // e.g. "en", "ur", "zh-CN"
  country: string;       // ISO 3166-1 alpha-2
  currency: string;      // ISO 4217
  timezone: string;      // IANA
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
  rtl: boolean;

  setLanguage: (code: string) => void;
  setCountry: (code: string) => void;
  setCurrency: (code: string) => void;
  setTimezone: (tz: string) => void;
  setDateFormat: (f: DateFormat) => void;
  setTimeFormat: (f: TimeFormat) => void;
  setNumberFormat: (f: NumberFormat) => void;
  setRtl: (v: boolean) => void;
  reset: () => void;
};

const defaultTz = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
})();

const initial = {
  language: "en",
  country: "US",
  currency: "USD",
  timezone: defaultTz,
  dateFormat: "MM/DD/YYYY" as DateFormat,
  timeFormat: "12h" as TimeFormat,
  numberFormat: "1,234.56" as NumberFormat,
  rtl: false,
};

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      ...initial,
      setLanguage: (code) => {
        const lang = LANGUAGES.find(l => l.code === code);
        set({ language: code, rtl: !!lang?.rtl });
      },
      setCountry: (code) => {
        const c = COUNTRIES.find(x => x.code === code);
        set({ country: code, ...(c ? { currency: c.currency } : {}) });
      },
      setCurrency: (code) => set({ currency: code }),
      setTimezone: (tz) => set({ timezone: tz }),
      setDateFormat: (f) => set({ dateFormat: f }),
      setTimeFormat: (f) => set({ timeFormat: f }),
      setNumberFormat: (f) => set({ numberFormat: f }),
      setRtl: (v) => set({ rtl: v }),
      reset: () => set(initial),
    }),
    { name: "aether-locale" }
  )
);

/* ---------- Formatters ---------- */

const NF_LOCALE: Record<NumberFormat, string> = {
  "1,234.56": "en-US",
  "1.234,56": "de-DE",
  "1 234,56": "fr-FR",
  "12,34,567": "en-IN",
};

export function formatNumber(n: number, fmt?: NumberFormat): string {
  const f = fmt ?? useLocale.getState().numberFormat;
  try { return new Intl.NumberFormat(NF_LOCALE[f]).format(n); } catch { return String(n); }
}

export function formatCurrency(amount: number, currency?: string, fmt?: NumberFormat): string {
  const cur = currency ?? useLocale.getState().currency;
  const f = fmt ?? useLocale.getState().numberFormat;
  const sym = CURRENCIES.find(c => c.code === cur)?.symbol ?? "";
  try {
    return new Intl.NumberFormat(NF_LOCALE[f], { style: "currency", currency: cur, currencyDisplay: "symbol" }).format(amount);
  } catch {
    return `${sym}${formatNumber(amount, f)}`;
  }
}

export function formatDate(d: Date | string | number, opts?: { dateFormat?: DateFormat; timezone?: string }): string {
  const state = useLocale.getState();
  const df = opts?.dateFormat ?? state.dateFormat;
  const tz = opts?.timezone ?? state.timezone;
  const date = d instanceof Date ? d : new Date(d);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const dd = get("day"), mm = get("month"), yyyy = get("year");
  switch (df) {
    case "DD/MM/YYYY": return `${dd}/${mm}/${yyyy}`;
    case "MM/DD/YYYY": return `${mm}/${dd}/${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
  }
}

export function formatTime(d: Date | string | number, opts?: { timeFormat?: TimeFormat; timezone?: string }): string {
  const state = useLocale.getState();
  const tf = opts?.timeFormat ?? state.timeFormat;
  const tz = opts?.timezone ?? state.timezone;
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit",
    hour12: tf === "12h",
  }).format(date);
}

export function formatDateTime(d: Date | string | number): string {
  return `${formatDate(d)} ${formatTime(d)}`;
}
