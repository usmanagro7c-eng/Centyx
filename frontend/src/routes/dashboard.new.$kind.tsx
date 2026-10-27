import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderPlus, Globe, LayoutTemplate, Store, Package, Layers,
  ArrowRight, ArrowLeft, Check, Sparkles, Rocket, Wand2, Image as ImageIcon,
  Tag, DollarSign, Search as SearchIcon, Boxes, Truck, Palette,
} from "lucide-react";
import { Breadcrumb, Header, GlassCard, FieldGroup, Input, Select } from "@/components/dashboard/glass-form";

export const Route = createFileRoute("/dashboard/new/$kind")({
  head: ({ params }) => ({ meta: [{ title: `Create ${params.kind.replace("-"," ")} — Aether` }] }),
  component: NewWizard,
});

type KindKey = "project"|"website"|"template"|"store"|"product"|"collection";

type KindDef = {
  icon: any;
  title: string;
  subtitle: string;
  tint: string;
  steps: { key: string; label: string }[];
};

const KINDS: Record<KindKey, KindDef> = {
  project:    { icon: FolderPlus,     title: "New Project",   subtitle: "Blank workspace with AI scaffolding.", tint: "from-violet-500 to-fuchsia-500",
    steps: [{key:"basics",label:"Basics"},{key:"team",label:"Team"},{key:"launch",label:"Launch"}] },
  website:    { icon: Globe,          title: "New Website",   subtitle: "AI page builder for marketing sites.", tint: "from-cyan-500 to-sky-500",
    steps: [{key:"basics",label:"Basics"},{key:"design",label:"Design"},{key:"pages",label:"Pages"},{key:"publish",label:"Publish"}] },
  template:   { icon: LayoutTemplate, title: "Browse Templates", subtitle: "Curated designs to start from.", tint: "from-fuchsia-500 to-pink-500",
    steps: [{key:"pick",label:"Pick"},{key:"preview",label:"Preview"},{key:"import",label:"Import"}] },
  store:      { icon: Store,          title: "New Store",     subtitle: "Full ecommerce storefront.", tint: "from-emerald-500 to-teal-500",
    steps: [{key:"basics",label:"Basics"},{key:"payments",label:"Payments"},{key:"shipping",label:"Shipping"},{key:"launch",label:"Launch"}] },
  product:    { icon: Package,        title: "New Product",   subtitle: "AI-generated copy, images and SEO.", tint: "from-rose-500 to-orange-500",
    steps: [{key:"details",label:"Details"},{key:"media",label:"Media"},{key:"pricing",label:"Pricing"},{key:"seo",label:"SEO"},{key:"publish",label:"Publish"}] },
  collection: { icon: Layers,         title: "New Collection",subtitle: "Group products into shoppable sets.", tint: "from-sky-500 to-indigo-500",
    steps: [{key:"basics",label:"Basics"},{key:"products",label:"Products"},{key:"preview",label:"Preview"}] },
};

