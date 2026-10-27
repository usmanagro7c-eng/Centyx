import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Accessibility as A11yIcon, Eye, Contrast, Type, MousePointer2, Keyboard,
  Volume2, RotateCcw, Check, Sparkles, Baseline, Zap,
} from "lucide-react";
import { Breadcrumb, Header, GlassCard, FieldGroup } from "@/components/dashboard/glass-form";
import { cn } from "@/lib/utils";
import {
  useA11y,
  type ColorBlindMode, type TextSize, type FontChoice, type CursorSize,
} from "@/lib/a11y-store";

export const Route = createFileRoute("/dashboard/accessibility")({
  head: () => ({ meta: [{ title: "Accessibility — Aether" }] }),
  component: AccessibilityPage,
});

const COLOR_BLIND: { id: ColorBlindMode; label: string; desc: string; swatch: string[] }[] = [
  { id: "normal",        label: "Normal Vision",  desc: "Default palette. No adjustments.",                     swatch: ["#7c3aed", "#06b6d4", "#ec4899", "#ef4444"] },
  { id: "protanopia",    label: "Protanopia",     desc: "Red-blind. Uses blue / yellow safe hues.",             swatch: ["#2b6cb0", "#5b8def", "#e9c46a", "#4a5568"] },
  { id: "deuteranopia",  label: "Deuteranopia",   desc: "Green-blind. Uses blue / orange safe hues.",           swatch: ["#1d4ed8", "#60a5fa", "#f59e0b", "#7c2d12"] },
  { id: "tritanopia",    label: "Tritanopia",     desc: "Blue-blind. Uses teal / red safe hues.",               swatch: ["#0d9488", "#14b8a6", "#dc2626", "#991b1b"] },
  { id: "achromatopsia", label: "Achromatopsia",  desc: "Full monochrome. Contrast-only palette.",              swatch: ["#111827", "#4b5563", "#9ca3af", "#e5e7eb"] },
];

const TEXT_SIZES: { id: TextSize; label: string; px: string }[] = [
  { id: "sm", label: "Small",       px: "14px" },
  { id: "md", label: "Medium",      px: "16px" },
  { id: "lg", label: "Large",       px: "18px" },
  { id: "xl", label: "Extra Large", px: "20px" },
];

const CURSORS: { id: CursorSize; label: string; sz: number }[] = [
  { id: "normal", label: "Normal",      sz: 16 },
  { id: "large",  label: "Large",       sz: 26 },
  { id: "xl",     label: "Extra Large", sz: 38 },
];

const FONTS: { id: FontChoice; label: string; sample: string; family: string }[] = [
  { id: "default",  label: "Default",      sample: "Aa",  family: "var(--font-sans)" },
  { id: "dyslexic", label: "OpenDyslexic", sample: "Aa",  family: "OpenDyslexic, sans-serif" },
];

