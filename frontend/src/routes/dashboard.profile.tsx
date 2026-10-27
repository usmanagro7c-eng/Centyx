import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { UserCircle, Upload, Trash2 } from "lucide-react";
import { Breadcrumb, Header, GlassCard, FieldGroup, Input, Select, SaveButton } from "@/components/dashboard/glass-form";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — Aether" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("idle");
  const [avatar, setAvatar] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1600);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb label="Profile" />
      <Header
        icon={UserCircle}
        title="Profile"
        subtitle="Manage your personal information and how others see you."
      />

      <form onSubmit={save} className="space-y-6">
        {/* Avatar card */}
        <GlassCard title="Profile picture" desc="PNG or JPG, up to 4MB.">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative inline-flex h-24 w-24 items-center justify-center rounded-3xl overflow-hidden bg-accent-gradient text-primary-foreground font-display text-2xl font-semibold shadow-glow"
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : "AL"}
            </motion.div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl glass hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors">
                <Upload className="h-3.5 w-3.5" /> Upload avatar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setAvatar(URL.createObjectURL(f));
                }} />
              </label>
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl glass hover:bg-destructive/15 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="Personal information" desc="Update your name and contact details.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Full name">
              <Input defaultValue="Ada Lovelace" placeholder="Full name" />
            </FieldGroup>
            <FieldGroup label="Email address">
              <Input type="email" defaultValue="ada@aether.co" placeholder="you@company.com" />
            </FieldGroup>
            <FieldGroup label="Phone number">
              <Input defaultValue="+1 (415) 555 0132" placeholder="+1 555 000 0000" />
            </FieldGroup>
            <FieldGroup label="Job title">
              <Input defaultValue="Founder" placeholder="e.g. Head of Growth" />
            </FieldGroup>
            <FieldGroup label="Company">
              <Input defaultValue="Aether Inc." placeholder="Company name" />
            </FieldGroup>
            <FieldGroup label="Country">
              <Select defaultValue="United States">
                <option>United States</option><option>United Kingdom</option><option>Germany</option>
                <option>France</option><option>Japan</option><option>India</option><option>Brazil</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Time zone" className="sm:col-span-2">
              <Select defaultValue="(UTC-08:00) Pacific Time">
                <option>(UTC-08:00) Pacific Time</option>
                <option>(UTC-05:00) Eastern Time</option>
                <option>(UTC+00:00) UTC</option>
                <option>(UTC+01:00) Central European Time</option>
                <option>(UTC+05:30) India Standard Time</option>
                <option>(UTC+09:00) Japan Standard Time</option>
              </Select>
            </FieldGroup>
          </div>
        </GlassCard>

        <div className="flex items-center justify-end gap-2">
          <button type="button" className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm font-medium transition-colors">
            Cancel
          </button>
          <SaveButton status={status} />
        </div>
      </form>
    </div>
  );
}
