import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Save, Eye, Rocket, Undo2, Redo2, Monitor, Tablet, Smartphone,
  Layers as LayersIcon, FileText, Palette, Menu, Check, Sparkles, X, Plus,
  Trash2, Copy, EyeOff, ChevronUp, ChevronDown, GripVertical, Home,
  Settings as SettingsIcon,
} from "lucide-react";
import { z } from "zod";
import { getTemplate, TEMPLATES } from "@/lib/templates-data";
import { THEME_COLORS } from "@/lib/theme-colors";
import { useSiteStore } from "@/lib/site-store";
import { SECTION_LIBRARY, type SectionType } from "@/lib/template-kits";
import { SiteRender } from "@/components/site/site-render";
import { SectionInspector, TextInput, TextArea, ImagePicker } from "@/components/builder/inspector";
import { PublishFlow } from "@/components/builder/publish-flow";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  template: z.string().optional(),
  color: z.string().optional(),
});

export const Route = createFileRoute("/builder")({
  head: () => ({ meta: [{ title: "Website Builder — Aether" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Builder,
});

type Device = "desktop" | "tablet" | "mobile";
type Panel = "pages" | "sections" | "add" | "navigation" | "theme" | "site";

function Builder() {
  const { template: tid, color: colorId } = Route.useSearch();
  const navigate = useNavigate();
  const site = useSiteStore();
  const applyTemplate = useSiteStore((s) => s.applyTemplate);

  useEffect(() => {
    if (tid && (!site.installed || site.templateId !== tid)) applyTemplate(tid, colorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid]);

  const currentTpl = site.templateId ? getTemplate(site.templateId) : tid ? getTemplate(tid) : TEMPLATES[0];

  const [device, setDevice] = useState<Device>("desktop");
  const [panel, setPanel] = useState<Panel>("pages");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [savedTs, setSavedTs] = useState<"idle" | "saving" | "saved">("idle");
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    if (!site.lastSavedAt) return;
    setSavedTs("saving");
    const a = setTimeout(() => setSavedTs("saved"), 300);
    const b = setTimeout(() => setSavedTs("idle"), 1400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [site.lastSavedAt]);

  const frameW = device === "desktop" ? 1180 : device === "tablet" ? 820 : 380;

  if (!site.installed) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">No template installed</h1>
          <p className="text-sm text-muted-foreground">Pick a template from the marketplace to start editing.</p>
          <button onClick={() => navigate({ to: "/templates" })}
            className="h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow">
            Browse templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 h-14 border-b border-white/[0.06] bg-background/60 backdrop-blur-2xl flex items-center gap-2 px-3 md:px-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg glass hover:bg-white/10 text-xs transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className={cn("hidden md:flex h-9 w-9 rounded-xl bg-gradient-to-br grid place-items-center shadow-glow", currentTpl.tint)}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 hidden md:block">
          <div className="text-sm font-semibold truncate">{site.storeName || currentTpl.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            Draft · {savedTs === "saving" ? "Saving…" : savedTs === "saved" ? "Saved" : "Autosaved"}
          </div>
        </div>

        <div className="mx-auto flex items-center gap-2">
          <DeviceSwitch value={device} onChange={setDevice} />
        </div>

        <div className="flex items-center gap-1.5">
          <IconAction icon={Undo2} label="Undo" />
          <IconAction icon={Redo2} label="Redo" />
          <button onClick={() => { site.saveAll(); setSavedTs("saved"); setTimeout(() => setSavedTs("idle"), 1500); }}
            className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs transition",
              savedTs === "saved" ? "bg-emerald-400/20 text-emerald-200" : "glass hover:bg-white/10")}>
            {savedTs === "saved" ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{savedTs === "saving" ? "Saving…" : savedTs === "saved" ? "Saved" : "Save"}</span>
          </button>
          <a href={`/site/${site.storeSlug || currentTpl.id}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg glass hover:bg-white/10 text-xs">
            <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Preview</span>
          </a>
          <PublishStatusBadge status={site.publishStatus} />
          {site.publishStatus === "published" ? (
            <button onClick={() => site.unpublish()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg glass hover:bg-white/10 text-xs">
              Unpublish
            </button>
          ) : null}
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => { site.saveAll(); setPublishOpen(true); }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
            <Rocket className="h-3.5 w-3.5" /> {site.publishStatus === "published" ? "Republish" : "Publish"}
          </motion.button>
        </div>
      </header>


      <div className="flex-1 min-h-0 grid grid-cols-[56px_320px_1fr] md:grid-cols-[56px_320px_1fr_340px]">
        <nav className="border-r border-white/[0.06] bg-background/40 backdrop-blur-2xl flex flex-col items-center gap-1 py-3">
          {([
            { k: "pages", icon: FileText, label: "Pages" },
            { k: "sections", icon: LayersIcon, label: "Sections" },
            { k: "add", icon: Plus, label: "Add section" },
            { k: "navigation", icon: Menu, label: "Navigation" },
            { k: "theme", icon: Palette, label: "Theme" },
            { k: "site", icon: SettingsIcon, label: "Site & Footer" },
          ] as { k: Panel; icon: any; label: string }[]).map((it) => (
            <button key={it.k} onClick={() => setPanel(it.k)} title={it.label}
              className={cn("h-10 w-10 rounded-xl grid place-items-center transition",
                panel === it.k ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              )}>
              <it.icon className="h-4 w-4" />
            </button>
          ))}
        </nav>

        <aside className="border-r border-white/[0.06] bg-background/40 backdrop-blur-2xl overflow-y-auto">
          <div className="p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{panel}</div>
            {panel === "pages" && <PagesPanel />}
            {panel === "sections" && <SectionsPanel selectedId={selectedSectionId} setSelectedId={setSelectedSectionId} />}
            {panel === "add" && <AddSectionPanel />}
            {panel === "navigation" && <NavigationPanel />}
            {panel === "theme" && <ThemePanel />}
            {panel === "site" && <SitePanel />}
          </div>
        </aside>

        <main className="relative overflow-auto bg-[radial-gradient(ellipse_at_top,rgba(120,90,255,0.15),transparent_60%)]">
          <div className="min-h-full flex justify-center p-4 md:p-8">
            <motion.div
              key={device + (site.currentPageId ?? "")}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              style={{ width: frameW, maxWidth: "100%" }}
              className="rounded-3xl overflow-hidden border border-white/10 shadow-elegant"
            >
              <SiteRender
                selectedSectionId={selectedSectionId}
                onSelectSection={(id) => { setSelectedSectionId(id); setPanel("sections"); }}
                onNavigatePage={(pid) => { site.setCurrentPage(pid); setSelectedSectionId(null); }}
              />
            </motion.div>
          </div>
        </main>

        <aside className="hidden md:block border-l border-white/[0.06] bg-background/40 backdrop-blur-2xl overflow-y-auto">
          {site.currentPageId && <SectionInspector pageId={site.currentPageId} sectionId={selectedSectionId} />}
        </aside>
      </div>

      <PublishFlow open={publishOpen} onClose={() => setPublishOpen(false)} />
    </div>
  );
}

function PublishStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    publishing:  "bg-blue-500/15 text-blue-300 border-blue-500/30",
    draft:       "bg-amber-500/15 text-amber-300 border-amber-500/30",
    unpublished: "bg-white/5 text-muted-foreground border-white/10",
  };
  return (
    <span className={cn("hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[10px] font-medium uppercase tracking-wider",
      map[status] ?? map.unpublished)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
    </span>
  );
}


/* ================= PANELS ================= */

function PagesPanel() {
  const site = useSiteStore();
  return (
    <div className="mt-3 space-y-1.5">
      {site.pages.map((p, i) => (
        <div key={p.id}
          className={cn("group rounded-lg border transition",
            site.currentPageId === p.id ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
          )}>
          <div className="flex items-center gap-1.5 px-2 h-9">
            <button onClick={() => site.setCurrentPage(p.id)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
              {p.slug === "home" ? <Home className="h-3.5 w-3.5 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
              <input value={p.label}
                onChange={(e) => site.updatePage(p.id, { label: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent flex-1 outline-none text-xs min-w-0"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">/{p.slug}</span>
            </button>
            <button title="Move up" disabled={i === 0} onClick={() => site.reorderPage(i, i - 1)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 grid place-items-center rounded hover:bg-white/10 disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
            <button title="Move down" disabled={i === site.pages.length - 1} onClick={() => site.reorderPage(i, i + 1)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 grid place-items-center rounded hover:bg-white/10 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
            <button title="Duplicate" onClick={() => site.duplicatePage(p.id)}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 grid place-items-center rounded hover:bg-white/10"><Copy className="h-3 w-3" /></button>
            {p.slug !== "home" && (
              <button title="Delete" onClick={() => { if (confirm(`Delete page "${p.label}"?`)) site.removePage(p.id); }}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 grid place-items-center rounded hover:bg-white/10">
                <Trash2 className="h-3 w-3 text-red-400" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={() => { const label = prompt("Page name?"); if (label) site.addPage({ label }); }}
        className="mt-2 w-full flex items-center gap-2 h-9 px-2.5 rounded-lg glass border border-dashed border-white/15 hover:border-white/25 text-xs text-muted-foreground">
        <Plus className="h-3.5 w-3.5" /> Add page
      </button>
      <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        Select a page then edit its SEO in the inspector on the right.
      </p>
    </div>
  );
}

function SectionsPanel({ selectedId, setSelectedId }: { selectedId: string | null; setSelectedId: (id: string | null) => void }) {
  const site = useSiteStore();
  const page = site.pages.find((p) => p.id === site.currentPageId);
  if (!page) return null;
  return (
    <div className="mt-3 space-y-1">
      <div className="text-xs text-muted-foreground mb-2">Editing: <span className="text-foreground">{page.label}</span></div>
      {page.sections.map((sec, i) => (
        <div key={sec.id}
          onClick={() => setSelectedId(sec.id)}
          className={cn("group rounded-lg border p-2 flex items-center gap-2 cursor-pointer transition",
            selectedId === sec.id ? "border-primary/40 bg-primary/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
          )}>
          <GripVertical className="h-3 w-3 text-muted-foreground/60" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{prettyType(sec.type)}</div>
            <div className="text-[10px] text-muted-foreground truncate">{sec.type}</div>
          </div>
          <button title={sec.visible ? "Hide" : "Show"} onClick={(e) => { e.stopPropagation(); site.toggleSection(page.id, sec.id); }}
            className="h-6 w-6 grid place-items-center rounded hover:bg-white/10">
            {sec.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
          </button>
          <button title="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); site.reorderSection(page.id, i, i - 1); }}
            className="h-6 w-6 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
          <button title="Move down" disabled={i === page.sections.length - 1} onClick={(e) => { e.stopPropagation(); site.reorderSection(page.id, i, i + 1); }}
            className="h-6 w-6 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
          <button title="Duplicate" onClick={(e) => { e.stopPropagation(); site.duplicateSection(page.id, sec.id); }}
            className="h-6 w-6 grid place-items-center rounded hover:bg-white/10"><Copy className="h-3 w-3" /></button>
          <button title="Delete" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this section?")) { site.removeSection(page.id, sec.id); if (selectedId === sec.id) setSelectedId(null); } }}
            className="h-6 w-6 grid place-items-center rounded hover:bg-white/10"><Trash2 className="h-3 w-3 text-red-400" /></button>
        </div>
      ))}
      {page.sections.length === 0 && (
        <div className="text-xs text-muted-foreground py-6 text-center">No sections yet. Use the + panel to add one.</div>
      )}
    </div>
  );
}

function AddSectionPanel() {
  const site = useSiteStore();
  const pageId = site.currentPageId;
  const grouped = SECTION_LIBRARY.reduce<Record<string, typeof SECTION_LIBRARY>>((acc, s) => {
    (acc[s.group] ||= []).push(s); return acc;
  }, {});
  return (
    <div className="mt-3 space-y-4">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{group}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {items.map((it) => (
              <button key={it.type}
                onClick={() => pageId && site.addSection(pageId, it.type as SectionType)}
                className="rounded-lg glass border border-white/10 hover:border-white/25 hover:shadow-glow p-3 text-left text-[11px] leading-tight transition">
                {it.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NavigationPanel() {
  const site = useSiteStore();
  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs text-muted-foreground">Reorder, rename, link to pages, and add dropdown children.</div>
      {site.nav.map((n, i) => (
        <div key={n.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-2 space-y-2">
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-3 w-3 text-muted-foreground/60" />
            <input value={n.label} onChange={(e) => site.updateNavItem(n.id, { label: e.target.value })}
              className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-xs outline-none" />
            <button title={n.visible ? "Hide" : "Show"} onClick={() => site.toggleNavItem(n.id)}
              className="h-7 w-7 grid place-items-center rounded hover:bg-white/10">
              {n.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
            </button>
            <button title="Delete" onClick={() => site.removeNavItem(n.id)}
              className="h-7 w-7 grid place-items-center rounded hover:bg-white/10"><Trash2 className="h-3 w-3 text-red-400" /></button>
          </div>
          <div className="flex items-center gap-1.5">
            <select value={n.pageId ?? ""}
              onChange={(e) => site.updateNavItem(n.id, { pageId: e.target.value || null, url: e.target.value ? undefined : n.url })}
              className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-xs outline-none">
              <option value="">— External URL —</option>
              {site.pages.map((p) => <option key={p.id} value={p.id}>{p.label} (/{p.slug})</option>)}
            </select>
            {!n.pageId && (
              <input placeholder="https://…" value={n.url ?? ""} onChange={(e) => site.updateNavItem(n.id, { url: e.target.value })}
                className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-xs outline-none" />
            )}
            <button disabled={i === 0} onClick={() => site.reorderNav(i, i - 1)}
              className="h-7 w-7 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
            <button disabled={i === site.nav.length - 1} onClick={() => site.reorderNav(i, i + 1)}
              className="h-7 w-7 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
          </div>

          {/* Children */}
          {(n.children ?? []).length > 0 && (
            <div className="pl-3 border-l border-white/10 space-y-1.5">
              {(n.children ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <input value={c.label} onChange={(e) => site.updateNavChild(n.id, c.id, { label: e.target.value })}
                    className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-[11px] outline-none" />
                  <select value={c.pageId ?? ""}
                    onChange={(e) => site.updateNavChild(n.id, c.id, { pageId: e.target.value || null })}
                    className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-[11px] outline-none">
                    <option value="">— URL —</option>
                    {site.pages.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  {!c.pageId && (
                    <input placeholder="https://…" value={c.url ?? ""} onChange={(e) => site.updateNavChild(n.id, c.id, { url: e.target.value })}
                      className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-[11px] outline-none" />
                  )}
                  <button onClick={() => site.removeNavChild(n.id, c.id)} className="h-7 w-7 grid place-items-center rounded hover:bg-white/10">
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => site.addNavChild(n.id, { label: "Dropdown link" })}
            className="w-full h-7 rounded glass border border-dashed border-white/10 text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1">
            <Plus className="h-3 w-3" /> Add dropdown item
          </button>
        </div>
      ))}
      <button onClick={() => site.addNavItem({ label: "New link" })}
        className="w-full flex items-center gap-2 h-9 px-2.5 rounded-lg glass border border-dashed border-white/15 hover:border-white/25 text-xs text-muted-foreground">
        <Plus className="h-3.5 w-3.5" /> Add nav item
      </button>
    </div>
  );
}

function ThemePanel() {
  const site = useSiteStore();
  return (
    <div className="mt-3 space-y-5">
      <PanelGroup title="Mode">
        <div className="grid grid-cols-2 gap-1.5">
          {(["dark", "light"] as const).map((m) => (
            <button key={m} onClick={() => site.setTheme({ mode: m })}
              className={cn("h-8 rounded-md text-[11px] capitalize border transition",
                site.mode === m ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "glass border-white/10 text-muted-foreground")}>{m}</button>
          ))}
        </div>
      </PanelGroup>
      <PanelGroup title="Theme color">
        <div className="grid grid-cols-6 gap-1.5">
          {THEME_COLORS.map((c) => (
            <button key={c.id} title={c.name}
              onClick={() => site.setTheme({ themeColorId: c.id, accent: c.accent })}
              className={cn("h-7 w-7 rounded-md border transition hover:scale-110",
                site.themeColorId === c.id ? "border-white ring-2 ring-primary/60" : "border-white/10")}
              style={{ background: c.accent }} />
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          Custom
          <input type="color" value={site.accent}
            onChange={(e) => site.setTheme({ accent: e.target.value, themeColorId: "custom" })}
            className="h-7 w-10 rounded bg-transparent border border-white/10" />
        </label>
      </PanelGroup>
      <PanelGroup title="Typography">
        <Row label="Display">
          <select value={site.fontDisplay} onChange={(e) => site.setTheme({ fontDisplay: e.target.value })}
            className="w-full h-8 px-2 rounded-md bg-white/[0.04] border border-white/10 text-xs outline-none">
            {["Inter","Space Grotesk","Fraunces","Playfair Display","DM Serif Display","Manrope","IBM Plex Sans"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Row>
        <Row label="Body">
          <select value={site.fontBody} onChange={(e) => site.setTheme({ fontBody: e.target.value })}
            className="w-full h-8 px-2 rounded-md bg-white/[0.04] border border-white/10 text-xs outline-none">
            {["Inter","Space Grotesk","IBM Plex Sans","Manrope"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Row>
      </PanelGroup>
      <PanelGroup title="Layout">
        <Row label="Radius">
          <input type="range" min={0} max={28} value={site.radius}
            onChange={(e) => site.setTheme({ radius: Number(e.target.value) })}
            className="w-full accent-[oklch(0.68_0.24_295)]" />
        </Row>
      </PanelGroup>
      <button onClick={() => { if (confirm("Reset to template defaults?")) { const id = site.templateId; site.reset(); if (id) site.applyTemplate(id); } }}
        className="w-full h-9 rounded-xl glass border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 transition">
        Reset to template defaults
      </button>
    </div>
  );
}

function SitePanel() {
  const site = useSiteStore();
  const f = site.footer;
  return (
    <div className="mt-3 space-y-5">
      <PanelGroup title="Brand">
        <div><L>Store name</L><TextInput value={site.storeName} onChange={(v) => site.setStoreInfo({ storeName: v })} /></div>
        <div><L>Slug (URL)</L><TextInput value={site.storeSlug} onChange={(v) => site.setStoreInfo({ storeSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
        <div><L>Logo</L><ImagePicker value={site.logoUrl ?? ""} onChange={(v) => site.setStoreInfo({ logoUrl: v || null })} /></div>
      </PanelGroup>
      <PanelGroup title="Footer">
        <div><L>Tagline</L><TextArea value={f.tagline ?? ""} onChange={(v) => site.setFooter({ tagline: v })} rows={2} /></div>
        <div><L>Copyright</L><TextInput value={f.copyright ?? ""} onChange={(v) => site.setFooter({ copyright: v })} /></div>
        <div><L>Email</L><TextInput value={f.email ?? ""} onChange={(v) => site.setFooter({ email: v })} /></div>
        <div><L>Phone</L><TextInput value={f.phone ?? ""} onChange={(v) => site.setFooter({ phone: v })} /></div>
        <div><L>Address</L><TextArea value={f.address ?? ""} onChange={(v) => site.setFooter({ address: v })} rows={2} /></div>
        <div className="space-y-1.5">
          <L>Socials</L>
          {(f.socials ?? []).map((sc, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input value={sc.label} onChange={(e) => { const next = [...(f.socials ?? [])]; next[i] = { ...sc, label: e.target.value }; site.setFooter({ socials: next }); }}
                className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-[11px] outline-none" placeholder="Label" />
              <input value={sc.url} onChange={(e) => { const next = [...(f.socials ?? [])]; next[i] = { ...sc, url: e.target.value }; site.setFooter({ socials: next }); }}
                className="flex-1 h-7 px-2 rounded bg-white/5 border border-white/10 text-[11px] outline-none" placeholder="https://…" />
              <button onClick={() => { const next = (f.socials ?? []).filter((_, j) => j !== i); site.setFooter({ socials: next }); }}
                className="h-7 w-7 grid place-items-center rounded hover:bg-white/10"><Trash2 className="h-3 w-3 text-red-400" /></button>
            </div>
          ))}
          <button onClick={() => site.setFooter({ socials: [...(f.socials ?? []), { label: "New", url: "#" }] })}
            className="w-full h-7 rounded glass border border-dashed border-white/10 text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1">
            <Plus className="h-3 w-3" /> Add social
          </button>
        </div>
      </PanelGroup>
    </div>
  );
}

/* ================= SMALL PARTS ================= */

function prettyType(t: string) {
  return t.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function PanelGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="rounded-xl glass border border-white/10 p-3 space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function L({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-muted-foreground mb-1">{children}</div>;
}

function DeviceSwitch({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  const items: { v: Device; icon: any; label: string }[] = [
    { v: "desktop", icon: Monitor, label: "Desktop" },
    { v: "tablet", icon: Tablet, label: "Tablet" },
    { v: "mobile", icon: Smartphone, label: "Mobile" },
  ];
  return (
    <div className="inline-flex h-9 rounded-xl glass border border-white/10 p-0.5">
      {items.map((it) => (
        <button key={it.v} onClick={() => onChange(it.v)} aria-label={it.label}
          className={cn("relative h-8 w-9 rounded-lg grid place-items-center transition",
            value === it.v ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
          )}>
          <it.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function IconAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button aria-label={label}
      className="h-9 w-9 rounded-lg glass border border-white/10 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition">
      <Icon className="h-4 w-4" />
    </button>
  );
}
