import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Loader2, Sparkles, Eye, PenTool, LayoutDashboard, Rocket, ArrowRight,
} from "lucide-react";
import { z } from "zod";
import { getTemplate } from "@/lib/templates-data";
import { getThemeColor } from "@/lib/theme-colors";
import { useSiteStore } from "@/lib/site-store";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ color: z.string().optional() });

export const Route = createFileRoute("/templates/$id/apply")({
  head: ({ params }) => {
    const t = getTemplate(params.id);
    return { meta: [{ title: `Applying ${t.name} — Aether` }] };
  },
  validateSearch: (s: Record<string, unknown>): { color?: string } => searchSchema.parse(s),
  component: ApplyTemplate,
});

const STEPS = [
  "Template installing",
  "Applying theme",
  "Importing components",
  "Generating pages",
  "Preparing assets",
  "Configuring navigation",
  "Installing layout",
  "Finalizing setup",
];

function ApplyTemplate() {
  const { id } = Route.useParams();
  const { color } = Route.useSearch();
  const t = getTemplate(id);
  const theme = useMemo(() => getThemeColor(color), [color]);
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const applyTemplate = useSiteStore((s) => s.applyTemplate);

  useEffect(() => {
    if (idx >= STEPS.length) {
      applyTemplate(id, color);
      setDone(true);
      return;
    }
    const timeout = setTimeout(() => setIdx((v) => v + 1), 260 + Math.random() * 160);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const progress = Math.min(100, (idx / STEPS.length) * 100);

  return (
    <div className="relative min-h-screen bg-background text-foreground grid place-items-center px-4 py-10 overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full blur-3xl opacity-40"
          style={{ background: "var(--glow)" }}
          animate={{ x: [0, 40, -20, 0], y: [0, 30, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: "var(--glow-2)" }}
          animate={{ x: [0, -30, 20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="loading"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-xl rounded-3xl glass-strong border border-white/10 shadow-elegant p-6 md:p-8"
          >
            <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br shadow-glow grid place-items-center", t.tint)}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">Installing template</div>
            <h1 className="mt-1 font-display text-2xl md:text-3xl font-semibold tracking-tight">{t.name}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sit tight — this usually takes 3–5 seconds.</p>

            {/* Progress bar */}
            <div className="mt-5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div className="h-full bg-primary-gradient shadow-glow"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span>{idx}/{STEPS.length} steps</span>
            </div>

            {/* Steps */}
            <div className="mt-6 space-y-1.5">
              {STEPS.map((label, i) => {
                const state = i < idx ? "done" : i === idx ? "active" : "idle";
                return (
                  <motion.div key={label}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                      state === "active" ? "glass border-primary/30 shadow-glow" :
                      state === "done" ? "border-white/[0.06] bg-white/[0.02]" :
                      "border-white/[0.06]"
                    )}
                  >
                    <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full",
                      state === "done" ? "bg-emerald-400/20 text-emerald-300" :
                      state === "active" ? "bg-primary-gradient text-primary-foreground shadow-glow" :
                      "glass text-muted-foreground"
                    )}>
                      {state === "done" ? <Check className="h-3.5 w-3.5" /> :
                       state === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                       <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
                    </span>
                    <span className={cn("text-sm", state === "idle" ? "text-muted-foreground" : "text-foreground")}>{label}</span>
                    {state === "done" && <span className="ml-auto text-[11px] text-emerald-300">Done</span>}
                    {state === "active" && <span className="ml-auto text-[11px] text-muted-foreground">Running…</span>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="success"
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl rounded-3xl glass-strong border border-white/10 shadow-elegant p-6 md:p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
              className="mx-auto h-16 w-16 rounded-2xl bg-primary-gradient shadow-glow grid place-items-center"
            >
              <Check className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h2 className="mt-4 font-display text-2xl md:text-3xl font-semibold tracking-tight">Template applied successfully</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Your new website powered by <span className="text-foreground font-medium">{t.name}</span> is ready.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full glass border border-white/10 px-3 py-1 text-[11px]">
              <span className="h-3 w-3 rounded-full" style={{ background: theme.accent }} />
              <span className="text-muted-foreground">Theme:</span>
              <span className="font-medium" style={{ color: theme.accent }}>{theme.name}</span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ActionBtn
                onClick={() => navigate({ to: "/builder", search: { template: t.id, color: theme.id } as any })}
                primary icon={PenTool} label="Edit website" accent={theme.accent} ink={theme.ink}
              />
              <ActionBtn
                onClick={() => navigate({ to: "/builder", search: { template: t.id, color: theme.id } as any })}
                icon={Rocket} label="Open Website Builder"
              />
              <ActionBtn
                onClick={() => navigate({ to: "/templates/$id", params: { id: t.id }, search: { color: theme.id } as any })}
                icon={Eye} label="Preview website"
              />
              <ActionBtn
                onClick={() => navigate({ to: "/dashboard" })}
                icon={LayoutDashboard} label="Visit dashboard"
              />
            </div>

            <div className="mt-6 text-[11px] text-muted-foreground">
              Redirecting to the builder in a moment…
              <AutoRedirect to={`/builder?template=${t.id}&color=${theme.id}`} />
            </div>

            <Link to="/templates" className="mt-5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
              Back to templates <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, primary, accent, ink }: { icon: any; label: string; onClick: () => void; primary?: boolean; accent?: string; ink?: string }) {
  return (
    <motion.button
      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium transition shadow-glow",
        primary ? "" : "glass border border-white/10 hover:bg-white/10"
      )}
      style={primary && accent ? { background: accent, color: ink } : undefined}
    >
      <Icon className="h-4 w-4" /> {label}
    </motion.button>
  );
}

function AutoRedirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => { window.location.href = to; }, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Avoid unused warning
  void navigate;
  return null;
}
