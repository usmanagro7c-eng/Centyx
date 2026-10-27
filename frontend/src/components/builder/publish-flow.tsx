import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket, X, Check, Loader2, AlertTriangle, ExternalLink,
  ShieldCheck, Save, Image as ImageIcon, Palette, Globe, Sparkles, Store, Upload,
} from "lucide-react";
import { useSiteStore } from "@/lib/site-store";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ms: number;
};

const STEPS: Step[] = [
  { id: "validate",  label: "Validating website",   icon: ShieldCheck, ms: 500 },
  { id: "save",      label: "Saving changes",       icon: Save,        ms: 550 },
  { id: "assets",    label: "Uploading assets",     icon: ImageIcon,   ms: 650 },
  { id: "theme",     label: "Applying theme",       icon: Palette,     ms: 500 },
  { id: "publish",   label: "Publishing website",   icon: Globe,       ms: 700 },
  { id: "finalize",  label: "Finalizing",           icon: Sparkles,    ms: 450 },
];

type Phase = "confirm" | "storeName" | "running" | "success" | "error";

const STORE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9 '&.\-]{1,38}[a-zA-Z0-9.]$/;

function validateStoreName(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Store name is required.";
  if (v.length < 3) return "Store name must be at least 3 characters.";
  if (v.length > 40) return "Store name must be 40 characters or fewer.";
  if (!STORE_NAME_RE.test(v)) return "Use letters, numbers, spaces, and . - & ' only.";
  return null;
}

