import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getTemplate } from "@/lib/templates-data";
import { getThemeColor } from "@/lib/theme-colors";
import { buildDefaultsForTemplate, type SectionType } from "@/lib/template-kits";

export type NavChild = { id: string; label: string; pageId: string | null; url?: string };
export type NavItem = {
  id: string;
  label: string;
  pageId: string | null;
  url?: string;
  visible: boolean;
  children?: NavChild[];
};

export type Section = {
  id: string;
  type: SectionType;
  visible: boolean;
  props?: Record<string, any>;
};

export type PageSeo = {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
};

export type Page = {
  id: string;
  slug: string;
  label: string;
  visible: boolean;
  sections: Section[];
  seo?: PageSeo;
};

export type FooterConfig = {
  tagline?: string;
  copyright?: string;
  email?: string;
  phone?: string;
  address?: string;
  socials?: { label: string; url: string }[];
};

export type PublishStatus = "unpublished" | "draft" | "publishing" | "published";

type TenantData = {
  installed: boolean;
  templateId: string | null;
  themeColorId: string;
  accent: string;
  fontDisplay: string;
  fontBody: string;
  radius: number;
  density: number;
  mode: "dark" | "light";
  storeName: string;
  storeSlug: string;
  storeType: string;
  logoUrl: string | null;
  publishStatus: PublishStatus;
  publishedAt: number | null;
  unpublishedAt: number | null;
  nav: NavItem[];
  pages: Page[];
  currentPageId: string | null;
  footer: FooterConfig;
  lastSavedAt: number | null;
};

export type SiteState = TenantData & {
  // Multi-tenant support
  activeTenantId: string;
  tenants: Record<string, TenantData>;

  // actions
  switchTenant: (tenantId: string) => void;
  resetTenant: () => void;
  applyTemplate: (templateId: string, themeColorId?: string) => void;
  reset: () => void;
  setTheme: (patch: Partial<Pick<SiteState, "themeColorId" | "accent" | "fontDisplay" | "fontBody" | "radius" | "density" | "mode">>) => void;

  setStoreInfo: (patch: Partial<Pick<SiteState, "storeName" | "storeSlug" | "storeType" | "logoUrl">>) => void;
  setFooter: (patch: Partial<FooterConfig>) => void;
  publish: () => void;
  unpublish: () => void;
  setPublishStatus: (s: PublishStatus) => void;
  saveAll: () => void;
  validateForPublish: () => { ok: boolean; errors: string[] };

  addNavItem: (init?: Partial<NavItem>) => string;
  updateNavItem: (id: string, patch: Partial<NavItem>) => void;
  removeNavItem: (id: string) => void;
  reorderNav: (fromIdx: number, toIdx: number) => void;
  toggleNavItem: (id: string) => void;
  addNavChild: (parentId: string, init?: Partial<NavChild>) => void;
  updateNavChild: (parentId: string, childId: string, patch: Partial<NavChild>) => void;
  removeNavChild: (parentId: string, childId: string) => void;

  addPage: (init?: Partial<Page>) => string;
  updatePage: (id: string, patch: Partial<Page>) => void;
  updatePageSeo: (id: string, patch: Partial<PageSeo>) => void;
  duplicatePage: (id: string) => void;
  removePage: (id: string) => void;
  setCurrentPage: (id: string) => void;
  reorderPage: (fromIdx: number, toIdx: number) => void;

  addSection: (pageId: string, type: SectionType) => string;
  duplicateSection: (pageId: string, sectionId: string) => void;
  removeSection: (pageId: string, sectionId: string) => void;
  toggleSection: (pageId: string, sectionId: string) => void;
  updateSection: (pageId: string, sectionId: string, patch: Partial<Section>) => void;
  reorderSection: (pageId: string, fromIdx: number, toIdx: number) => void;
};


function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_FOOTER: FooterConfig = {
  tagline: "Made with Aether",
  copyright: `© ${new Date().getFullYear()} · Aether`,
  email: "hello@example.com",
  phone: "",
  address: "",
  socials: [
    { label: "Twitter", url: "#" },
    { label: "Instagram", url: "#" },
  ],
};

