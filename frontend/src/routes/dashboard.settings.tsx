import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Settings as SettingsIcon, Building2, Sliders, Palette, BellRing, ShieldCheck,
  Sun, Moon, Monitor, KeyRound, Smartphone, Laptop2, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb, Header, GlassCard, FieldGroup, Input, Select, SaveButton } from "@/components/dashboard/glass-form";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Aether" }] }),
  component: SettingsPage,
});

const SECTIONS = [
  { id: "organization",  label: "Organization",  icon: Building2 },
  { id: "preferences",   label: "Preferences",   icon: Sliders },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "security",      label: "Security",      icon: ShieldCheck },
];

function SettingsPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("idle");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [notif, setNotif] = useState({ email: true, push: true, marketing: false });
  const [twofa, setTwofa] = useState(true);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => { setStatus("saved"); setTimeout(() => setStatus("idle"), 1500); }, 800);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb label="Settings" />
      <Header icon={SettingsIcon} title="Settings" subtitle="Manage your workspace, preferences and security." />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sticky nav */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ul className="glass-strong rounded-2xl border border-white/10 p-1.5 space-y-0.5">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors">
                  <s.icon className="h-4 w-4" />
                  <span className="flex-1 truncate">{s.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <form onSubmit={save} className="space-y-6">
          {/* Organization */}
          <section id="organization">
            <GlassCard title="Organization" desc="Public details about your business.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Organization name"><Input defaultValue="Aether Inc." /></FieldGroup>
                <FieldGroup label="Website"><Input type="url" defaultValue="https://aether.co" /></FieldGroup>
                <FieldGroup label="Business email"><Input type="email" defaultValue="hello@aether.co" /></FieldGroup>
                <FieldGroup label="Company logo">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-gradient shadow-glow" />
                    <label className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl glass hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors">
                      Upload logo <input type="file" className="hidden" />
                    </label>
                  </div>
                </FieldGroup>
              </div>
            </GlassCard>
          </section>

          {/* Preferences */}
          <section id="preferences">
            <GlassCard title="Preferences" desc="Localization and formatting defaults.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup label="Language">
                  <Select defaultValue="English (US)">
                    <option>English (US)</option><option>English (UK)</option>
                    <option>Français</option><option>Deutsch</option><option>日本語</option>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Time zone">
                  <Select defaultValue="(UTC-08:00) Pacific Time">
                    <option>(UTC-08:00) Pacific Time</option>
                    <option>(UTC+00:00) UTC</option>
                    <option>(UTC+01:00) CET</option>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Date format">
                  <Select defaultValue="MM/DD/YYYY"><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></Select>
                </FieldGroup>
                <FieldGroup label="Currency">
                  <Select defaultValue="USD — US Dollar"><option>USD — US Dollar</option><option>EUR — Euro</option><option>GBP — Pound Sterling</option><option>JPY — Japanese Yen</option></Select>
                </FieldGroup>
              </div>
            </GlassCard>
          </section>

          {/* Appearance */}
          <section id="appearance">
            <GlassCard title="Appearance" desc="Choose how Aether looks on your devices.">
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Monitor },
                ] as const).map(t => {
                  const active = theme === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setTheme(t.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-2xl p-4 border transition-all",
                        active ? "border-primary/60 bg-white/[0.05] shadow-glow" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      )}
                    >
                      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl",
                        active ? "bg-primary-gradient text-primary-foreground shadow-glow" : "glass"
                      )}>
                        <t.icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-medium">{t.label}</span>
                      {active && (
                        <motion.span layoutId="theme-ring" className="absolute inset-0 rounded-2xl ring-2 ring-primary/40 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </section>

          {/* Notifications */}
          <section id="notifications">
            <GlassCard title="Notifications" desc="Choose what you want to hear about.">
              <div className="space-y-3">
                <Toggle label="Email notifications"   desc="Order updates, invoices and product news." checked={notif.email} onChange={v => setNotif({ ...notif, email: v })} />
                <Toggle label="Push notifications"    desc="Real-time alerts on your devices." checked={notif.push} onChange={v => setNotif({ ...notif, push: v })} />
                <Toggle label="Marketing emails"      desc="Tips, best practices and offers." checked={notif.marketing} onChange={v => setNotif({ ...notif, marketing: v })} />
              </div>
            </GlassCard>
          </section>

          {/* Security */}
          <section id="security">
            <GlassCard title="Security" desc="Keep your account safe.">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl glass"><KeyRound className="h-4 w-4 text-primary" /></span>
                    <div>
                      <div className="text-sm font-medium">Change password</div>
                      <div className="text-xs text-muted-foreground">Last updated 3 months ago.</div>
                    </div>
                  </div>
                  <button type="button" className="h-9 px-3.5 rounded-xl glass hover:bg-white/10 text-xs font-medium transition-colors">Update password</button>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <Toggle label="Two-factor authentication" desc="Require a code from your authenticator app on sign in." checked={twofa} onChange={setTwofa} />

                <div className="h-px bg-white/[0.06]" />

                <div>
                  <div className="text-sm font-medium mb-2.5">Active sessions</div>
                  <ul className="space-y-2">
                    {[
                      { icon: Laptop2, device: "MacBook Pro — Chrome", where: "San Francisco, US", current: true },
                      { icon: Smartphone, device: "iPhone 15 — Aether iOS", where: "San Francisco, US" },
                    ].map(s => (
                      <li key={s.device} className="flex items-center gap-3 p-3 rounded-xl glass border border-white/[0.06]">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]"><s.icon className="h-4 w-4" /></span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{s.device}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.where}</div>
                        </div>
                        {s.current ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">This device</span>
                        ) : (
                          <button type="button" className="text-xs text-muted-foreground hover:text-destructive transition-colors">Revoke</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </section>

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm font-medium transition-colors">Cancel</button>
            <SaveButton status={status} />
          </div>
        </form>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
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