function NewWizard() {
  const { kind: rawKind } = Route.useParams();
  const kind = (Object.keys(KINDS).includes(rawKind) ? rawKind : "project") as KindKey;
  const def = KINDS[kind];
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const progress = useMemo(() => (step / (def.steps.length - 1)) * 100, [step, def.steps.length]);

  const back = () => setStep(s => Math.max(0, s - 1));
  const next = () => {
    if (step >= def.steps.length - 1) { setDone(true); return; }
    setStep(s => s + 1);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb label={def.title} />
      <Header icon={def.icon} title={def.title} subtitle={def.subtitle} />

      {/* Stepper */}
      <div className="relative">
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div className="h-full bg-primary-gradient shadow-glow"
            initial={false} animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {def.steps.map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "idle";
            return (
              <button key={s.key} onClick={() => setStep(i)} className="flex items-center gap-2 shrink-0 group">
                <motion.span
                  layoutId={`wiz-dot-${kind}-${i}`}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                    state === "done" ? "bg-primary-gradient text-primary-foreground shadow-glow" :
                    state === "active" ? "bg-primary-gradient text-primary-foreground shadow-glow ring-4 ring-primary/20" :
                    "glass border border-white/10 text-muted-foreground"
                  }`}>
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </motion.span>
                <span className={`text-xs ${state === "idle" ? "text-muted-foreground" : "text-foreground"}`}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <StepContent kind={kind} step={def.steps[step].key} />
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={back} disabled={step === 0}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm disabled:opacity-40 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate({ to: "/dashboard" })}
            className="h-10 px-4 rounded-xl text-sm text-muted-foreground hover:text-foreground transition">
            Skip
          </button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={next}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow">
            {step === def.steps.length - 1 ? <><Rocket className="h-4 w-4" /> Finish</> : <>Continue <ArrowRight className="h-4 w-4" /></>}
          </motion.button>
        </div>
      </div>

      {/* Success */}
      <AnimatePresence>
        {done && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" onClick={() => setDone(false)} />
            <motion.div
              initial={{ y: 30, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full md:w-[min(480px,calc(100%-2rem))] glass-strong border border-white/10 rounded-3xl p-8 text-center shadow-elegant"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${def.tint} shadow-glow`}
              >
                <Check className="h-7 w-7 text-white" />
              </motion.div>
              <div className="mt-4 font-display text-2xl font-semibold">{def.title.replace(/^New /, "")} created</div>
              <div className="mt-1.5 text-sm text-muted-foreground">Your {kind.replace("-"," ")} is ready. Take it from here.</div>
              <div className="mt-6 flex items-center justify-center gap-2">
                <button onClick={() => setDone(false)} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm">Stay here</button>
                <button onClick={() => navigate({ to: "/dashboard" })}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow">
                  <Sparkles className="h-4 w-4" /> Open workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------- Step bodies (all kinds share primitives) -------- */

function StepContent({ kind, step }: { kind: KindKey; step: string }) {
  // Universal steps
  if (step === "basics" || step === "brief" || step === "details") {
    return (
      <GlassCard title="The essentials" desc="You can change all of this later.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldGroup label="Name"><Input placeholder="e.g. Aether Autumn" /></FieldGroup>
          <FieldGroup label="Handle"><Input placeholder="aether-autumn" /></FieldGroup>
          <FieldGroup label="Category">
            <Select defaultValue="fashion"><option>Fashion</option><option>Beauty</option><option>Home</option><option>Tech</option><option>Food</option></Select>
          </FieldGroup>
          <FieldGroup label="Region">
            <Select defaultValue="us"><option value="us">United States</option><option>Europe</option><option>APAC</option><option>Global</option></Select>
          </FieldGroup>
          <FieldGroup label="Description" className="md:col-span-2">
            <textarea rows={4} placeholder="Describe what you're building — AI will use this to bootstrap content."
              className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition resize-none" />
          </FieldGroup>
        </div>
      </GlassCard>
    );
  }

  if (step === "design" || step === "pick") {
    const looks = [
      { name: "Editorial", tint: "from-slate-800 to-slate-600" },
      { name: "Playful", tint: "from-fuchsia-500 to-amber-400" },
      { name: "Minimal", tint: "from-slate-200 to-white" },
      { name: "Neo-brutalist", tint: "from-yellow-400 to-black" },
      { name: "Glass", tint: "from-violet-500 to-cyan-400" },
      { name: "Luxury", tint: "from-amber-700 to-black" },
    ];
    return (
      <GlassCard title={kind === "template" ? "Pick a template" : "Choose a design language"} desc="AI will adapt each layout to your brand.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {looks.map((l, i) => (
            <motion.button key={l.name}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="group text-left rounded-2xl glass border border-white/10 p-3 hover:border-white/20 hover:shadow-glow transition"
            >
              <div className={`h-28 rounded-xl bg-gradient-to-br ${l.tint} relative overflow-hidden`}>
                <div className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-white/40" />
                <div className="absolute inset-x-3 bottom-6 h-2 w-2/3 rounded-full bg-white/40" />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-sm font-medium">{l.name}</span>
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (step === "pages") {
    const pages = ["Home", "Shop", "About", "Journal", "Contact", "FAQ"];
    return (
      <GlassCard title="Pages" desc="AI will draft each page. You can add more later.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {pages.map(p => (
            <label key={p} className="flex items-center gap-2 rounded-xl glass border border-white/10 p-3 hover:bg-white/[0.04] transition cursor-pointer">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[oklch(0.68_0.24_295)]" />
              <span className="text-sm">{p}</span>
            </label>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (step === "generate") {
    return (
      <GlassCard title="Generating your AI store" desc="This normally takes ~20 seconds.">
        <div className="space-y-3">
          {["Analyzing brief", "Naming products", "Drafting copy", "Generating imagery", "Assembling storefront"].map((label, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-3 rounded-xl glass border border-white/10 p-3.5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient shadow-glow">
                <Wand2 className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-sm flex-1">{label}</span>
              <span className="text-[11px] text-emerald-300 inline-flex items-center gap-1">
                <Check className="h-3 w-3" /> Done
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (step === "edit" || step === "preview") {
    return (
      <GlassCard title="Preview" desc="Live preview updates as you edit.">
        <div className="relative rounded-2xl glass border border-white/10 overflow-hidden">
          <div className="h-8 flex items-center gap-1.5 px-3 border-b border-white/[0.06] bg-white/[0.02]">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3 text-[11px] text-muted-foreground truncate">aether-autumn.aether.co</span>
          </div>
          <div className="p-8 bg-mesh-gradient min-h-[280px]">
            <div className="max-w-lg">
              <div className="h-3 w-40 rounded-full bg-white/10" />
              <div className="mt-3 h-8 w-72 rounded-lg bg-white/20" />
              <div className="mt-3 h-3 w-64 rounded-full bg-white/10" />
              <div className="mt-3 h-3 w-56 rounded-full bg-white/10" />
              <div className="mt-5 inline-flex h-9 px-4 items-center rounded-xl bg-primary-gradient text-primary-foreground text-xs shadow-glow">Shop the drop</div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-xl aspect-[4/5] bg-white/10 border border-white/10" />
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (step === "media") {
    return (
      <GlassCard title="Media" desc="Upload or generate with AI.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="group aspect-square rounded-2xl glass border border-dashed border-white/20 hover:border-primary/40 hover:shadow-glow flex flex-col items-center justify-center gap-1.5 transition">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span className="text-[11px] text-muted-foreground">Upload</span>
          </button>
          {[0,1,2].map(i => (
            <div key={i} className={`aspect-square rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 border border-white/10 relative overflow-hidden`}>
              <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white/80">AI generated · v{i+1}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (step === "pricing" || step === "payments") {
    return (
      <GlassCard title={step === "payments" ? "Payments" : "Pricing"} desc="Set money in and out.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldGroup label="Price"><Input placeholder="$49.00" /></FieldGroup>
          <FieldGroup label="Compare at"><Input placeholder="$69.00" /></FieldGroup>
          <FieldGroup label="Cost per item"><Input placeholder="$14.20" /></FieldGroup>
          <FieldGroup label="Tax class">
            <Select><option>Standard</option><option>Reduced</option><option>Zero</option></Select>
          </FieldGroup>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5 text-primary" /> Margin ~ 71% · Suggested by AI
        </div>
      </GlassCard>
    );
  }

  if (step === "seo") {
    return (
      <GlassCard title="SEO" desc="AI-generated meta — edit anytime.">
        <FieldGroup label="Meta title"><Input defaultValue="Aether Runner Pro — Lightweight everyday sneaker" /></FieldGroup>
        <div className="h-3" />
        <FieldGroup label="Meta description">
          <textarea rows={3} defaultValue="Cushioned, breathable and made from recycled knit. Ship in 24h."
            className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition resize-none" />
        </FieldGroup>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"><SearchIcon className="h-3.5 w-3.5 text-primary" /> Preview looks strong for "everyday sneaker" and "recycled knit".</div>
      </GlassCard>
    );
  }

  if (step === "shipping") {
    return (
      <GlassCard title="Shipping" desc="Where you sell and how you deliver.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldGroup label="From country"><Select><option>United States</option><option>Germany</option><option>Japan</option></Select></FieldGroup>
          <FieldGroup label="Zones"><Select><option>Domestic + International</option><option>Domestic only</option></Select></FieldGroup>
          <FieldGroup label="Standard rate"><Input placeholder="$6.00" /></FieldGroup>
          <FieldGroup label="Express rate"><Input placeholder="$14.00" /></FieldGroup>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> Free shipping applied over $75 · adjustable</div>
      </GlassCard>
    );
  }

  if (step === "team") {
    return (
      <GlassCard title="Invite your team" desc="Optional — you can invite later.">
        <div className="space-y-2">
          {[0,1,2].map(i => (
            <div key={i} className="grid grid-cols-[1fr_180px_auto] gap-2">
              <Input placeholder="name@company.com" />
              <Select defaultValue="editor"><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></Select>
              <button className="h-10 px-3 rounded-xl glass hover:bg-white/10 text-xs">Invite</button>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (step === "products") {
    return (
      <GlassCard title="Add products" desc="Drop them in, or let AI curate from your catalogue.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0,1,2,3,4,5,6,7].map(i => (
            <label key={i} className="group relative rounded-2xl glass border border-white/10 p-2 hover:border-white/20 transition cursor-pointer">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-700 to-slate-900" />
              <div className="mt-2 text-[12px] font-medium truncate">Runner Pro v{i+1}</div>
              <div className="text-[10px] text-muted-foreground">$49.00</div>
              <input type="checkbox" defaultChecked={i < 4} className="absolute top-3 right-3 h-4 w-4 accent-[oklch(0.68_0.24_295)]" />
            </label>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5 text-primary" /> <Tag className="h-3.5 w-3.5 text-primary" /> 4 selected · AI can suggest more
        </div>
      </GlassCard>
    );
  }

  if (step === "launch" || step === "publish" || step === "import") {
    return (
      <GlassCard title="Ready to ship" desc="Final checks before you go live.">
        <ul className="space-y-2">
          {[
            "Domain connected (aether.co)",
            "Payments verified (Stripe + PayPal)",
            "Legal pages published",
            "SEO meta generated by AI",
            "Analytics wired to Aether Insights",
          ].map(item => (
            <li key={item} className="flex items-center gap-2.5 rounded-xl glass border border-white/10 p-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    );
  }

  return <GlassCard title="Coming up">Continue to the next step.</GlassCard>;
}