const EMPTY: Omit<SiteState, "activeTenantId" | "tenants" | keyof ReturnType<typeof actions>> = {
  installed: false,
  templateId: null,
  themeColorId: "purple",
  accent: "#a855f7",
  fontDisplay: "Space Grotesk",
  fontBody: "Inter",
  radius: 14,
  density: 1,
  mode: "dark",
  storeName: "",
  storeSlug: "",
  storeType: "",
  logoUrl: null,
  publishStatus: "unpublished",
  publishedAt: null,
  unpublishedAt: null,
  nav: [],
  pages: [],
  currentPageId: null,
  footer: DEFAULT_FOOTER,
  lastSavedAt: null,
} as any;

function emptyTenant(): TenantData {
  return {
    installed: false,
    templateId: null,
    themeColorId: "purple",
    accent: "#a855f7",
    fontDisplay: "Space Grotesk",
    fontBody: "Inter",
    radius: 14,
    density: 1,
    mode: "dark",
    storeName: "",
    storeSlug: "",
    storeType: "",
    logoUrl: null,
    publishStatus: "unpublished",
    publishedAt: null,
    unpublishedAt: null,
    nav: [],
    pages: [],
    currentPageId: null,
    footer: DEFAULT_FOOTER,
    lastSavedAt: null,
  };
}

function saveTenant(s: any): { tenants: Record<string, TenantData> } {
  const snap: TenantData = {
    installed: s.installed, templateId: s.templateId, themeColorId: s.themeColorId,
    accent: s.accent, fontDisplay: s.fontDisplay, fontBody: s.fontBody,
    radius: s.radius, density: s.density, mode: s.mode,
    storeName: s.storeName, storeSlug: s.storeSlug, storeType: s.storeType, logoUrl: s.logoUrl,
    publishStatus: s.publishStatus, publishedAt: s.publishedAt, unpublishedAt: s.unpublishedAt,
    nav: s.nav, pages: s.pages, currentPageId: s.currentPageId, footer: s.footer,
    lastSavedAt: s.lastSavedAt,
  };
  return { tenants: { ...s.tenants, [s.activeTenantId]: snap } };
}

