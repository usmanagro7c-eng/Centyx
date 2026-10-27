import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, Sparkles, Zap, Shield, BarChart3, CreditCard, Globe,
  Check, Star, Activity, Bot, Quote, Menu, X, Plus, Mail, MapPin, Phone,
} from "lucide-react";
import { FadeIn, Counter, AnimatedHeadline, MagneticButton } from "@/components/landing/primitives";
import { BackgroundFx, FloatingObjects } from "@/components/landing/effects";
import { HeroDashboard } from "@/components/landing/hero-dashboard";
import { AuthProvider, useAuthModal } from "@/components/auth/auth-modal";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aether — The operating system for modern commerce" },
      { name: "description", content: "Aether unifies payments, analytics and growth into one alive, real-time platform built for ambitious teams." },
      { property: "og:title", content: "Aether — The operating system for modern commerce" },
      { property: "og:description", content: "Unify payments, analytics and growth into one alive, real-time platform." },
    ],
  }),
  component: Landing,
});

/* ===== Shared nav config ===== */
const NAV_LINKS: { label: string; labelKey: string; id: string }[] = [
  { label: "Features", labelKey: "landing.nav.features", id: "features" },
  { label: "Product", labelKey: "landing.nav.product", id: "product" },
  { label: "Testimonials", labelKey: "landing.nav.testimonials", id: "testimonials" },
  { label: "Pricing", labelKey: "landing.nav.pricing", id: "pricing" },
  { label: "FAQ", labelKey: "landing.nav.faq", id: "faq" },
  { label: "Contact", labelKey: "landing.nav.contact", id: "contact" },
];

const SECTION_IDS = ["hero", ...NAV_LINKS.map((l) => l.id)];

function scrollToSection(id: string) {
  if (typeof window === "undefined") return;
  if (id === "hero") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useActiveSection() {
  const [active, setActive] = useState<string>("hero");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

function Landing() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen bg-background text-foreground overflow-hidden scroll-smooth">
        <Nav />
        <Hero />
        <LogoMarquee />
        <Features />
        <DashboardSection />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Contact />
        <CTA />
        <Footer />
      </div>
    </AuthProvider>
  );
}