export function PublishFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const site = useSiteStore();
  const [phase, setPhase] = useState<Phase>("confirm");
  const [current, setCurrent] = useState(-1);
  const [errors, setErrors] = useState<string[]>([]);
  const timers = useRef<number[]>([]);

  // store-name form state
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [logoInput, setLogoInput] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalSections = useMemo(
    () => site.pages.reduce((n, p) => n + p.sections.length, 0),
    [site.pages]
  );
  const publicUrl = `/site/${site.storeSlug || site.templateId || "my-site"}`;

  useEffect(() => {
    if (!open) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase("confirm");
      setCurrent(-1);
      setErrors([]);
      setNameInput("");
      setDescInput("");
      setLogoInput(null);
      setNameError(null);
      setSubmitting(false);
    }
  }, [open]);

  function runPipeline() {
    setErrors([]);
    setPhase("running");
    setCurrent(0);
    site.setPublishStatus("publishing");
    site.saveAll();

    let acc = 0;
    STEPS.forEach((step, idx) => {
      acc += step.ms;
      const t = window.setTimeout(() => {
        setCurrent(idx + 1);
        if (idx === STEPS.length - 1) {
          site.publish();
          setPhase("success");
        }
      }, acc);
      timers.current.push(t);
    });
  }

  function start() {
    // If store name missing, open the store-name step instead of erroring.
    if (!site.storeName?.trim()) {
      setNameInput(site.storeName ?? "");
      setNameError(null);
      setPhase("storeName");
      return;
    }
    const v = site.validateForPublish();
    if (!v.ok) { setErrors(v.errors); setPhase("error"); return; }
    runPipeline();
  }

  function submitStoreName() {
    if (submitting) return;
    const err = validateStoreName(nameInput);
    if (err) { setNameError(err); return; }
    setSubmitting(true);
    const name = nameInput.trim();
    site.setStoreInfo({
      storeName: name,
      ...(logoInput ? { logoUrl: logoInput } : {}),
    });
    // Persist description into footer.tagline if user provided one and no tagline set.
    if (descInput.trim() && !site.footer?.tagline) {
      site.setFooter({ tagline: descInput.trim() });
    }
    // Continue publishing automatically.
    const v = site.validateForPublish();
    // storeName is now set; re-check other requirements.
    const errs = v.errors.filter((e) => !/store name/i.test(e));
    if (errs.length) {
      setErrors(errs);
      setPhase("error");
      setSubmitting(false);
      return;
    }
    runPipeline();
    setSubmitting(false);
  }

  function close() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    onClose();
  }

  const progress = phase === "success" ? 100 : Math.round((Math.max(current, 0) / STEPS.length) * 100);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl"
            onClick={phase === "running" ? undefined : close} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
            className="relative z-10 w-full max-w-lg rounded-3xl glass-strong border border-white/10 shadow-elegant p-6">
            {phase !== "running" && (
              <button onClick={close} className="absolute right-4 top-4 h-8 w-8 rounded-full glass grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            )}

            <div className={cn("h-12 w-12 rounded-2xl grid place-items-center shadow-glow",
              phase === "error" ? "bg-red-500/20 border border-red-500/40"
              : phase === "success" ? "bg-emerald-500/20 border border-emerald-500/40"
              : phase === "storeName" ? "bg-primary-gradient"
              : "bg-primary-gradient")}>
              {phase === "error" ? <AlertTriangle className="h-5 w-5 text-red-300" />
                : phase === "success" ? <Check className="h-5 w-5 text-emerald-300" />
                : phase === "storeName" ? <Store className="h-5 w-5 text-primary-foreground" />
                : <Rocket className="h-5 w-5 text-primary-foreground" />}
            </div>

            {phase === "confirm" && (
              <>
                <h3 className="mt-4 font-display text-xl font-semibold">Publish your website</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Your site will go live at{" "}
                  <span className="text-foreground font-medium">{publicUrl}</span>.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Pages" value={site.pages.length} />
                  <Stat label="Sections" value={totalSections} />
                  <Stat label="Nav links" value={site.nav.length} />
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={close} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm">Cancel</button>
                  <button onClick={start}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow">
                    <Rocket className="h-4 w-4" /> Publish now
                  </button>
                </div>
              </>
            )}

            {phase === "storeName" && (
              <>
                <h3 className="mt-4 font-display text-xl font-semibold">Create your store</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Before publishing your website, please choose a unique store name.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Store name <span className="text-red-400">*</span>
                    </label>
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => { setNameInput(e.target.value); if (nameError) setNameError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") submitStoreName(); }}
                      placeholder="e.g. Northwind Coffee"
                      maxLength={40}
                      className={cn(
                        "mt-1 w-full h-10 px-3 rounded-xl glass border text-sm outline-none transition-colors",
                        nameError ? "border-red-500/50 focus:border-red-500/70" : "border-white/10 focus:border-white/25"
                      )}
                    />
                    {nameError ? (
                      <p className="mt-1.5 text-xs text-red-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" /> {nameError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        3–40 chars. Letters, numbers, spaces, and . - & ' allowed.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Store description <span className="text-muted-foreground/60">(optional)</span></label>
                    <textarea
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder="A short tagline for your store"
                      rows={2}
                      maxLength={140}
                      className="mt-1 w-full px-3 py-2 rounded-xl glass border border-white/10 focus:border-white/25 text-sm outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Store logo <span className="text-muted-foreground/60">(optional)</span></label>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl glass border border-white/10 grid place-items-center overflow-hidden">
                        {logoInput ? <img src={logoInput} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs font-medium cursor-pointer">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => setLogoInput(typeof r.result === "string" ? r.result : null);
                            r.readAsDataURL(f);
                          }} />
                      </label>
                      {logoInput && (
                        <button onClick={() => setLogoInput(null)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button onClick={close} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm">Cancel</button>
                  <button
                    onClick={submitStoreName}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Continue
                  </button>
                </div>
              </>
            )}

            {phase === "error" && (
              <>
                <h3 className="mt-4 font-display text-xl font-semibold">Can't publish yet</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">Fix these issues, then try again:</p>
                <ul className="mt-3 space-y-2">
                  {errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-red-300 shrink-0" /> {e}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={close} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm">Close</button>
                  <button onClick={() => setPhase("confirm")} className="h-10 px-4 rounded-xl bg-white/10 text-sm">Try again</button>
                </div>
              </>
            )}

            {phase === "running" && (
              <>
                <h3 className="mt-4 font-display text-xl font-semibold">Publishing your website…</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">Please don't close this window.</p>
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div className="h-full bg-primary-gradient"
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                </div>
                <ul className="mt-4 space-y-2">
                  {STEPS.map((s, i) => {
                    const done = i < current;
                    const active = i === current;
                    return (
                      <motion.li key={s.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn("flex items-center gap-3 rounded-xl px-3 py-2 border text-sm",
                          done ? "border-emerald-500/25 bg-emerald-500/5 text-foreground"
                          : active ? "border-white/15 bg-white/[0.04] text-foreground"
                          : "border-white/[0.06] bg-transparent text-muted-foreground")}>
                        <span className={cn("h-7 w-7 shrink-0 grid place-items-center rounded-lg",
                          done ? "bg-emerald-500/15 text-emerald-300"
                          : active ? "bg-white/10 text-foreground"
                          : "bg-white/[0.04] text-muted-foreground")}>
                          {done ? <Check className="h-3.5 w-3.5" />
                            : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <s.icon className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1">{s.label}</span>
                        {done && <span className="text-[10px] uppercase tracking-wider text-emerald-300">Done</span>}
                      </motion.li>
                    );
                  })}
                </ul>
              </>
            )}

            {phase === "success" && (
              <>
                <h3 className="mt-4 font-display text-xl font-semibold">Website published successfully</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Your site is now live at <span className="text-foreground font-medium">{publicUrl}</span>.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Pages" value={site.pages.length} />
                  <Stat label="Sections" value={totalSections} />
                  <Stat label="Status" value="Live" />
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={close} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm">Close</button>
                  <a href={publicUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow">
                    <ExternalLink className="h-4 w-4" /> View live site
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
