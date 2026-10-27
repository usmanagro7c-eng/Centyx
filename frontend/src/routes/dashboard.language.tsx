import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "motion/react";
import { Globe, Check, Languages, MapPin, Coins, Clock, Calendar, Hash, RotateCcw } from "lucide-react";
import { Breadcrumb, Header, GlassCard, FieldGroup } from "@/components/dashboard/glass-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  LANGUAGES, COUNTRIES, CURRENCIES, getTimezones, tzLabel,
} from "@/lib/locale-data";
import {
  useLocale, formatNumber, formatCurrency, formatDate, formatTime,
  type DateFormat, type TimeFormat, type NumberFormat,
} from "@/lib/locale-store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/language")({
  head: () => ({ meta: [{ title: "Language & Region — Aether" }] }),
  component: LanguagePage,
});

function LanguagePage() {
  const s = useLocale();
  const t = useT();

  const languageOpts = useMemo(() => LANGUAGES.map(l => ({
    value: l.code, label: l.label,
    prefix: <span className="text-base leading-none">{l.flag}</span>,
    hint: l.native, keywords: `${l.native} ${l.code}`,
  })), []);

  const countryOpts = useMemo(() => COUNTRIES.map(c => ({
    value: c.code, label: c.name,
    prefix: <span className="text-base leading-none">{c.flag}</span>,
    hint: c.code, keywords: c.currency,
  })), []);

  const currencyOpts = useMemo(() => CURRENCIES.map(c => ({
    value: c.code, label: `${c.code} — ${c.name}`,
    prefix: <span className="w-5 text-center text-xs text-muted-foreground">{c.symbol}</span>,
    hint: c.symbol, keywords: c.name,
  })), []);

  const tzOpts = useMemo(() => {
    const now = new Date();
    return getTimezones().map(tz => ({
      value: tz, label: tzLabel(tz, now),
      prefix: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
      keywords: tz.replace(/[_/]/g, " "),
    }));
  }, []);

  const preview = new Date();

  return (
    <div className="space-y-6">
      <Breadcrumb label={t("lang.title")} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header icon={Globe} title={t("lang.title")} subtitle={t("lang.subtitle")} />
        <button
          type="button"
          onClick={() => s.reset()}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {t("common.reset")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language */}
        <GlassCard title={t("lang.language")} desc={t("lang.languageDesc")}>
          <div className="mb-4">
            <FieldGroup label={t("lang.displayLanguage")}>
              <SearchableSelect
                value={s.language}
                onChange={s.setLanguage}
                options={languageOpts}
                placeholder={t("lang.chooseLanguage")}
                searchPlaceholder={t("lang.searchLanguages")}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.slice(0, 12).map((l, i) => (
              <motion.button
                key={l.code}
                type="button"
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ y: -2 }}
                onClick={() => s.setLanguage(l.code)}
                className={`relative rounded-xl glass border p-3 text-left transition ${
                  s.language === l.code ? "border-primary/50 shadow-glow" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-lg">{l.flag}</div>
                <div className="mt-1 text-sm font-medium truncate">{l.label}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{l.code}</div>
                {s.language === l.code && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-gradient">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* Region & currency */}
        <GlassCard title={t("lang.region")} desc={t("lang.regionDesc")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldGroup label={t("lang.country")}>
              <SearchableSelect
                value={s.country}
                onChange={s.setCountry}
                options={countryOpts}
                placeholder={t("lang.chooseCountry")}
                searchPlaceholder={t("lang.searchCountries")}
              />
            </FieldGroup>
            <FieldGroup label={t("lang.currency")}>
              <SearchableSelect
                value={s.currency}
                onChange={s.setCurrency}
                options={currencyOpts}
                placeholder={t("lang.chooseCurrency")}
                searchPlaceholder={t("lang.searchCurrency")}
              />
            </FieldGroup>
            <FieldGroup label={t("lang.timezone")} className="sm:col-span-2">
              <SearchableSelect
                value={s.timezone}
                onChange={s.setTimezone}
                options={tzOpts}
                placeholder={t("lang.chooseTimezone")}
                searchPlaceholder={t("lang.searchTimezones")}
              />
            </FieldGroup>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl glass border border-white/10 p-3.5">
            <div>
              <div className="text-sm font-medium">{t("lang.rtl")}</div>
              <div className="text-[11.5px] text-muted-foreground">{t("lang.rtlDesc")}</div>
            </div>
            <button
              type="button"
              onClick={() => s.setRtl(!s.rtl)}
              aria-pressed={s.rtl}
              className={`relative h-6 w-11 rounded-full transition ${s.rtl ? "bg-primary-gradient shadow-glow" : "bg-white/10"}`}
            >
              <motion.span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                animate={{ x: s.rtl ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </GlassCard>

        {/* Formats */}
        <GlassCard title={t("lang.formats")} desc={t("lang.formatsDesc")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label={t("lang.dateFormat")}>
              <SegGroup
                value={s.dateFormat}
                onChange={(v) => s.setDateFormat(v as DateFormat)}
                options={[
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                ]}
              />
            </FieldGroup>
            <FieldGroup label={t("lang.timeFormat")}>
              <SegGroup
                value={s.timeFormat}
                onChange={(v) => s.setTimeFormat(v as TimeFormat)}
                options={[
                  { value: "12h", label: t("lang.time12") },
                  { value: "24h", label: t("lang.time24") },
                ]}
              />
            </FieldGroup>
            <FieldGroup label={t("lang.numberFormat")} className="sm:col-span-2">
              <SegGroup
                value={s.numberFormat}
                onChange={(v) => s.setNumberFormat(v as NumberFormat)}
                options={[
                  { value: "1,234.56", label: "1,234.56" },
                  { value: "1.234,56", label: "1.234,56" },
                  { value: "1 234,56", label: "1 234,56" },
                  { value: "12,34,567", label: "12,34,567" },
                ]}
              />
            </FieldGroup>
          </div>
        </GlassCard>

        {/* Live preview */}
        <GlassCard title={t("lang.preview")} desc={t("lang.previewDesc")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PreviewRow icon={Languages} label={t("lang.language")} value={`${LANGUAGES.find(l => l.code === s.language)?.flag ?? ""} ${LANGUAGES.find(l => l.code === s.language)?.label ?? s.language}`} />
            <PreviewRow icon={MapPin} label={t("lang.country")} value={`${COUNTRIES.find(c => c.code === s.country)?.flag ?? ""} ${COUNTRIES.find(c => c.code === s.country)?.name ?? s.country}`} />
            <PreviewRow icon={Coins} label={t("lang.currency")} value={`${formatCurrency(1234567.89)}`} />
            <PreviewRow icon={Hash} label={t("lang.number")} value={formatNumber(1234567.89)} />
            <PreviewRow icon={Calendar} label={t("lang.date")} value={formatDate(preview)} />
            <PreviewRow icon={Clock} label={t("lang.time")} value={`${formatTime(preview)} · ${s.timezone}`} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function SegGroup({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-white/[0.03] border border-white/[0.08] p-1 gap-1 w-full overflow-hidden">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative flex-1 h-8 px-3 rounded-lg text-xs font-medium transition ${
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map(x => x.value).join("-")}`}
                className="absolute inset-0 rounded-lg bg-primary-gradient shadow-glow"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PreviewRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl glass border border-white/10 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="text-sm font-medium truncate ml-3">{value}</div>
    </div>
  );
}
