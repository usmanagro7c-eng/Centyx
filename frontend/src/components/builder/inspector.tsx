import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, ImageUp, Images, Plus, Trash2, Upload, X } from "lucide-react";
import { useSiteStore } from "@/lib/site-store";
import { getSchema, mergeDefaults, type Field } from "@/lib/section-schemas";
import { cn } from "@/lib/utils";
import { openImagePicker, uploadFilesToLibrary } from "@/components/media/media-picker";

/* ================================================================
   PRIMITIVES
================================================================ */

function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
        <span>{title}</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="rounded-xl glass border border-white/10 p-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-muted-foreground mb-1">{children}</div>;
}

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-8 px-2 rounded-md bg-white/[0.04] border border-white/10 text-xs outline-none focus:border-primary/50" />
  );
}

export function TextArea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/10 text-xs outline-none focus:border-primary/50 resize-none" />
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
      {label && <span className="text-muted-foreground">{label}</span>}
      <button type="button" onClick={() => onChange(!value)}
        className={cn("relative h-5 w-9 rounded-full transition", value ? "bg-primary" : "bg-white/10")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition", value ? "left-4" : "left-0.5")} />
      </button>
    </label>
  );
}

/* ---------- Image picker: upload → data URL or paste URL ---------- */

export function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added = await uploadFilesToLibrary(files);
      if (added[0]?.url) onChange(added[0].url);
    } finally { setBusy(false); }
  };

  const browse = async () => {
    const chosen = await openImagePicker();
    if (chosen) onChange(chosen.url);
  };

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-white/[0.03] grid place-items-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <button type="button" onClick={() => onChange("")}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-black/60 backdrop-blur grid place-items-center hover:bg-black/80">
              <X className="h-3 w-3 text-white" />
            </button>
          </>
        ) : (
          <button type="button" onClick={browse}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ImageUp className="h-5 w-5" />
            <span>{busy ? "Uploading…" : "Choose from library or drop image"}</span>
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={browse}
          className="flex-1 h-7 px-2 rounded-md glass border border-white/10 text-[11px] hover:bg-white/10 inline-flex items-center justify-center gap-1">
          <Images className="h-3 w-3" /> Library
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="h-7 px-2 rounded-md glass border border-white/10 text-[11px] hover:bg-white/10 inline-flex items-center gap-1">
          <Upload className="h-3 w-3" /> Upload
        </button>
      </div>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="or paste https://…"
        className="w-full h-7 px-2 rounded-md bg-white/[0.04] border border-white/10 text-[11px] outline-none" />
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { onFiles(e.target.files); e.currentTarget.value = ""; }} />
    </div>
  );
}

/* ---------- Button editor ---------- */

export function ButtonEditor({ value, onChange }: { value: { label?: string; url?: string; newTab?: boolean } | undefined; onChange: (v: { label: string; url: string; newTab: boolean }) => void }) {
  const v = { label: "", url: "", newTab: false, ...(value ?? {}) };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2 space-y-1.5">
      <div><Label>Label</Label><TextInput value={v.label} onChange={(x) => onChange({ ...v, label: x })} placeholder="Empty to hide" /></div>
      <div><Label>URL / #anchor</Label><TextInput value={v.url} onChange={(x) => onChange({ ...v, url: x })} placeholder="#" /></div>
      <Toggle value={!!v.newTab} onChange={(x) => onChange({ ...v, newTab: x })} label="Open in new tab" />
    </div>
  );
}

/* ---------- List editor ---------- */

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const n = arr.slice(); const [x] = n.splice(from, 1); n.splice(to, 0, x); return n;
}

