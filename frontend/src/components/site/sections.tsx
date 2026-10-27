import type { Section } from "@/lib/site-store";
import type { SectionType } from "@/lib/template-kits";
import { mergeDefaults } from "@/lib/section-schemas";
import { useStoreData } from "@/lib/store-data-store";
import { useSiteUI } from "@/lib/site-ui-store";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Ctx = {
  accent: string;
  fontDisplay: string;
  fontBody: string;
  mode: "dark" | "light";
  radius: number;
};

/* ---------- primitives ---------- */

function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-6 md:px-10", className)}>{children}</div>;
}
function Eyebrow({ children, ctx }: { children: React.ReactNode; ctx: Ctx }) {
  if (!children) return null;
  return <div className="text-[11px] uppercase tracking-[0.22em] font-semibold" style={{ color: ctx.accent }}>{children}</div>;
}
function H({ children, ctx, className, italic }: { children: React.ReactNode; ctx: Ctx; className?: string; italic?: boolean }) {
  return <h2 className={cn("text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight", italic && "italic", className)} style={{ fontFamily: ctx.fontDisplay }}>{children}</h2>;
}
function Sub({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return <p className={cn("text-base md:text-lg text-muted-foreground max-w-2xl", className)}>{children}</p>;
}

type BtnData = { label?: string; url?: string; newTab?: boolean };
function Btn({ btn, ctx, ghost, children }: { btn?: BtnData; ctx: Ctx; ghost?: boolean; children?: React.ReactNode }) {
  const label = children ?? btn?.label;
  if (!label) return null;
  return (
    <a href={btn?.url || "#"} target={btn?.newTab ? "_blank" : undefined} rel={btn?.newTab ? "noreferrer" : undefined}
      className={cn("inline-flex items-center justify-center h-11 px-5 rounded-full text-sm font-medium transition",
        ghost ? "border border-white/15 text-foreground hover:bg-white/10" : "text-black hover:opacity-90")}
      style={ghost ? undefined : { background: ctx.accent }}>
      {label}
    </a>
  );
}

function CTARow({ a, b, ctx, center }: { a?: BtnData; b?: BtnData; ctx: Ctx; center?: boolean }) {
  if (!a?.label && !b?.label) return null;
  return <div className={cn("mt-6 flex flex-wrap gap-3", center && "justify-center")}><Btn btn={a} ctx={ctx} /><Btn btn={b} ctx={ctx} ghost /></div>;
}

function Img({ src, alt, className, style }: { src?: string; alt?: string; className?: string; style?: React.CSSProperties }) {
  if (src) return <img src={src} alt={alt ?? ""} className={cn("h-full w-full object-cover", className)} style={style} loading="lazy" />;
  return <div className={cn("h-full w-full", className)} style={style} />;
}

/* ---------- HEROES ---------- */

function HeroSimple({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20 md:py-32 border-b border-white/[0.06]">
      <Container className="text-center">
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <H ctx={ctx} className="mt-3 mx-auto max-w-3xl whitespace-pre-line">{p.title}</H>
        <Sub className="mt-4 mx-auto">{p.body}</Sub>
        <div className="flex justify-center"><CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} center /></div>
      </Container>
    </section>
  );
}

function HeroFashion({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="grid md:grid-cols-2 min-h-[70vh] md:min-h-[85vh]">
        <div className="relative p-8 md:p-16 flex flex-col justify-end">
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(600px 400px at 20% 30%, ${ctx.accent}22, transparent)` }} />
          <div className="relative">
            <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
            <h1 className="mt-3 text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] whitespace-pre-line" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
            <p className="mt-6 max-w-md text-muted-foreground">{p.body}</p>
            <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
          </div>
        </div>
        <div className="relative bg-black min-h-[280px]">
          <Img src={p.image} alt={p.title} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${ctx.accent}30, transparent 60%)` }} />
        </div>
      </div>
    </section>
  );
}

function HeroLuxury({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-24 md:py-40 border-b border-white/[0.06]">
      <Container className="text-center">
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-7xl font-serif italic leading-tight whitespace-pre-line" style={{ fontFamily: `${ctx.fontDisplay}, serif` }}>{p.title}</h1>
        <Sub className="mt-6 mx-auto italic">{p.body}</Sub>
        <div className="flex justify-center"><CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} center /></div>
      </Container>
    </section>
  );
}