function AccessibilityPage() {
  const s = useA11y();

  const active =
    (s.colorBlind !== "normal" ? 1 : 0) +
    (s.highContrast ? 1 : 0) +
    (s.textSize !== "md" ? 1 : 0) +
    (s.font !== "default" ? 1 : 0) +
    (s.reduceMotion ? 1 : 0) +
    (s.cursorSize !== "normal" ? 1 : 0) +
    (s.keyboardNav ? 1 : 0) +
    (s.focusRing ? 1 : 0) +
    (s.screenReader ? 1 : 0);

  return (
    <div className="space-y-6">
      <Breadcrumb label="Accessibility" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header
          icon={A11yIcon}
          title="Accessibility Center"
          subtitle="Personalize how Aether looks, feels and responds. Every change is saved automatically."
        />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass border border-white/10 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {active} preference{active === 1 ? "" : "s"} enabled
          </span>
          <button
            type="button"
            onClick={() => s.reset()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VISION — color blind */}
        <GlassCard
          title="Vision"
          desc="Choose a color-blind safe palette. The entire app re-tints instantly."
          className="lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            Color Blind Mode — only one can be active at a time
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {COLOR_BLIND.map((m, i) => {
              const isActive = s.colorBlind === m.id;
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -2 }}
                  onClick={() => s.setColorBlind(m.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative text-left rounded-2xl glass border p-4 transition",
                    isActive ? "border-primary/60 shadow-glow bg-white/[0.04]" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-1 mb-3">
                    {m.swatch.map((c, idx) => (
                      <span key={idx} className="h-5 w-5 rounded-md ring-1 ring-black/10" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-1 leading-snug">{m.desc}</div>
                  {isActive && (
                    <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-gradient shadow-glow">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </GlassCard>

        {/* HIGH CONTRAST */}
        <GlassCard title="High Contrast" desc="Stronger borders, deeper text, non-transparent surfaces.">
          <ToggleRow
            icon={Contrast}
            label="High contrast mode"
            desc="Increases contrast across buttons, cards, tables and forms. Works with light and dark themes."
            checked={s.highContrast}
            onChange={s.setHighContrast}
          />
        </GlassCard>

        {/* REDUCE MOTION */}
        <GlassCard title="Motion" desc="Reduce animations, parallax and hover effects.">
          <ToggleRow
            icon={Zap}
            label="Reduce motion"
            desc="Disables floating, pulsing, parallax and long transitions across the app."
            checked={s.reduceMotion}
            onChange={s.setReduceMotion}
          />
        </GlassCard>

        {/* TEXT SIZE */}
        <GlassCard title="Text Size" desc="Scales every text element proportionally.">
          <FieldGroup label="Base size">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEXT_SIZES.map(t => {
                const isActive = s.textSize === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => s.setTextSize(t.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "relative rounded-xl glass border p-3 text-center transition",
                      isActive ? "border-primary/60 shadow-glow" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <Baseline
                      className="mx-auto mb-1"
                      style={{ width: 14 + TEXT_SIZES.indexOf(t) * 3, height: 14 + TEXT_SIZES.indexOf(t) * 3 }}
                    />
                    <div className="text-xs font-medium">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.px}</div>
                  </button>
                );
              })}
            </div>
          </FieldGroup>
        </GlassCard>

        {/* FONT */}
        <GlassCard title="Font" desc="Switch to a dyslexia-friendly typeface.">
          <div className="grid grid-cols-2 gap-3">
            {FONTS.map(f => {
              const isActive = s.font === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => s.setFont(f.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl glass border p-3 text-left transition",
                    isActive ? "border-primary/60 shadow-glow" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-lg"
                    style={{ fontFamily: f.family }}
                  >
                    {f.sample}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {f.id === "dyslexic" ? "OpenDyslexic — easier for dyslexia" : "Inter / Space Grotesk"}
                    </div>
                  </div>
                  {isActive && (
                    <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* CURSOR */}
        <GlassCard title="Cursor" desc="Enlarge the pointer for easier targeting.">
          <div className="grid grid-cols-3 gap-2">
            {CURSORS.map(c => {
              const isActive = s.cursorSize === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => s.setCursorSize(c.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative rounded-xl glass border p-4 text-center transition",
                    isActive ? "border-primary/60 shadow-glow" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <MousePointer2
                    className="mx-auto mb-2"
                    style={{ width: c.sz, height: c.sz }}
                  />
                  <div className="text-xs font-medium">{c.label}</div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* KEYBOARD */}
        <GlassCard title="Keyboard" desc="Better focus indicators and keyboard-only workflows.">
          <div className="space-y-3">
            <ToggleRow
              icon={Keyboard}
              label="Keyboard navigation"
              desc="Enable enhanced tab, arrow and escape shortcuts across menus, dialogs and tables."
              checked={s.keyboardNav}
              onChange={s.setKeyboardNav}
            />
            <div className="h-px bg-white/[0.06]" />
            <ToggleRow
              icon={Type}
              label="Prominent focus ring"
              desc="Draws a thicker focus outline on every interactive element."
              checked={s.focusRing}
              onChange={s.setFocusRing}
            />
            <div className="rounded-xl glass border border-white/10 p-3 text-[11.5px] text-muted-foreground leading-relaxed">
              A <span className="text-foreground font-medium">Skip to main content</span> link is always available on{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Tab</kbd> from the top of any page.
            </div>
          </div>
        </GlassCard>

        {/* SCREEN READER */}
        <GlassCard title="Screen Reader" desc="Optimize ARIA, live regions and semantic order.">
          <ToggleRow
            icon={Volume2}
            label="Screen reader optimizations"
            desc="Announce route changes, table actions and toasts through polite live regions."
            checked={s.screenReader}
            onChange={s.setScreenReader}
          />
        </GlassCard>

        {/* PREVIEW */}
        <GlassCard title="Preview" desc="Every control below reflects your current preferences." className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl glass border border-white/10 p-4">
              <div className="text-xs text-muted-foreground mb-2">Buttons</div>
              <div className="flex flex-wrap gap-2">
                <button className="h-9 px-3.5 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow">Primary</button>
                <button className="h-9 px-3.5 rounded-xl glass border border-white/10 text-sm">Secondary</button>
                <button className="h-9 px-3.5 rounded-xl border border-destructive/50 text-destructive text-sm">Destructive</button>
              </div>
            </div>
            <div className="rounded-xl glass border border-white/10 p-4">
              <div className="text-xs text-muted-foreground mb-2">Form</div>
              <label htmlFor="a11y-preview-input" className="sr-only">Sample email</label>
              <input
                id="a11y-preview-input"
                type="email"
                placeholder="you@example.com"
                className="w-full h-9 px-3 rounded-xl bg-background/60 border border-white/10 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="rounded-xl glass border border-white/10 p-4">
              <div className="text-xs text-muted-foreground mb-2">Typography</div>
              <h4 className="text-lg font-semibold">Aether — accessible by default</h4>
              <p className="text-sm text-muted-foreground mt-1">
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon, label, desc, checked, onChange,
}: {
  icon: any; label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass border border-white/10">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {desc && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</div>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 border",
          checked ? "bg-primary-gradient border-transparent shadow-glow" : "bg-white/[0.05] border-white/10"
        )}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ left: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
