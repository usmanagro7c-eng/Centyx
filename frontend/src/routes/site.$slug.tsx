import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";

import { Rocket, Sparkles } from "lucide-react";
import { useSiteStore } from "@/lib/site-store";
import { useStoreData } from "@/lib/store-data-store";
import { SiteRender } from "@/components/site/site-render";
import { StorefrontOverlay } from "@/components/site/storefront";

export const Route = createFileRoute("/site/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: typeof search.view === "string" ? search.view : undefined,
    product: typeof search.product === "string" ? search.product : undefined,
    collection: typeof search.collection === "string" ? search.collection : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    order: typeof search.order === "string" ? search.order : undefined,
  }),

  component: PublicSitePage,
});

function normalize(s: string) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function PublicSitePage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const site = useSiteStore();
  const bumpVisitors = useStoreData((s) => s.bumpVisitors);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);


  // Wait for zustand persist to rehydrate from localStorage on the client.
  useEffect(() => {
    let cancelled = false;
    // Rehydrate explicitly, then flip the flag. Also handles the case where
    // rehydration completed synchronously (persist runs on module init).
    const p: any = (useSiteStore as any).persist;
    const finish = () => { if (!cancelled) setHydrated(true); };
    if (p?.hasHydrated?.()) { finish(); }
    else if (p?.onFinishHydration) {
      const unsub = p.onFinishHydration(finish);
      // Safety timeout so we never get stuck on the loading screen.
      const t = window.setTimeout(finish, 400);
      return () => { cancelled = true; unsub?.(); clearTimeout(t); };
    } else {
      const t = window.setTimeout(finish, 200);
      return () => { cancelled = true; clearTimeout(t); };
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hydrated && site.publishStatus === "published") bumpVisitors();
  }, [hydrated, site.publishStatus, bumpVisitors]);

  useEffect(() => {
    if (!activePageId && site.currentPageId) setActivePageId(site.currentPageId);
  }, [activePageId, site.currentPageId]);

  const target = normalize(slug);
  const savedSlug = normalize(site.storeSlug);
  const savedName = normalize(site.storeName);
  const savedTemplate = normalize(site.templateId || "");
  const canonicalSlug = savedSlug || savedName || savedTemplate;

  const siteExists = site.installed && site.pages.length > 0 && !!canonicalSlug;
  const matches =
    siteExists &&
    (target === savedSlug || target === savedName || target === savedTemplate);

  // If a site exists but the URL slug is wrong, redirect to the canonical slug.
  useEffect(() => {
    if (hydrated && siteExists && !matches && canonicalSlug && canonicalSlug !== target) {
      navigate({ to: "/site/$slug", params: { slug: canonicalSlug }, search: search as any, replace: true });
    }
  }, [hydrated, siteExists, matches, canonicalSlug, target, navigate]);

  const activePage = site.pages.find((p) => p.id === (activePageId ?? site.currentPageId));
  const seo = activePage?.seo ?? {};

  useEffect(() => {
    if (!activePage) return;
    const title = seo.title || `${activePage.label} — ${site.storeName || "Site"}`;
    document.title = title;
    const upsert = (attr: "name" | "property", key: string, content?: string) => {
      if (!content) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    upsert("name", "description", seo.description);
    upsert("name", "keywords", seo.keywords);
    upsert("name", "robots", seo.noindex ? "noindex,nofollow" : "index,follow");
    upsert("property", "og:title", title);
    upsert("property", "og:description", seo.description);
    upsert("property", "og:image", seo.ogImage);
    upsert("property", "og:type", "website");
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (seo.canonical) {
      if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
      link.href = seo.canonical;
    } else if (link) { link.remove(); }
  }, [activePage, seo.title, seo.description, seo.keywords, seo.noindex, seo.ogImage, seo.canonical, site.storeName]);

  // 1) SSR / pre-hydration: neutral shell (no false negatives).
  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  // 2) Site exists but URL slug is off — we're mid-redirect. Show a neutral shell.
  if (siteExists && !matches) {
    return <div className="min-h-screen bg-background" />;
  }

  // 3) No site has ever been built — friendly onboarding, not an error.
  if (!siteExists) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-gradient grid place-items-center shadow-glow">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold">No website yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven't published a website to <span className="font-mono">/site/{slug}</span> yet.
            Pick a template, customize it, and hit Publish to make it live here.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link
              to="/templates"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow"
            >
              <Rocket className="h-4 w-4" /> Publish a website
            </Link>
            <Link to="/" className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm inline-flex items-center">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOverlay = !!(search.product || search.view || search.category || search.collection || search.order);


  return (
    <div className="min-h-screen">
      <PublicSiteBoundary>
        <SiteRender
          pageId={activePageId ?? undefined}
          onNavigatePage={(id) => setActivePageId(id)}
          overrideMain={isOverlay ? <StorefrontOverlay /> : undefined}
        />
      </PublicSiteBoundary>
    </div>
  );
}

class PublicSiteBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[PublicSite] Render failed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
          <div className="text-center max-w-md">
            <h1 className="font-display text-2xl font-semibold">This page didn't load correctly</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Something in your published site failed to render. Open the browser console for details, or reload the page.
            </p>
            <pre className="mt-4 text-left text-[11px] p-3 rounded-xl bg-black/40 border border-white/10 overflow-auto max-h-40">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button onClick={() => location.reload()} className="h-10 px-5 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow">Reload</button>
              <Link to="/" className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm inline-flex items-center">Home</Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

