import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, PlayCircle, Users, LifeBuoy, MessageSquare, Search, ChevronDown, ArrowUpRight, Mail,
} from "lucide-react";
import { GlassCard } from "@/components/dashboard/glass-form";

const TILES = [
  { icon: BookOpen, title: "Documentation", desc: "Guides, references, and API docs.", tint: "from-violet-500 to-fuchsia-500" },
  { icon: PlayCircle, title: "Tutorials", desc: "60-second product walkthroughs.", tint: "from-cyan-500 to-sky-500" },
  { icon: Users, title: "Community", desc: "Ask, share and learn with makers.", tint: "from-emerald-500 to-teal-500" },
  { icon: LifeBuoy, title: "Support Ticket", desc: "We respond in under 4 hours.", tint: "from-amber-500 to-orange-500" },
  { icon: MessageSquare, title: "Live Chat", desc: "Chat with a human, right now.", tint: "from-rose-500 to-pink-500" },
  { icon: Mail, title: "Contact", desc: "sales@aether.co · press@aether.co", tint: "from-indigo-500 to-violet-500" },
];

const FAQ = [
  { q: "How does AI billing work?", a: "You get 5,000 free AI credits every month. Additional usage is billed per 1K credits at cost — no markup." },
  { q: "Can I connect a custom domain?", a: "Yes — from Settings → Domains, connect via CNAME or use our nameservers for automatic HTTPS." },
  { q: "Where is my data stored?", a: "Data is stored in the region you choose during onboarding. Backups are encrypted at rest with AES-256." },
  { q: "How do payouts work?", a: "Payouts run every 2 business days by default; you can switch to daily on the Growth plan." },
  { q: "Can I invite my agency?", a: "Yes — from Workspace → Permissions, invite anyone as Owner, Admin, Editor or Viewer." },
];

export function HelpCenter() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative p-8 md:p-12 text-center">
          <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
          <div className="relative max-w-xl mx-auto">
            <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight">How can we help?</div>
            <div className="mt-4 relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Search docs, tutorials, articles…"
                className="w-full h-12 pl-11 pr-4 rounded-2xl glass-strong border border-white/10 text-sm outline-none focus:border-primary/40 focus:shadow-glow transition" />
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground">
              {["getting started", "domains", "payouts", "AI credits", "team roles"].map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full glass border border-white/10">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TILES.map((t, i) => (
          <motion.button
            key={t.title}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden text-left rounded-2xl glass border border-white/10 p-5 hover:border-white/20 hover:shadow-glow transition"
          >
            <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-60 bg-gradient-to-br ${t.tint}`} />
            <div className="relative flex items-start gap-3">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${t.tint} text-white shadow-glow`}>
                <t.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <div className="text-sm font-medium">{t.title}</div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                </div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">{t.desc}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <GlassCard title="Frequently asked" desc="Common answers, right here">
        <ul className="divide-y divide-white/[0.06]">
          {FAQ.map((f, i) => (
            <li key={f.q}>
              <button
                onClick={() => setOpen(o => o === i ? null : i)}
                className="w-full flex items-center gap-3 py-4 text-left"
              >
                <span className="text-sm font-medium flex-1">{f.q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
