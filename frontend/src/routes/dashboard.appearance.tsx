import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Palette, Moon, Sun, Monitor, Sparkles, Check } from "lucide-react";
import { Breadcrumb, Header, GlassCard, SaveButton } from "@/components/dashboard/glass-form";

export const Route = createFileRoute("/dashboard/appearance")({
  head: () => ({ meta: [{ title: "Appearance — Aether" }] }),
  component: AppearancePage,
});

const THEMES = [
  { key: "dark", label: "Dark", icon: Moon, preview: "from-slate-900 via-slate-800 to-slate-900" },
  { key: "light", label: "Light", icon: Sun, preview: "from-slate-100 via-white to-slate-100" },
  { key: "system", label: "System", icon: Monitor, preview: "from-slate-900 via-slate-500 to-slate-100" },
];

const ACCENTS = [
  { key: "violet", label: "Violet", css: "linear-gradient(135deg, oklch(0.68 0.24 295), oklch(0.72 0.22 340))" },
  { key: "cyan",   label: "Cyan",   css: "linear-gradient(135deg, oklch(0.78 0.18 210), oklch(0.68 0.20 260))" },
  { key: "emerald",label: "Emerald",css: "linear-gradient(135deg, oklch(0.75 0.20 160), oklch(0.72 0.20 190))" },
  { key: "sunset", label: "Sunset", css: "linear-gradient(135deg, oklch(0.75 0.22 40),  oklch(0.68 0.22 20))" },
  { key: "rose",   label: "Rose",   css: "linear-gradient(135deg, oklch(0.72 0.22 10),  oklch(0.70 0.22 340))" },
  { key: "graphite",label: "Graphite",css: "linear-gradient(135deg, oklch(0.5 0.02 270), oklch(0.35 0.02 270))" },
];

function AppearancePage() {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("violet");
  const [glass, setGlass] = useState(true);
  const [motionOn, setMotionOn] = useState(true);
  const [density, setDensity] = useState<"comfortable"|"compact">("comfortable");
  const [status, setStatus] = useState<"idle"|"loading"|"saved">("idle");

  const save = (e: React.FormEvent) => {
    e.preventDefault(); setStatus("loading");
    setTimeout(() => { setStatus("saved"); setTimeout(() => setStatus("idle"), 1400); }, 700);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb label="Appearance" />
      <Header icon={Palette} title="Appearance" subtitle="Theme, accents, glass effects, and motion." />

      <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard title="Theme" desc="Base color mode">
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t, i) => (
              <motion.button
                key={t.key} type="button"
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => setTheme(t.key)}
                className={`relative overflow-hidden rounded-2xl border p-3 transition ${
                  theme === t.key ? "border-primary/50 shadow-glow" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className={`h-20 rounded-xl bg-gradient-to-br ${t.preview}`} />
                <div className="mt-2 flex items-center gap-2">
                  <t.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">{t.label}</span>
                  {theme === t.key && <Check className="ml-auto h-4 w-4 text-primary" />}
                </div>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Accent color" desc="Used across CTAs, focus rings & AI glow">
          <div className="grid grid-cols-3 gap-3">
            {ACCENTS.map((a, i) => (
              <motion.button
                key={a.key} type="button"
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ y: -3 }}
                onClick={() => setAccent(a.key)}
                className={`relative rounded-2xl border p-3 transition ${
                  accent === a.key ? "border-primary/50 shadow-glow" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="h-10 rounded-xl" style={{ background: a.css }} />
                <div className="mt-2 text-xs font-medium">{a.label}</div>
                {accent === a.key && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-gradient">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Effects" desc="Glass, blur & motion">
          <div className="space-y-3">
            <ToggleRow label="Glass effects" desc="Backdrop blur, translucent panels" value={glass} onChange={setGlass} />
            <ToggleRow label="Animations" desc="Framer-quality transitions" value={motionOn} onChange={setMotionOn} />
            <div className="rounded-xl glass border border-white/10 p-3.5">
              <div className="text-sm font-medium">Density</div>
              <div className="text-[11.5px] text-muted-foreground mb-3">Spacing between elements</div>
              <div className="grid grid-cols-2 gap-2">
                {(["comfortable","compact"] as const).map(d => (
                  <button key={d} type="button" onClick={() => setDensity(d)}
                    className={`h-9 rounded-lg text-xs font-medium transition capitalize ${
                      density === d ? "bg-primary-gradient text-primary-foreground shadow-glow" : "glass hover:bg-white/10"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="Live preview" desc="See your choices">
          <div className="relative overflow-hidden rounded-2xl glass border border-white/10 p-5">
            <motion.div
              animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <div className="mt-3 font-display text-xl font-semibold">Aether preview</div>
            <div className="text-sm text-muted-foreground mt-1">Your accent, glass and motion in action.</div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex h-9 px-4 items-center rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow">Primary</span>
              <span className="inline-flex h-9 px-4 items-center rounded-xl glass border border-white/10 text-sm">Secondary</span>
            </div>
          </div>
        </GlassCard>

        <div className="lg:col-span-2 flex justify-end">
          <SaveButton status={status} label="Apply appearance" />
        </div>
      </form>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl glass border border-white/10 p-3.5">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11.5px] text-muted-foreground">{desc}</div>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-primary-gradient shadow-glow" : "bg-white/10"}`}>
        <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          animate={{ x: value ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}