function actions() { return {} as any; }

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      activeTenantId: "default",
      tenants: {},
      ...(EMPTY as any),

      switchTenant: (tenantId) => {
        const state = get();
        // Persist current tenant snapshot before switching
        const snap: TenantData = {
          installed: state.installed, templateId: state.templateId, themeColorId: state.themeColorId,
          accent: state.accent, fontDisplay: state.fontDisplay, fontBody: state.fontBody,
          radius: state.radius, density: state.density, mode: state.mode,
          storeName: state.storeName, storeSlug: state.storeSlug, storeType: state.storeType, logoUrl: state.logoUrl,
          publishStatus: state.publishStatus, publishedAt: state.publishedAt, unpublishedAt: state.unpublishedAt,
          nav: state.nav, pages: state.pages, currentPageId: state.currentPageId, footer: state.footer,
          lastSavedAt: state.lastSavedAt,
        };

        const tenants = { ...state.tenants, [state.activeTenantId]: snap };
        const next = tenants[tenantId] ?? emptyTenant();
        set({ activeTenantId: tenantId, tenants, ...next });
      },

      resetTenant: () => {
        const state = get();
        set({ ...emptyTenant(), tenants: { ...state.tenants, [state.activeTenantId]: emptyTenant() } });
      },

      applyTemplate: (templateId, themeColorId) => {
        const tpl = getTemplate(templateId);
        const color = getThemeColor(themeColorId ?? "purple");
        const kit = buildDefaultsForTemplate(tpl);

        // build pages: kit.pages already contain default sections
        const pages: Page[] = kit.pages.map((p) => ({
          id: uid("page"),
          slug: p.slug,
          label: p.label,
          visible: true,
          sections: p.sections.map((s) => ({
            id: uid("sec"),
            type: s.type,
            visible: true,
            props: s.props ?? {},
          })),
        }));

        // build nav: keys reference labels; we'll match by slug to page ids
        const bySlug = new Map(pages.map((p) => [p.slug, p.id]));
        const nav: NavItem[] = kit.nav.map((n) => ({
          id: uid("nav"),
          label: n.label,
          pageId: n.slug ? bySlug.get(n.slug) ?? null : null,
          url: n.url,
          visible: n.visible ?? true,
        }));

        set((s) => ({
          installed: true,
          templateId: tpl.id,
          themeColorId: color.id,
          accent: color.accent,
          fontDisplay: kit.fontDisplay ?? tpl.fontDisplay,
          fontBody: kit.fontBody ?? tpl.fontBody,
          radius: 14,
          density: 1,
          mode: color.id === "light" ? "light" : "dark",
          nav,
          pages,
          currentPageId: pages[0]?.id ?? null,
          // preserve store identity across template swaps
          storeName: s.storeName,
          storeSlug: s.storeSlug,
          storeType: s.storeType || tpl.industry,
          logoUrl: s.logoUrl,
          footer: s.footer ?? DEFAULT_FOOTER,
          publishStatus: s.publishStatus === "published" ? "draft" : s.publishStatus,
          publishedAt: s.publishedAt,
          lastSavedAt: Date.now(),
          ...saveTenant({...s, installed: true, templateId: tpl.id}),
        }));
      },

      reset: () => set({ ...EMPTY } as any),

      setTheme: (patch) => set((s) => ({ ...s, ...patch, lastSavedAt: Date.now() })),

      setStoreInfo: (patch) => set((s) => {
        const next = { ...s, ...patch, lastSavedAt: Date.now() };
        if (patch.storeName && !patch.storeSlug && !s.storeSlug) {
          next.storeSlug = patch.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-store";
        }
        return next;
      }),
      publish: () => set({ publishStatus: "published", publishedAt: Date.now(), lastSavedAt: Date.now() }),
      unpublish: () => set({ publishStatus: "unpublished", unpublishedAt: Date.now(), lastSavedAt: Date.now() }),
      setPublishStatus: (s) => set({ publishStatus: s }),
      saveAll: () => set({ lastSavedAt: Date.now() }),
      validateForPublish: () => {
        const s = get();
        const errors: string[] = [];
        if (!s.installed || !s.templateId) errors.push("No template applied yet.");
        if (!s.pages || s.pages.length === 0) errors.push("Your website has no pages.");
        const home = s.pages.find((p) => p.slug === "/" || p.slug === "home" || p.slug === "");
        if (!home && !s.pages[0]) errors.push("A Home page is required.");
        const totalSections = s.pages.reduce((n, p) => n + p.sections.length, 0);
        if (totalSections === 0) errors.push("Add at least one section before publishing.");
        if (!s.storeName?.trim()) errors.push("Store name is required.");
        return { ok: errors.length === 0, errors };
      },


      addNavItem: (init) => {
        const id = uid("nav");
        set((s) => ({
          nav: [...s.nav, { id, label: init?.label ?? "New link", pageId: init?.pageId ?? null, url: init?.url, visible: init?.visible ?? true }],
          lastSavedAt: Date.now(),
        }));
        return id;
      },
      updateNavItem: (id, patch) => set((s) => ({ nav: s.nav.map((n) => (n.id === id ? { ...n, ...patch } : n)), lastSavedAt: Date.now() })),
      removeNavItem: (id) => set((s) => ({ nav: s.nav.filter((n) => n.id !== id), lastSavedAt: Date.now() })),
      toggleNavItem: (id) => set((s) => ({ nav: s.nav.map((n) => (n.id === id ? { ...n, visible: !n.visible } : n)), lastSavedAt: Date.now() })),
      reorderNav: (from, to) => set((s) => ({ nav: arrMove(s.nav, from, to), lastSavedAt: Date.now() })),

      addNavChild: (parentId, init) => set((s) => ({
        nav: s.nav.map((n) => n.id === parentId
          ? { ...n, children: [...(n.children ?? []), { id: uid("navc"), label: init?.label ?? "New link", pageId: init?.pageId ?? null, url: init?.url }] }
          : n),
        lastSavedAt: Date.now(),
      })),
      updateNavChild: (parentId, childId, patch) => set((s) => ({
        nav: s.nav.map((n) => n.id === parentId
          ? { ...n, children: (n.children ?? []).map((c) => c.id === childId ? { ...c, ...patch } : c) }
          : n),
        lastSavedAt: Date.now(),
      })),
      removeNavChild: (parentId, childId) => set((s) => ({
        nav: s.nav.map((n) => n.id === parentId
          ? { ...n, children: (n.children ?? []).filter((c) => c.id !== childId) }
          : n),
        lastSavedAt: Date.now(),
      })),

      setFooter: (patch) => set((s) => ({ footer: { ...s.footer, ...patch }, lastSavedAt: Date.now() })),

      addPage: (init) => {
        const id = uid("page");
        const label = init?.label ?? "New page";
        const slug = init?.slug ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const page: Page = {
          id,
          slug,
          label,
          visible: init?.visible ?? true,
          sections: init?.sections ?? [
            { id: uid("sec"), type: "hero-simple", visible: true, props: { eyebrow: label, title: label, body: `Welcome to the ${label} page.` } },
          ],
          seo: init?.seo,
        };
        set((s) => ({
          pages: [...s.pages, page],
          // auto-add to nav
          nav: [...s.nav, { id: uid("nav"), label, pageId: id, visible: true }],
          currentPageId: id,
          lastSavedAt: Date.now(),
        }));
        return id;
      },
      updatePage: (id, patch) =>
        set((s) => ({
          pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          nav: patch.label ? s.nav.map((n) => (n.pageId === id ? { ...n, label: patch.label! } : n)) : s.nav,
          lastSavedAt: Date.now(),
        })),
      updatePageSeo: (id, patch) =>
        set((s) => ({
          pages: s.pages.map((p) => (p.id === id ? { ...p, seo: { ...(p.seo ?? {}), ...patch } } : p)),
          lastSavedAt: Date.now(),
        })),
      duplicatePage: (id) => set((s) => {
        const idx = s.pages.findIndex((p) => p.id === id);
        if (idx < 0) return s;
        const src = s.pages[idx];
        const newId = uid("page");
        const newSlug = `${src.slug}-copy`;
        const clone: Page = {
          ...src, id: newId, slug: newSlug, label: `${src.label} copy`,
          sections: src.sections.map((sec) => ({ ...sec, id: uid("sec"), props: { ...(sec.props ?? {}) } })),
        };
        const pages = [...s.pages]; pages.splice(idx + 1, 0, clone);
        return { pages, nav: [...s.nav, { id: uid("nav"), label: clone.label, pageId: newId, visible: true }], lastSavedAt: Date.now() };
      }),
      removePage: (id) =>
        set((s) => ({
          pages: s.pages.filter((p) => p.id !== id),
          nav: s.nav.filter((n) => n.pageId !== id),
          currentPageId: s.currentPageId === id ? s.pages.find((p) => p.id !== id)?.id ?? null : s.currentPageId,
          lastSavedAt: Date.now(),
        })),
      setCurrentPage: (id) => set({ currentPageId: id }),
      reorderPage: (from, to) => set((s) => ({ pages: arrMove(s.pages, from, to), lastSavedAt: Date.now() })),

      addSection: (pageId, type) => {
        const id = uid("sec");
        set((s) => ({
          pages: s.pages.map((p) => (p.id === pageId ? { ...p, sections: [...p.sections, { id, type, visible: true, props: {} }] } : p)),
          lastSavedAt: Date.now(),
        }));
        return id;
      },
      duplicateSection: (pageId, sectionId) =>
        set((s) => ({
          pages: s.pages.map((p) => {
            if (p.id !== pageId) return p;
            const idx = p.sections.findIndex((x) => x.id === sectionId);
            if (idx < 0) return p;
            const clone: Section = { ...p.sections[idx], id: uid("sec") };
            const next = [...p.sections];
            next.splice(idx + 1, 0, clone);
            return { ...p, sections: next };
          }),
          lastSavedAt: Date.now(),
        })),
      removeSection: (pageId, sectionId) =>
        set((s) => ({
          pages: s.pages.map((p) => (p.id === pageId ? { ...p, sections: p.sections.filter((x) => x.id !== sectionId) } : p)),
          lastSavedAt: Date.now(),
        })),
      toggleSection: (pageId, sectionId) =>
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, sections: p.sections.map((x) => (x.id === sectionId ? { ...x, visible: !x.visible } : x)) } : p,
          ),
          lastSavedAt: Date.now(),
        })),
      updateSection: (pageId, sectionId, patch) =>
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, sections: p.sections.map((x) => (x.id === sectionId ? { ...x, ...patch, props: { ...x.props, ...(patch.props ?? {}) } } : x)) } : p,
          ),
          lastSavedAt: Date.now(),
        })),
      reorderSection: (pageId, from, to) =>
        set((s) => ({
          pages: s.pages.map((p) => (p.id === pageId ? { ...p, sections: arrMove(p.sections, from, to) } : p)),
          lastSavedAt: Date.now(),
        })),
    }),
    {
      name: "aether.site.v2",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
      version: 2,
      partialize: (s) => {
        const snap: TenantData = {
          installed: s.installed,
          templateId: s.templateId,
          themeColorId: s.themeColorId,
          accent: s.accent,
          fontDisplay: s.fontDisplay,
          fontBody: s.fontBody,
          radius: s.radius,
          density: s.density,
          mode: s.mode,
          storeName: s.storeName,
          storeSlug: s.storeSlug,
          storeType: s.storeType,
          logoUrl: s.logoUrl,
          publishStatus: s.publishStatus === "publishing" ? "draft" : s.publishStatus,
          publishedAt: s.publishedAt,
          unpublishedAt: s.unpublishedAt,
          nav: s.nav,
          pages: s.pages,
          currentPageId: s.currentPageId,
          footer: s.footer,
          lastSavedAt: s.lastSavedAt,
        };
        return {
          activeTenantId: s.activeTenantId,
          tenants: { ...s.tenants, [s.activeTenantId]: snap },
        };
      },
      migrate: (persisted: any, version) => {
        if (!persisted) return { activeTenantId: "default", tenants: { default: emptyTenant() }, ...emptyTenant() };
        // v1 → v2: wrap into tenants["default"]
        if (version < 2 && !persisted.tenants) {
          const t: TenantData = {
            installed: persisted.installed ?? false,
            templateId: persisted.templateId ?? null,
            themeColorId: persisted.themeColorId ?? "purple",
            accent: persisted.accent ?? "#a855f7",
            fontDisplay: persisted.fontDisplay ?? "Space Grotesk",
            fontBody: persisted.fontBody ?? "Inter",
            radius: persisted.radius ?? 14,
            density: persisted.density ?? 1,
            mode: persisted.mode ?? "dark",
            storeName: persisted.storeName ?? "",
            storeSlug: persisted.storeSlug ?? "",
            storeType: persisted.storeType ?? "",
            logoUrl: persisted.logoUrl ?? null,
            publishStatus: persisted.publishStatus ?? "unpublished",
            publishedAt: persisted.publishedAt ?? null,
            unpublishedAt: persisted.unpublishedAt ?? null,
            nav: persisted.nav ?? [],
            pages: persisted.pages ?? [],
            currentPageId: persisted.currentPageId ?? null,
            footer: persisted.footer ?? DEFAULT_FOOTER,
            lastSavedAt: persisted.lastSavedAt ?? null,
          };
          return { activeTenantId: "default", tenants: { default: t }, ...t };
        }
        return persisted;
      },
    },
  ),
);

function arrMove<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