export function ListEditor({ field, value, onChange }: { field: Field; value: any[]; onChange: (v: any[]) => void }) {
  const items = Array.isArray(value) ? value : [];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [hidden, setHidden] = useState<Record<number, boolean>>({});
  const labelOf = (it: any, i: number) => {
    const k = field.itemLabelKey ?? "title";
    const v = it?.[k];
    return v ? String(v).slice(0, 40) : `Item ${i + 1}`;
  };

  return (
    <div className="space-y-1.5">
      {items.map((it, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className={cn("rounded-lg border transition", isOpen ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/[0.02]")}>
            <div className="flex items-center gap-1 px-2 h-8">
              <GripVertical className="h-3 w-3 text-muted-foreground/60" />
              <button type="button" onClick={() => setOpenIdx(isOpen ? null : i)} className="flex-1 text-left text-[11px] font-medium truncate">
                {labelOf(it, i)}
              </button>
              <button type="button" title={hidden[i] ? "Show" : "Hide"} onClick={() => setHidden((h) => ({ ...h, [i]: !h[i] }))}
                className="h-6 w-6 grid place-items-center rounded hover:bg-white/10">
                {hidden[i] ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3" />}
              </button>
              <button type="button" title="Move up" onClick={() => onChange(moveItem(items, i, i - 1))} disabled={i === 0}
                className="h-6 w-6 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
              <button type="button" title="Move down" onClick={() => onChange(moveItem(items, i, i + 1))} disabled={i === items.length - 1}
                className="h-6 w-6 grid place-items-center rounded hover:bg-white/10 disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
              <button type="button" title="Duplicate"
                onClick={() => { const n = items.slice(); n.splice(i + 1, 0, JSON.parse(JSON.stringify(it))); onChange(n); }}
                className="h-6 w-6 grid place-items-center rounded hover:bg-white/10"><Copy className="h-3 w-3" /></button>
              <button type="button" title="Delete"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="h-6 w-6 grid place-items-center rounded hover:bg-white/10"><Trash2 className="h-3 w-3 text-red-400" /></button>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-2.5 pb-2.5 space-y-2 border-t border-white/[0.06] pt-2">
                    {(field.itemFields ?? []).map((f) => (
                      <FieldControl key={f.key} field={f} value={it?.[f.key]}
                        onChange={(v) => { const n = items.slice(); n[i] = { ...(n[i] ?? {}), [f.key]: v }; onChange(n); }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <button type="button"
        onClick={() => { const n = items.slice(); n.push(field.itemDefault?.() ?? {}); setOpenIdx(n.length - 1); onChange(n); }}
        className="w-full h-8 rounded-lg glass border border-dashed border-white/15 hover:border-white/25 text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1.5">
        <Plus className="h-3 w-3" /> Add item
      </button>
    </div>
  );
}

/* ================================================================
   FIELD CONTROL (schema-driven)
================================================================ */

export function FieldControl({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  const { kind, label } = field;
  if (kind === "list") {
    return <div><Label>{label}</Label><ListEditor field={field} value={value ?? []} onChange={onChange} /></div>;
  }
  if (kind === "image") {
    return <div><Label>{label}</Label><ImagePicker value={value ?? ""} onChange={onChange} /></div>;
  }
  if (kind === "button") {
    return <div><Label>{label}</Label><ButtonEditor value={value} onChange={onChange} /></div>;
  }
  if (kind === "textarea") {
    return <div><Label>{label}</Label><TextArea value={value ?? ""} onChange={onChange} rows={field.rows ?? 3} placeholder={field.placeholder} /></div>;
  }
  if (kind === "toggle") {
    return <Toggle value={!!value} onChange={onChange} label={label} />;
  }
  if (kind === "color") {
    return (
      <div>
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-7 w-10 rounded border border-white/10 bg-transparent" />
          <TextInput value={value ?? ""} onChange={onChange} />
        </div>
      </div>
    );
  }
  if (kind === "select") {
    return (
      <div>
        <Label>{label}</Label>
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 px-2 rounded-md bg-white/[0.04] border border-white/10 text-xs outline-none">
          {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return <div><Label>{label}</Label><TextInput value={value ?? ""} onChange={onChange} placeholder={field.placeholder} /></div>;
}

/* ================================================================
   THE INSPECTOR
================================================================ */

export function SectionInspector({ pageId, sectionId }: { pageId: string; sectionId: string | null }) {
  const site = useSiteStore();
  const page = site.pages.find((p) => p.id === pageId);
  const sec = sectionId ? page?.sections.find((s) => s.id === sectionId) : null;

  if (!sec || !page) {
    return (
      <div className="p-4 text-xs text-muted-foreground space-y-3">
        <div>Click a section in the canvas to edit its content.</div>
        <PageSeoInspector pageId={pageId} />
      </div>
    );
  }

  const schema = getSchema(sec.type);
  const merged = mergeDefaults(sec.type, sec.props);

  const update = (key: string, v: any) => {
    site.updateSection(page.id, sec.id, { props: { ...(sec.props ?? {}), [key]: v } });
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Selected</div>
        <div className="mt-1 text-sm font-semibold">{prettyType(sec.type)}</div>
        <div className="text-[10px] text-muted-foreground">{sec.type}</div>
      </div>

      {schema.fields.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">This section has no editable properties.</div>
      ) : (
        <Group title="Content">
          {schema.fields.map((f) => (
            <FieldControl key={f.key} field={f} value={merged[f.key]} onChange={(v) => update(f.key, v)} />
          ))}
        </Group>
      )}

      <Group title="Visibility & actions" defaultOpen={false}>
        <button type="button" onClick={() => site.toggleSection(page.id, sec.id)}
          className="w-full h-9 rounded-lg glass border border-white/10 text-xs flex items-center justify-center gap-2 hover:bg-white/10">
          {sec.visible ? <><EyeOff className="h-3.5 w-3.5" /> Hide section</> : <><Eye className="h-3.5 w-3.5" /> Show section</>}
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => site.duplicateSection(page.id, sec.id)}
            className="h-9 rounded-lg glass border border-white/10 text-xs hover:bg-white/10 inline-flex items-center justify-center gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button type="button" onClick={() => { if (confirm("Delete section?")) site.removeSection(page.id, sec.id); }}
            className="h-9 rounded-lg glass border border-white/10 text-xs hover:bg-red-500/10 hover:text-red-300 inline-flex items-center justify-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </Group>

      <PageSeoInspector pageId={pageId} />
    </div>
  );
}

/* ---------- Page SEO ---------- */

export function PageSeoInspector({ pageId }: { pageId: string }) {
  const site = useSiteStore();
  const page = site.pages.find((p) => p.id === pageId);
  if (!page) return null;
  const seo = page.seo ?? {};
  const set = (patch: Partial<typeof seo>) => site.updatePageSeo(page.id, patch);
  return (
    <Group title={`SEO · /${page.slug}`} defaultOpen={false}>
      <div><Label>SEO title</Label><TextInput value={seo.title ?? ""} onChange={(v) => set({ title: v })} placeholder={page.label} /></div>
      <div><Label>Meta description</Label><TextArea value={seo.description ?? ""} onChange={(v) => set({ description: v })} rows={2} /></div>
      <div><Label>Keywords</Label><TextInput value={seo.keywords ?? ""} onChange={(v) => set({ keywords: v })} placeholder="keyword, keyword" /></div>
      <div><Label>Canonical URL</Label><TextInput value={seo.canonical ?? ""} onChange={(v) => set({ canonical: v })} /></div>
      <div><Label>Open Graph image</Label><ImagePicker value={seo.ogImage ?? ""} onChange={(v) => set({ ogImage: v })} /></div>
      <Toggle value={!!seo.noindex} onChange={(v) => set({ noindex: v })} label="Hide from search engines" />
    </Group>
  );
}

function prettyType(t: string) {
  return t.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
}