/* ===== Nav ===== */
function Nav() {
  const [open, setOpen] = useState(false);
  const auth = useAuthModal();
  const active = useActiveSection();
  const t = useT();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleNav = useCallback((id: string) => {
    setOpen(false);
    // small delay so mobile drawer close animation feels smooth
    setTimeout(() => scrollToSection(id), 60);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1100px,calc(100%-2rem))]"
      >
        <div className="glass-strong rounded-full px-5 py-2.5 flex items-center justify-between shadow-elegant">
          <button
            type="button"
            onClick={() => handleNav("hero")}
            className="flex items-center gap-2 font-display font-semibold cursor-pointer"
            aria-label="Scroll to top"
          >
            <motion.span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-gradient shadow-glow"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </motion.span>
            Aether
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {NAV_LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleNav(l.id)}
                  className={`relative transition-colors duration-300 group ${isActive ? "text-foreground" : "hover:text-foreground"}`}
                >
                  {t(l.labelKey, l.label)}
                  <span
                    className={`absolute -bottom-1 left-0 h-px w-full bg-primary-gradient transition-transform duration-300 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
          <div className="hidden md:block">
            <MagneticButton variant="primary" className="!py-2 !px-4 text-xs" onClick={() => auth.open("signup")}>
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </MagneticButton>
          </div>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full glass hover:bg-white/10 transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-xl md:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ y: -20, opacity: 0, filter: "blur(12px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(12px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100%-2rem))] md:hidden"
            >
              <div className="relative glass-strong rounded-3xl p-6 shadow-elegant overflow-hidden">
                <div className="absolute -top-20 -right-10 h-48 w-48 rounded-full opacity-40 blur-3xl" style={{ background: "var(--glow)" }} />
                <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-40 blur-3xl" style={{ background: "var(--glow-2)" }} />
                <nav className="relative flex flex-col">
                  {NAV_LINKS.map((l, i) => {
                    const isActive = active === l.id;
                    return (
                      <motion.button
                        key={l.id}
                        type="button"
                        onClick={() => handleNav(l.id)}
                        initial={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.45, delay: 0.08 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className={`group flex items-center justify-between py-4 border-b border-white/5 font-display text-2xl font-semibold text-left transition-colors ${
                          isActive ? "text-gradient" : "hover:text-gradient"
                        }`}
                      >
                        <span>{t(l.labelKey, l.label)}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
                      </motion.button>
                    );
                  })}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-6 flex flex-col gap-3"
                  >
                    <MagneticButton variant="primary" className="justify-center w-full" onClick={() => { setOpen(false); auth.open("signup"); }}>
                      Start free <ArrowRight className="h-4 w-4" />
                    </MagneticButton>
                    <MagneticButton variant="ghost" className="justify-center w-full" onClick={() => { setOpen(false); auth.open("signin"); }}>
                      {t("common.signIn")}
                    </MagneticButton>
                  </motion.div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ===== Hero ===== */
function Hero() {
  const auth = useAuthModal();
  return (
    <section id="hero" className="relative pt-40 pb-24 md:pt-48 md:pb-32 scroll-mt-24">
      <BackgroundFx />
      <FloatingObjects />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            New — Aether 4.0 with real-time AI co-pilot
            <ArrowRight className="h-3 w-3" />
          </motion.div>

          <AnimatedHeadline
            text="The operating system for modern commerce."
            className="mt-6 font-display text-5xl md:text-7xl font-semibold tracking-tighter text-foreground"
          />

          <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            One platform to run payments, analytics and growth. Built for teams who
            ship at the speed of light — and want their software to keep up.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="mt-9 flex items-center justify-center gap-3 flex-wrap"
          >
            <MagneticButton variant="primary" onClick={() => auth.open("signup")}>
              Start building <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <MagneticButton variant="ghost">
              Watch the demo
            </MagneticButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="mt-6 text-xs text-muted-foreground"
          >
            No credit card required · Free for 30 days
          </motion.div>
        </div>

        <div className="mt-20 md:mt-28 relative">
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

/* ===== Logo marquee ===== */
function LogoMarquee() {
  const logos = ["LINEAR", "VERCEL", "FRAMER", "STRIPE", "NOTION", "FIGMA", "RAYCAST", "ARC"];
  return (
    <section className="relative py-16 border-y border-border/50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-8 text-center">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by 12,000+ ambitious teams
          </p>
        </FadeIn>
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max animate-marquee pause-on-hover">
          {[...logos, ...logos].map((logo, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1, color: "oklch(0.98 0.005 270)" }}
              className="mx-10 font-display font-semibold text-2xl text-muted-foreground/60 tracking-widest"
            >
              {logo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Features ===== */
function Features() {
  const features = [
    { icon: Zap, title: "Lightning fast", desc: "Edge-native infrastructure. Median response under 40ms anywhere on earth.", color: "var(--glow)" },
    { icon: BarChart3, title: "Live analytics", desc: "Watch revenue, retention and growth update in real time as your customers transact.", color: "var(--glow-2)" },
    { icon: Shield, title: "Enterprise security", desc: "SOC 2 Type II, ISO 27001 and PCI DSS. Encrypted end to end by default.", color: "var(--accent)" },
    { icon: CreditCard, title: "Unified payments", desc: "Accept 135+ currencies and 40+ methods through a single elegant API.", color: "var(--glow)" },
    { icon: Bot, title: "AI co-pilot", desc: "An autonomous agent that flags anomalies, drafts forecasts and writes the SQL for you.", color: "var(--glow-2)" },
    { icon: Globe, title: "Global by default", desc: "Multi-region replication, localized checkout and 99.999% measured uptime.", color: "var(--accent)" },
  ];
  return (
    <section id="features" className="relative py-32 scroll-mt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary mb-4">The platform</p>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
              Everything you need.<br />
              <span className="text-gradient">Nothing you don't.</span>
            </h2>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08} y={32}>
              <motion.div
                whileHover={{ y: -8, rotate: 0.5 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="group relative h-full rounded-3xl glass p-7 overflow-hidden hover:shadow-glow transition-shadow duration-500"
              >
                <div
                  className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(400px circle at 50% 0%, ${f.color}, transparent 40%)`,
                  }}
                />
                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl glass-strong shadow-glow mb-5"
                    style={{ boxShadow: `0 0 30px -10px ${f.color}` }}
                  >
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </motion.div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Product / live numbers ===== */
function DashboardSection() {
  const stats = [
    { label: "Active merchants", to: 12480, suffix: "+" },
    { label: "Processed last month", to: 1.4, prefix: "$", suffix: "B", decimals: 1 },
    { label: "Uptime measured", to: 99.999, suffix: "%", decimals: 3 },
    { label: "Countries supported", to: 195, suffix: "" },
  ];
  return (
    <section id="product" className="relative py-32 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary mb-4">Live in production</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              A control room <span className="text-gradient-cyan">that breathes</span> with your business.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Every metric, every transaction, every alert — streamed live with millisecond latency.
              Configure dashboards in seconds, share them in one click.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <FadeIn key={s.label} delay={i * 0.1}>
                  <div className="glass rounded-2xl p-5 hover:shadow-glow-cyan transition-shadow duration-500">
                    <p className="font-display text-3xl md:text-4xl font-semibold text-gradient">
                      <Counter
                        to={s.to}
                        prefix={s.prefix || ""}
                        suffix={s.suffix || ""}
                        decimals={s.decimals || 0}
                      />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <LiveChartCard />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function LiveChartCard() {
  const points = [10, 28, 22, 45, 40, 62, 55, 78, 70, 92, 85, 110];
  const w = 380, h = 140, pad = 10;
  const max = Math.max(...points);
  const path = points
    .map((p, i) => {
      const x = pad + (i * (w - pad * 2)) / (points.length - 1);
      const y = h - pad - (p / max) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const areaPath = `${path} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4 }}
      className="glass-strong rounded-3xl p-6 shadow-elegant relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--glow-2)" }} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Today's revenue</p>
          <p className="font-display text-3xl font-semibold text-gradient">
            <Counter to={48294} prefix="$" />
          </p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1.5 text-xs text-secondary glass rounded-full px-3 py-1"
        >
          <Activity className="h-3 w-3" />
          live
        </motion.div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.68 0.24 295 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.68 0.24 295 / 0)" />
          </linearGradient>
          <linearGradient id="ls" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 210)" />
            <stop offset="100%" stopColor="oklch(0.68 0.24 295)" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#lg)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.6 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="url(#ls)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="mt-5 space-y-3">
        {[
          { label: "Stripe", v: 82, c: "var(--glow)" },
          { label: "Apple Pay", v: 64, c: "var(--glow-2)" },
          { label: "Crypto", v: 38, c: "var(--accent)" },
        ].map((p, i) => (
          <div key={p.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{p.label}</span>
              <span className="font-mono">{p.v}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${p.v}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.4 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${p.c}, oklch(1 0 0 / 0.4))` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ===== Testimonials ===== */
function Testimonials() {
  const items = [
    { quote: "Aether replaced three vendors and our weekly metrics meeting. It just shows us what's happening.", name: "Maya Chen", role: "COO, Halo Beauty" },
    { quote: "Switching to Aether was the rare migration that actually made the team faster the same week.", name: "Jules Park", role: "CTO, Northwind" },
    { quote: "The AI co-pilot flagged a refund anomaly before our analyst noticed. It paid for itself in a day.", name: "Liam O'Connor", role: "Head of Ops, Brightside" },
    { quote: "Beautiful product. Our finance team uses it without asking us for SQL queries anymore.", name: "Priya Raman", role: "VP Eng, Studio Forty" },
    { quote: "We tripled GMV in nine months and never thought about infrastructure once.", name: "Sven Holm", role: "Founder, Nordkit" },
  ];
  return (
    <section id="testimonials" className="relative py-32 overflow-hidden scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6 text-center mb-16">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary mb-4">Loved by operators</p>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
            Teams that ship <span className="text-gradient">ship with Aether.</span>
          </h2>
        </FadeIn>
      </div>

      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee pause-on-hover gap-5 px-5">
          {[...items, ...items].map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, scale: 1.02 }}
              className="w-[360px] shrink-0 glass rounded-3xl p-7 shadow-card hover:shadow-glow transition-shadow duration-500"
            >
              <Quote className="h-6 w-6 text-primary/60 mb-4" />
              <p className="text-sm leading-relaxed">{t.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-gradient" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-secondary text-secondary" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Pricing ===== */
function Pricing() {
  const plans = [
    {
      name: "Starter", price: "0", desc: "For builders shipping their first product.",
      features: ["Up to $10k monthly volume", "Real-time analytics", "5 team members", "Community support"],
      cta: "Start free",
    },
    {
      name: "Professional", price: "49", desc: "For teams scaling past product-market fit.",
      features: ["Unlimited volume", "AI co-pilot", "Unlimited team", "Priority support", "Custom dashboards", "SLA 99.99%"],
      cta: "Start 30-day trial",
    },
    {
      name: "Enterprise", price: "Custom", desc: "For platforms operating at global scale.",
      features: ["Dedicated infrastructure", "Custom integrations", "Solutions architect", "SOC 2 + HIPAA", "24/7 support"],
      cta: "Talk to sales",
    },
  ];
  // middle card (Professional) active by default
  const [activeIdx, setActiveIdx] = useState(1);

  return (
    <section id="pricing" className="relative py-32 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary mb-4">Pricing</p>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
              Simple, <span className="text-gradient">honest pricing.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              No setup fees, no contracts. Switch plans anytime.
            </p>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto items-stretch">
          {plans.map((p, i) => {
            const isActive = activeIdx === i;
            return (
              <FadeIn key={p.name} delay={i * 0.1}>
                <motion.button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  aria-pressed={isActive}
                  animate={{ scale: isActive ? 1.04 : 1, y: isActive ? -6 : 0 }}
                  whileHover={{ y: isActive ? -10 : -6 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative h-full w-full text-left rounded-3xl p-8 transition-shadow duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isActive
                      ? "glass-strong shadow-glow border border-primary/30"
                      : "glass border border-white/5 hover:shadow-elegant"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pricing-active-badge"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-gradient text-xs font-semibold text-primary-foreground shadow-glow"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {i === 1 ? "Most popular" : "Selected"}
                    </motion.div>
                  )}
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    {p.price !== "Custom" && <span className="text-2xl">$</span>}
                    <span className="font-display text-5xl font-semibold">
                      {p.price === "Custom" ? "Custom" : p.price}
                    </span>
                    {p.price !== "Custom" && <span className="text-sm text-muted-foreground">/ mo</span>}
                  </div>
                  <div className="mt-7">
                    <MagneticButton
                      variant={isActive ? "primary" : "ghost"}
                      className="w-full justify-center"
                    >
                      {p.cta} <ArrowRight className="h-4 w-4" />
                    </MagneticButton>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {p.features.map((f, j) => (
                      <motion.li
                        key={f}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 + j * 0.05 }}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-gradient shrink-0">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                        </span>
                        <span className="text-muted-foreground">{f}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.button>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== FAQ ===== */
function FAQ() {
  const faqs = [
    { q: "How long does setup take?", a: "Most teams are live in under four minutes. Connect your payment providers, import your data, and Aether takes care of the rest." },
    { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade anytime — changes prorate automatically and never interrupt live traffic." },
    { q: "Is my data secure?", a: "Aether is SOC 2 Type II, ISO 27001 and PCI DSS certified. All data is encrypted in transit and at rest with per-tenant keys." },
    { q: "Do you offer a free trial?", a: "Every paid plan includes a 30-day trial with full access — no credit card required to start." },
    { q: "What integrations are supported?", a: "Native integrations with Stripe, Shopify, Segment, Slack, Zapier and 60+ other tools, plus a first-class REST and webhook API." },
    { q: "Do you support enterprise contracts?", a: "Yes. Our Enterprise plan includes custom SLAs, dedicated infrastructure, HIPAA, SSO/SAML and a named solutions architect." },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-32 scroll-mt-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-14">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary mb-4">Frequently asked</p>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
              Questions, <span className="text-gradient">answered.</span>
            </h2>
          </FadeIn>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <FadeIn key={f.q} delay={i * 0.05}>
                <div
                  className={`rounded-2xl overflow-hidden transition-shadow duration-300 ${
                    isOpen ? "glass-strong shadow-glow" : "glass hover:shadow-elegant"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-base md:text-lg font-medium">{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== Contact ===== */
function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: "", email: "", message: "" });
    }, 2600);
  }

  const info = [
    { icon: Mail, label: "Email", value: "hello@aether.dev" },
    { icon: Phone, label: "Phone", value: "+1 (415) 555-0134" },
    { icon: MapPin, label: "HQ", value: "San Francisco, CA" },
  ];

  return (
    <section id="contact" className="relative py-32 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary mb-4">Contact</p>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
              Let's <span className="text-gradient">build together.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Questions, partnerships, or just curious — we usually reply within a few hours.
            </p>
          </FadeIn>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <FadeIn className="lg:col-span-2">
            <div className="glass rounded-3xl p-7 h-full flex flex-col justify-between gap-6">
              <div className="space-y-5">
                {info.map((it) => (
                  <div key={it.label} className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl glass-strong shadow-glow shrink-0">
                      <it.icon className="h-4 w-4 text-primary" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">{it.label}</p>
                      <p className="mt-0.5 text-sm font-medium">{it.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Prefer async? Drop us a line and we'll get back the same day.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="lg:col-span-3">
            <form
              onSubmit={onSubmit}
              className="glass-strong rounded-3xl p-7 space-y-4 shadow-elegant"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl glass border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:shadow-glow transition-all duration-300"
                    placeholder="Ada Lovelace"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl glass border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:shadow-glow transition-all duration-300"
                    placeholder="you@company.com"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-muted-foreground">Message</span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl glass border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:shadow-glow transition-all duration-300 resize-none"
                  placeholder="Tell us what you're building…"
                />
              </label>
              <div className="flex items-center justify-between gap-4 pt-2">
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.p
                      key="sent"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-secondary flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" /> Thanks — we'll be in touch shortly.
                    </motion.p>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-muted-foreground"
                    >
                      We reply to every message within 24 hours.
                    </motion.p>
                  )}
                </AnimatePresence>
                <MagneticButton variant="primary" className="!py-2.5">
                  Send message <ArrowRight className="h-4 w-4" />
                </MagneticButton>
              </div>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ===== CTA ===== */
function CTA() {
  const auth = useAuthModal();
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative rounded-[40px] overflow-hidden glass-strong p-14 md:p-20 text-center">
          <motion.div
            className="absolute inset-0 bg-mesh-gradient opacity-50 blur-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          {[
            { left: "8%", top: "20%", size: 60, delay: 0 },
            { left: "85%", top: "30%", size: 80, delay: 1 },
            { left: "15%", top: "70%", size: 50, delay: 2 },
            { left: "80%", top: "75%", size: 70, delay: 0.5 },
          ].map((o, i) => (
            <motion.div
              key={i}
              className="absolute rounded-2xl glass border border-white/10"
              style={{ left: o.left, top: o.top, width: o.size, height: o.size }}
              animate={{ y: [0, -20, 0], rotate: [0, 12, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: o.delay }}
            />
          ))}

          <div className="relative">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">
                Ready to ship<br />
                <span className="text-gradient">at the speed of light?</span>
              </h2>
              <p className="mt-6 text-muted-foreground max-w-lg mx-auto">
                Join 12,000+ teams already running their commerce on Aether.
                Set up takes about four minutes.
              </p>
              <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                <MagneticButton variant="primary" onClick={() => auth.open("signup")}>
                  Start building for free <ArrowRight className="h-4 w-4" />
                </MagneticButton>
                <MagneticButton variant="ghost">
                  Talk to sales
                </MagneticButton>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Footer ===== */
function Footer() {
  return (
    <footer className="relative py-14 border-t border-border/50">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-2 font-display font-semibold cursor-pointer"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-gradient shadow-glow">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          Aether
        </button>
        <p className="text-xs text-muted-foreground">
          © 2026 Aether Labs Inc. Crafted for operators who care.
        </p>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          {["Privacy", "Terms", "Security", "Status"].map((l) => (
            <a key={l} href="#" className="hover:text-foreground transition-colors duration-300">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