function HeroElectronics({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="relative py-20 md:py-32 border-b border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ background: `conic-gradient(from 220deg at 70% 40%, ${ctx.accent}, transparent 60%)` }} />
      <Container className="relative grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] rounded-full border border-white/15 px-3 py-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: ctx.accent }} /> {p.eyebrow}</div>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
          <Sub className="mt-5">{p.body}</Sub>
          <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
          {p.stats?.length ? (
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-md text-sm">
              {p.stats.map((st: any, i: number) => (
                <div key={i}><div className="text-2xl font-semibold" style={{ color: ctx.accent }}>{st.value}</div><div className="text-xs text-muted-foreground">{st.label}</div></div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative aspect-square rounded-3xl border border-white/10 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 55%, ${ctx.accent}66, transparent 55%), #0a0a0a` }} />
          <div className="absolute inset-8 rounded-2xl border border-white/10 grid place-items-center">
            <div className="h-40 w-40 rounded-full border border-white/10 grid place-items-center" style={{ background: `radial-gradient(circle, ${ctx.accent}44, transparent 70%)` }}>
              <div className="h-20 w-20 rounded-full bg-black border border-white/20" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroRestaurant({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="relative min-h-[70vh] md:min-h-[85vh] grid place-items-center border-b border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.85))${p.image ? `, url('${p.image}') center/cover` : ""}` }} />
      <Container className="relative text-center py-20">
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-5xl sm:text-6xl md:text-7xl italic" style={{ fontFamily: `${ctx.fontDisplay}, serif` }}>{p.title}</h1>
        <p className="mt-4 max-w-lg mx-auto text-white/70">{p.body}</p>
        <div className="flex justify-center"><CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} center /></div>
      </Container>
    </section>
  );
}

function HeroMedical({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20 md:py-32 border-b border-white/[0.06]" style={{ background: `linear-gradient(180deg, ${ctx.accent}10, transparent)` }}>
      <Container className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
          <Sub className="mt-5">{p.body}</Sub>
          <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
        </div>
        <div className="rounded-3xl border border-white/10 p-6 bg-white/[0.02]">
          <div className="text-sm font-medium">Quick appointment</div>
          <div className="mt-4 space-y-3">
            {["Specialty","Preferred date","Contact"].map((l) => (
              <div key={l}><div className="text-[11px] text-muted-foreground mb-1">{l}</div><div className="h-10 rounded-lg bg-white/5 border border-white/10" /></div>
            ))}
            <button className="w-full h-11 rounded-lg text-sm font-medium text-black" style={{ background: ctx.accent }}>Request appointment</button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroCorporate({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-24 md:py-40 border-b border-white/[0.06]">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-5xl md:text-7xl font-bold tracking-tighter leading-[1]" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
          <Sub className="mt-6">{p.body}</Sub>
          <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
        </div>
      </Container>
    </section>
  );
}

function HeroPortfolio({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-24 md:py-40 border-b border-white/[0.06]">
      <Container>
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <h1 className="mt-6 text-5xl md:text-8xl leading-[0.95] whitespace-pre-line" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
        <div className="mt-10 text-sm text-muted-foreground">{p.body}</div>
      </Container>
    </section>
  );
}

function HeroAgency({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="relative py-28 md:py-48 border-b border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0" style={{ background: `radial-gradient(1000px 500px at 80% 20%, ${ctx.accent}44, transparent)` }} />
      <Container className="relative">
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{p.eyebrow}</div>
        <h1 className="mt-6 text-6xl md:text-[9rem] font-black tracking-tighter leading-[0.85] whitespace-pre-line" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
        <Sub className="mt-8">{p.body}</Sub>
      </Container>
    </section>
  );
}

function HeroBeauty({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20 md:py-32 border-b border-white/[0.06]" style={{ background: `linear-gradient(180deg, ${ctx.accent}18, transparent)` }}>
      <Container className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-6xl leading-tight" style={{ fontFamily: `${ctx.fontDisplay}, serif` }}>{p.title}</h1>
          <Sub className="mt-5">{p.body}</Sub>
          <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
        </div>
        <div className="aspect-[4/5] rounded-3xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${ctx.accent}55, #f5e6d0)` }}>
          <Img src={p.image} alt={p.title} />
        </div>
      </Container>
    </section>
  );
}

function HeroRealEstate({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] grid place-items-end border-b border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.85))${p.image ? `, url('${p.image}') center/cover` : ""}` }} />
      <Container className="relative pb-16 pt-32">
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight max-w-3xl" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
        <p className="mt-4 text-white/70 max-w-lg">{p.body}</p>
      </Container>
    </section>
  );
}

function HeroFurniture({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-16 md:py-24 border-b border-white/[0.06]">
      <Container className="grid md:grid-cols-[1fr_1.2fr] gap-10 items-end">
        <div>
          <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
          <Sub className="mt-5">{p.body}</Sub>
          <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] rounded-2xl" style={{ background: `linear-gradient(${120 + i * 60}deg, ${ctx.accent}44, #2a1f16)` }} />)}
        </div>
      </Container>
    </section>
  );
}

function HeroEducation({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20 md:py-32 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${ctx.accent}18, transparent)` }}>
      <Container>
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-4xl md:text-7xl font-bold tracking-tight max-w-4xl" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</h1>
        <Sub className="mt-6 text-lg">{p.body}</Sub>
        <CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} />
        {p.badges?.length ? (
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {p.badges.map((b: any, i: number) => <div key={i} className="rounded-xl border border-white/10 p-4 text-sm">{b.title}</div>)}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/* ---------- CONTENT ---------- */

function Banner({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const inner = <div>{p.text}</div>;
  return (
    <div className="py-3 text-center text-sm font-medium" style={{ background: ctx.accent, color: "#0a0a0a" }}>
      {p.url ? <a href={p.url} className="hover:underline">{inner}</a> : inner}
    </div>
  );
}

function FeaturedCollections({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="mb-8"><Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {p.items.map((c: any, i: number) => (
          <a key={i} href={c.url || "#"} className="group relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 block">
            {c.image ? <Img src={c.image} alt={c.name} /> : <div className="absolute inset-0" style={{ background: `linear-gradient(${45 + i * 30}deg, ${ctx.accent}55, #0a0a0a)` }} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white"><div className="text-2xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{c.name}</div><div className="text-sm opacity-70">{c.meta}</div></div>
          </a>
        ))}
      </div>
    </Container></section>
  );
}

function Lookbook({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 auto-rows-[110px] md:auto-rows-[180px]">
        {p.images.map((im: any, i: number) => (
          <div key={i} className={cn("rounded-2xl overflow-hidden", i % 5 === 0 && "col-span-2 row-span-2", i % 7 === 0 && "col-span-2")}
            style={{ background: `linear-gradient(${(i * 45) % 360}deg, ${ctx.accent}55, #111)` }}>
            <Img src={im.url} alt="" />
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function InstagramFeed({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="text-center mb-8"><Eyebrow ctx={ctx}>{p.handle}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H></div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {p.images.map((im: any, i: number) => (
          <div key={i} className="aspect-square overflow-hidden" style={{ background: `linear-gradient(${(i * 30) % 360}deg, ${ctx.accent}44, #222)` }}>
            <Img src={im.url} alt="" />
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function ProductComparison({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const cols = p.columns ?? [];
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <div className="min-w-[520px]">
          <div className="grid bg-white/[0.03]" style={{ gridTemplateColumns: `1fr repeat(${cols.length}, 1fr)` }}>
            <div className="p-4 text-sm text-muted-foreground"></div>
            {cols.map((c: any, i: number) => <div key={i} className="p-4 text-sm font-medium" style={i === 0 ? { color: ctx.accent } : undefined}>{c.title}</div>)}
          </div>
          {p.rows.map((r: any, i: number) => (
            <div key={i} className={cn("grid border-t border-white/[0.06]", i % 2 && "bg-white/[0.02]")} style={{ gridTemplateColumns: `1fr repeat(${cols.length}, 1fr)` }}>
              <div className="p-4 text-sm text-muted-foreground">{r.label}</div>
              {["a","b","c"].slice(0, cols.length).map((k) => <div key={k} className="p-4 text-sm">{r[k]}</div>)}
            </div>
          ))}
        </div>
      </div>
    </Container></section>
  );
}

function FeaturedGadgets({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {p.items.map((it: any, i: number) => (
          <div key={i} className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="aspect-[4/3]" style={{ background: `radial-gradient(circle at 50% 50%, ${ctx.accent}55, #111)` }}>
              <Img src={it.image} alt={it.title} />
            </div>
            <div className="p-5"><div className="text-lg font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{it.title}</div><div className="text-sm text-muted-foreground mt-1">{it.description}</div><div className="mt-3 font-medium" style={{ color: ctx.accent }}>{it.price}</div></div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function CategoriesGrid({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
        {p.items.map((c: any, i: number) => (
          <a key={i} href={c.url || "#"} className="aspect-[4/3] rounded-2xl border border-white/10 p-6 flex flex-col justify-end"
            style={{ background: `linear-gradient(${45 + i * 30}deg, ${ctx.accent}22, transparent)` }}>
            <div className="text-xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{c.name}</div>
            <div className="text-sm text-muted-foreground">Explore →</div>
          </a>
        ))}
      </div>
    </Container></section>
  );
}

function Products({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {p.items.map((it: any, i: number) => (
          <a key={i} href={it.url || "#"} className="block">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden" style={{ background: `linear-gradient(${(i * 45) % 360}deg, ${ctx.accent}44, #1a1a1a)` }}><Img src={it.image} alt={it.name} /></div>
            <div className="mt-2 text-sm">{it.name}</div>
            <div className="text-xs text-muted-foreground">{it.price}</div>
          </a>
        ))}
      </div>
    </Container></section>
  );
}

function FoodMenu({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container className="max-w-3xl">
      <div className="text-center"><Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2" italic>{p.title}</H></div>
      <div className="mt-10 space-y-10">
        {p.sections.map((sec: any, i: number) => (
          <div key={i}>
            <div className="text-lg font-semibold uppercase tracking-widest" style={{ color: ctx.accent }}>{sec.name}</div>
            <div className="mt-4 divide-y divide-white/[0.06]">
              {(sec.items ?? []).map((it: any, j: number) => (
                <div key={j} className="py-3 flex items-baseline gap-4">
                  <div><div className="text-base font-medium">{it.name}</div><div className="text-sm text-muted-foreground italic">{it.description}</div></div>
                  <div className="flex-1 border-b border-dotted border-white/20" />
                  <div className="text-sm">${it.price}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function Chef({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container className="grid md:grid-cols-[1fr_1.2fr] gap-10 items-center">
      <div className="aspect-[4/5] rounded-3xl overflow-hidden" style={{ background: `linear-gradient(160deg, ${ctx.accent}55, #2a1810)` }}><Img src={p.image} alt={p.title} /></div>
      <div>
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <H ctx={ctx} className="mt-2" italic>{p.title}</H>
        <Sub className="mt-4">{p.body}</Sub>
        {p.quote && <p className="mt-3 text-muted-foreground italic">"{p.quote}"</p>}
      </div>
    </Container></section>
  );
}

function OpeningHours({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container className="max-w-xl text-center">
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2" italic>{p.title}</H>
      <div className="mt-8 space-y-2">
        {p.days.map((d: any, i: number) => <div key={i} className="flex justify-between border-b border-white/[0.08] py-3"><span className="text-muted-foreground">{d.label}</span><span>{d.hours}</span></div>)}
      </div>
      {p.address && <div className="mt-8 text-sm text-muted-foreground whitespace-pre-line">{p.address}</div>}
    </Container></section>
  );
}

function GenericForm({ s, ctx, gradient }: { s: Section; ctx: Ctx; gradient?: boolean }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20" style={gradient ? { background: `linear-gradient(180deg, ${ctx.accent}10, transparent)` } : undefined}>
      <Container className="max-w-2xl">
        <div className="text-center"><Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H></div>
        <div className="mt-8 rounded-3xl border border-white/10 p-6 grid md:grid-cols-2 gap-3 bg-white/[0.02]">
          {p.fields.map((f: any, i: number) => (
            <div key={i} className={cn(String(f.label).toLowerCase().includes("message") || String(f.label).toLowerCase().includes("note") ? "md:col-span-2" : "")}>
              <div className="text-[11px] text-muted-foreground mb-1">{f.label}</div>
              {String(f.label).toLowerCase().includes("message") || String(f.label).toLowerCase().includes("note")
                ? <div className="h-24 rounded-lg bg-white/5 border border-white/10" />
                : <div className="h-11 rounded-lg bg-white/5 border border-white/10" />}
            </div>
          ))}
          <button className="md:col-span-2 h-12 rounded-lg font-medium text-black" style={{ background: ctx.accent }}>{p.ctaLabel}</button>
        </div>
      </Container>
    </section>
  );
}

function Doctors({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {p.items.map((d: any, i: number) => (
          <div key={i} className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="aspect-square" style={{ background: `linear-gradient(${45 + i * 40}deg, ${ctx.accent}55, #1a2432)` }}><Img src={d.image} alt={d.name} /></div>
            <div className="p-4"><div className="text-sm font-semibold">{d.name}</div><div className="text-xs text-muted-foreground">{d.specialty}</div><div className="mt-3 text-xs" style={{ color: ctx.accent }}>Book →</div></div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function Services({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {p.items.map((it: any, i: number) => (
          <div key={i} className="rounded-2xl border border-white/10 p-6">
            <div className="h-10 w-10 rounded-lg grid place-items-center font-semibold" style={{ background: `${ctx.accent}22`, color: ctx.accent }}>{String(i + 1).padStart(2, "0")}</div>
            <div className="mt-4 text-lg font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{it.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{it.description}</div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function Team({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {p.items.map((it: any, i: number) => (
          <div key={i}>
            <div className="aspect-[4/5] rounded-2xl overflow-hidden" style={{ background: `linear-gradient(${45 + i * 35}deg, ${ctx.accent}44, #1a1a1a)` }}><Img src={it.image} alt={it.name} /></div>
            <div className="mt-2 text-sm font-medium">{it.name}</div>
            <div className="text-xs text-muted-foreground">{it.role}</div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function Testimonials({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {p.items.map((q: any, i: number) => (
          <blockquote key={i} className="rounded-2xl border border-white/10 p-6">
            <div className="text-2xl leading-none" style={{ color: ctx.accent }}>"</div>
            <p className="mt-3 text-sm">{q.quote}</p>
            <div className="mt-4 text-xs text-muted-foreground">— {q.author}</div>
          </blockquote>
        ))}
      </div>
    </Container></section>
  );
}

function PortfolioGrid({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {p.items.map((it: any, i: number) => (
          <a key={i} href={it.url || "#"} className="group block">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden" style={{ background: `linear-gradient(${(i * 60) % 360}deg, ${ctx.accent}55, #111)` }}><Img src={it.image} alt={it.title} /></div>
            <div className="mt-3 flex items-baseline justify-between"><div className="font-medium">{it.title}</div><div className="text-xs text-muted-foreground">{it.meta}</div></div>
          </a>
        ))}
      </div>
    </Container></section>
  );
}

function TimelineBlock({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container className="max-w-2xl">
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 relative pl-6 border-l border-white/10 space-y-6">
        {p.items.map((it: any, i: number) => (
          <div key={i} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full" style={{ background: ctx.accent }} />
            <div className="text-sm" style={{ color: ctx.accent }}>{it.year}</div>
            <div className="text-lg">{it.title}</div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function CaseStudies({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 space-y-4">
        {p.items.map((it: any, i: number) => (
          <div key={i} className="grid md:grid-cols-[1fr_1fr] gap-6 rounded-3xl border border-white/10 p-6">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden" style={{ background: `linear-gradient(${45 + i * 60}deg, ${ctx.accent}55, #111)` }}><Img src={it.image} alt={it.title} /></div>
            <div className="flex flex-col justify-center">
              <Eyebrow ctx={ctx}>{it.client} · {it.year}</Eyebrow>
              <div className="mt-2 text-xl md:text-2xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{it.title}</div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[["m1v","m1l"],["m2v","m2l"],["m3v","m3l"]].map(([v,l]) => (
                  <div key={v}><div className="text-xl font-semibold" style={{ color: ctx.accent }}>{it[v]}</div><div className="text-xs text-muted-foreground">{it[l]}</div></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function Gallery({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="grid grid-cols-3 gap-2">
        {p.images.map((im: any, i: number) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden" style={{ background: `linear-gradient(${(i * 40) % 360}deg, ${ctx.accent}44, #222)` }}>
            <Img src={im.url} alt={im.alt} />
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function VideoBlock({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      {(p.eyebrow || p.title) && <div className="mb-6"><Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H></div>}
      {p.videoUrl ? (
        <div className="aspect-video rounded-3xl overflow-hidden border border-white/10">
          {p.videoUrl.match(/youtube\.com|youtu\.be|vimeo\.com/) ? (
            <iframe src={p.videoUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Video" />
          ) : (
            <video src={p.videoUrl} poster={p.poster} controls className="w-full h-full object-cover" />
          )}
        </div>
      ) : (
        <div className="aspect-video rounded-3xl grid place-items-center relative overflow-hidden border border-white/10" style={{ background: `linear-gradient(135deg, ${ctx.accent}66, #000)` }}>
          {p.poster && <Img src={p.poster} alt="" className="absolute inset-0" />}
          <div className="relative h-20 w-20 rounded-full bg-white/10 backdrop-blur border border-white/30 grid place-items-center">
            <div className="ml-1 h-0 w-0 border-t-8 border-b-8 border-l-[14px] border-t-transparent border-b-transparent border-l-white" />
          </div>
        </div>
      )}
    </Container></section>
  );
}

function Countdown({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const target = new Date(p.date || Date.now()).getTime();
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const cells: [string, string][] = [[String(days).padStart(2,"0"),"Days"],[String(hours).padStart(2,"0"),"Hours"],[String(mins).padStart(2,"0"),"Mins"],[String(secs).padStart(2,"0"),"Secs"]];
  return (
    <section className="py-20"><Container className="text-center">
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {cells.map(([n, l]) => (
          <div key={l} className="rounded-2xl border border-white/10 px-6 py-4 min-w-[96px]">
            <div className="text-4xl font-bold tabular-nums" style={{ color: ctx.accent, fontFamily: ctx.fontDisplay }}>{n}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </Container></section>
  );
}

function FAQ({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container className="max-w-3xl">
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      <div className="mt-8 divide-y divide-white/[0.08] rounded-2xl border border-white/10">
        {p.items.map((it: any, i: number) => (
          <details key={i} className="p-5 group">
            <summary className="flex justify-between cursor-pointer list-none"><span className="font-medium">{it.q}</span><span className="group-open:rotate-45 transition" style={{ color: ctx.accent }}>+</span></summary>
            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{it.a}</p>
          </details>
        ))}
      </div>
    </Container></section>
  );
}

function Pricing({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="text-center"><Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H></div>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {p.plans.map((pl: any, i: number) => {
          const features = String(pl.features || "").split("\n").filter(Boolean);
          return (
            <div key={i} className={cn("rounded-3xl border p-6", pl.highlighted ? "border-transparent" : "border-white/10")} style={pl.highlighted ? { boxShadow: `0 0 0 1px ${ctx.accent}80, 0 20px 60px -20px ${ctx.accent}55` } : undefined}>
              <div className="text-sm font-semibold" style={{ color: ctx.accent }}>{pl.name}</div>
              <div className="mt-3 text-4xl font-bold" style={{ fontFamily: ctx.fontDisplay }}>{pl.price}<span className="text-sm text-muted-foreground font-normal">{pl.period}</span></div>
              <ul className="mt-5 space-y-2 text-sm">{features.map((f, j) => <li key={j} className="flex items-center gap-2"><span style={{ color: ctx.accent }}>✓</span>{f}</li>)}</ul>
              <a href={pl.ctaUrl || "#"} className={cn("mt-6 w-full h-11 rounded-lg text-sm font-medium inline-flex items-center justify-center", pl.highlighted ? "text-black" : "border border-white/15")} style={pl.highlighted ? { background: ctx.accent } : undefined}>{pl.ctaLabel}</a>
            </div>
          );
        })}
      </div>
    </Container></section>
  );
}

function Newsletter({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="rounded-3xl border border-white/10 p-10 md:p-16 text-center" style={{ background: `radial-gradient(600px 300px at 50% 100%, ${ctx.accent}22, transparent)` }}>
        <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow>
        <H ctx={ctx} className="mt-2 mx-auto">{p.title}</H>
        <div className="mt-6 max-w-md mx-auto flex flex-col sm:flex-row gap-2">
          <input placeholder={p.placeholder} className="flex-1 h-12 rounded-full bg-white/5 border border-white/10 px-4 text-sm outline-none" />
          <button className="h-12 px-6 rounded-full text-sm font-medium text-black" style={{ background: ctx.accent }}>{p.ctaLabel}</button>
        </div>
      </div>
    </Container></section>
  );
}

function MapBlock({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="rounded-3xl border border-white/10 aspect-[16/8] overflow-hidden relative" style={{ background: "linear-gradient(45deg, #1a1a1a, #0a0a0a)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke={ctx.accent} strokeOpacity="0.3" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-6 w-6 rounded-full ring-4 ring-black" style={{ background: ctx.accent, boxShadow: `0 0 0 10px ${ctx.accent}22` }} />
        </div>
        {p.address && <div className="absolute bottom-4 left-4 right-4 text-xs text-white/80 whitespace-pre-line bg-black/40 backdrop-blur rounded-lg p-3">{p.address}</div>}
      </div>
    </Container></section>
  );
}

function CTA({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-20"><Container>
      <div className="rounded-3xl p-10 md:p-16 text-center border border-white/10" style={{ background: `linear-gradient(135deg, ${ctx.accent}44, transparent)` }}>
        <H ctx={ctx} className="mx-auto max-w-2xl">{p.title}</H>
        <Sub className="mt-4 mx-auto">{p.body}</Sub>
        <div className="mt-6 flex justify-center"><CTARow a={p.primaryCta} b={p.secondaryCta} ctx={ctx} center /></div>
      </div>
    </Container></section>
  );
}

function TextBlock({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return <section className="py-20"><Container className="max-w-2xl">
    <H ctx={ctx}>{p.title}</H>
    <p className="mt-4 text-muted-foreground whitespace-pre-line">{p.body}</p>
  </Container></section>;
}

/* ---------- DYNAMIC COMMERCE (reads live store data) ---------- */

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function productUrl(handle: string) {
  if (typeof window === "undefined") return `?product=${handle}`;
  const u = new URL(window.location.href);
  u.searchParams.set("product", handle);
  u.searchParams.delete("view");
  return u.pathname + u.search;
}
function viewUrl(view: string) {
  if (typeof window === "undefined") return `?view=${view}`;
  const u = new URL(window.location.href);
  u.searchParams.set("view", view);
  u.searchParams.delete("product");
  return u.pathname + u.search;
}

function ProductCard({ p, ctx }: { p: any; ctx: Ctx }) {
  const addToCart = useStoreData((s) => s.addToCart);
  const toggleWishlist = useStoreData((s) => s.toggleWishlist);
  const inWishlist = useStoreData((s) => s.wishlist.includes(p.id));
  const openCart = useSiteUI((u) => u.openCart);
  const toast = useSiteUI((u) => u.toast);
  const img = p.images?.[0] ?? p.imageUrl;
  const outOfStock = p.trackInventory !== false && p.stock === 0 && p.continueSellingWhenOutOfStock !== true;
  return (
    <div className="group">
      <a href={productUrl(p.handle)} className="block">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ background: `linear-gradient(135deg, ${ctx.accent}22, #0000)` }}>
          {img ? <img src={img} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" /> : null}
          {p.compareAtPrice && p.compareAtPrice > p.price ? (
            <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-black" style={{ background: ctx.accent }}>SALE</div>
          ) : null}
          {outOfStock ? (
            <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium bg-black/70 text-white">Sold out</div>
          ) : null}
          <button
            type="button"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => { e.preventDefault(); const now = toggleWishlist(p.id); toast(now ? "Added to wishlist" : "Removed from wishlist", "info"); }}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-full grid place-items-center backdrop-blur-md bg-black/40 text-white hover:scale-110 transition"
          >
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? "fill-current" : ""}`} style={inWishlist ? { color: ctx.accent } : undefined} />
          </button>
        </div>
      </a>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a href={productUrl(p.handle)} className="text-sm font-medium hover:underline block truncate">{p.name}</a>
          <div className="text-xs text-muted-foreground">
            {fmt(p.price)}
            {p.compareAtPrice && p.compareAtPrice > p.price ? (
              <span className="ml-2 line-through opacity-60">{fmt(p.compareAtPrice)}</span>
            ) : null}
          </div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); const r = addToCart(p.id, 1); toast(r.message, r.ok ? "success" : "error"); if (r.ok) openCart(); }}
          disabled={outOfStock}
          className="h-8 px-3 rounded-full text-[11px] font-medium text-black disabled:opacity-40 shrink-0"
          style={{ background: ctx.accent }}>{outOfStock ? "Sold" : "Add"}</button>
      </div>
    </div>
  );
}


function useDisplayProducts(filter: (p: any) => boolean, limit: number) {
  const products = useStoreData((s) => s.products);
  return products.filter((p) => p.status === "Published").filter(filter).slice(0, limit);
}

function FeaturedProductsDyn({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const items = useDisplayProducts((x) => x.featured === true, p.limit ?? 8);
  const fallback = useDisplayProducts(() => true, p.limit ?? 8);
  const list = items.length ? items : fallback;
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      {list.length === 0
        ? <p className="mt-8 text-sm text-muted-foreground">No products yet — add products in your dashboard to populate this section.</p>
        : <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">{list.map((it) => <ProductCard key={it.id} p={it} ctx={ctx} />)}</div>}
    </Container></section>
  );
}
function NewArrivalsDyn({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const products = useStoreData((st) => st.products);
  const list = [...products].filter((x) => x.status === "Published").sort((a, b) => b.createdAt - a.createdAt).slice(0, p.limit ?? 8);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      {list.length === 0
        ? <p className="mt-8 text-sm text-muted-foreground">No products yet.</p>
        : <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">{list.map((it) => <ProductCard key={it.id} p={it} ctx={ctx} />)}</div>}
    </Container></section>
  );
}
function BestSellersDyn({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const products = useStoreData((st) => st.products);
  const orders = useStoreData((st) => st.orders);
  const count = new Map<string, number>();
  for (const o of orders) if (o.status !== "Refunded" && o.status !== "Cancelled")
    for (const i of o.items) count.set(i.productId, (count.get(i.productId) ?? 0) + i.qty);
  const list = [...products]
    .filter((x) => x.status === "Published")
    .sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0))
    .slice(0, p.limit ?? 8);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      {list.length === 0
        ? <p className="mt-8 text-sm text-muted-foreground">No sales yet — best sellers will appear once orders roll in.</p>
        : <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">{list.map((it) => <ProductCard key={it.id} p={it} ctx={ctx} />)}</div>}
    </Container></section>
  );
}
function CollectionsShowcaseDyn({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  const collections = useStoreData((st) => st.collections);
  const list = collections.slice(0, p.limit ?? 6);
  return (
    <section className="py-20"><Container>
      <Eyebrow ctx={ctx}>{p.eyebrow}</Eyebrow><H ctx={ctx} className="mt-2">{p.title}</H>
      {list.length === 0
        ? <p className="mt-8 text-sm text-muted-foreground">No collections yet — create collections in your dashboard.</p>
        : <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {list.map((c, i) => (
              <a key={c.id} href={`?collection=${c.handle}`} className="aspect-[4/3] rounded-2xl border border-white/10 p-6 flex flex-col justify-end overflow-hidden relative"
                style={{ background: c.imageUrl ? `url(${c.imageUrl}) center/cover` : `linear-gradient(${45 + i * 30}deg, ${ctx.accent}22, transparent)` }}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative">
                  <div className="text-xl font-semibold text-white" style={{ fontFamily: ctx.fontDisplay }}>{c.name}</div>
                  <div className="text-sm text-white/70">{c.productIds.length} products · Explore →</div>
                </div>
              </a>
            ))}
          </div>}
    </Container></section>
  );
}
function PromoBannerDyn({ s, ctx }: { s: Section; ctx: Ctx }) {
  const p = mergeDefaults(s.type, s.props);
  return (
    <section className="py-8"><Container>
      <div className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: `linear-gradient(90deg, ${ctx.accent}33, transparent)`, border: `1px solid ${ctx.accent}44` }}>
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: ctx.accent }}>{p.eyebrow}</div>
          <div className="text-lg font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{p.title}</div>
          {p.body ? <div className="text-sm text-muted-foreground mt-1">{p.body}</div> : null}
        </div>
        <a href={p.button?.url || viewUrl("shop")} className="inline-flex items-center h-10 px-4 rounded-full text-sm font-medium text-black" style={{ background: ctx.accent }}>
          {p.button?.label || "Shop now"}
        </a>
      </div>
    </Container></section>
  );
}

/* ---------- REGISTRY ---------- */

const REG: Record<SectionType, (p: { s: Section; ctx: Ctx }) => React.ReactElement> = {
  "hero-simple": HeroSimple, "hero-fashion": HeroFashion, "hero-luxury": HeroLuxury,
  "hero-electronics": HeroElectronics, "hero-restaurant": HeroRestaurant, "hero-medical": HeroMedical,
  "hero-corporate": HeroCorporate, "hero-portfolio": HeroPortfolio, "hero-agency": HeroAgency,
  "hero-beauty": HeroBeauty, "hero-realestate": HeroRealEstate, "hero-furniture": HeroFurniture,
  "hero-education": HeroEducation,
  banner: Banner, cta: CTA, newsletter: Newsletter, countdown: Countdown,
  "featured-collections": FeaturedCollections, lookbook: Lookbook, instagram: InstagramFeed,
  "product-comparison": ProductComparison, "featured-gadgets": FeaturedGadgets, "categories-grid": CategoriesGrid,
  products: Products, pricing: Pricing,
  "featured-products": FeaturedProductsDyn,
  "new-arrivals": NewArrivalsDyn,
  "best-sellers": BestSellersDyn,
  "collections-showcase": CollectionsShowcaseDyn,
  "promo-banner": PromoBannerDyn,
  "food-menu": FoodMenu, chef: Chef, "opening-hours": OpeningHours,
  "reservation-form": (p) => <GenericForm {...p} gradient />,
  doctors: Doctors,
  "appointment-form": (p) => <GenericForm {...p} />,
  services: Services, team: Team, testimonials: Testimonials,
  "portfolio-grid": PortfolioGrid, timeline: TimelineBlock, "case-studies": CaseStudies,
  gallery: Gallery, video: VideoBlock, faq: FAQ,
  "contact-form": (p) => <GenericForm {...p} />,
  map: MapBlock, "text-block": TextBlock,
};

export function renderSection(s: Section, ctx: Ctx) {
  const C = REG[s.type] ?? HeroSimple;
  return <C s={s} ctx={ctx} />;
}
