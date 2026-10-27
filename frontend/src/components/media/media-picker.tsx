import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { X, Search, Upload, Check, Image as ImageIcon, Film, FileText, Music, Loader2, Folder as FolderIcon, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreData, type MediaAsset } from "@/lib/store-data-store";

/* ------------ helpers ------------ */

export const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "avif", "svg", "gif"];
export const VIDEO_EXT = ["mp4", "webm", "mov", "m4v"];
export const DOC_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];
export const AUDIO_EXT = ["mp3", "wav", "ogg", "aac", "m4a"];

export function extOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}
export function kindOfFile(file: File): MediaAsset["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  const e = extOf(file.name);
  if (IMAGE_EXT.includes(e)) return "image";
  if (VIDEO_EXT.includes(e)) return "video";
  if (AUDIO_EXT.includes(e)) return "audio";
  return "doc";
}
export function fmtBytes(b: number) {
  if (!b && b !== 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
const readAsDataURL = (file: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onerror = rej;
  r.onload = () => res(String(r.result || ""));
  r.readAsDataURL(file);
});
const probeImage = (url: string) => new Promise<{ width: number; height: number }>((res) => {
  const img = new Image();
  img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
  img.onerror = () => res({ width: 0, height: 0 });
  img.src = url;
});

/* ------------ upload queue with progress ------------ */

export type UploadTask = {
  id: string;
  name: string;
  size: number;
  progress: number;   // 0..100
  status: "queued" | "uploading" | "done" | "error" | "cancelled";
  error?: string;
  assetId?: string;
};

type QueueState = {
  tasks: UploadTask[];
  pushTasks: (t: UploadTask[]) => void;
  updateTask: (id: string, patch: Partial<UploadTask>) => void;
  clearDone: () => void;
  removeTask: (id: string) => void;
};
export const useUploadQueue = create<QueueState>((set) => ({
  tasks: [],
  pushTasks: (t) => set((s) => ({ tasks: [...t, ...s.tasks] })),
  updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((x) => x.id === id ? { ...x, ...patch } : x) })),
  clearDone: () => set((s) => ({ tasks: s.tasks.filter((x) => x.status !== "done") })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),
}));

/**
 * Read files → data URLs → register into store. Emits progress into the upload queue.
 * Returns the created MediaAssets in the same order (skipping cancelled/errored).
 */
export async function uploadFilesToLibrary(
  files: FileList | File[] | null,
  opts?: { folderId?: string | null; onProgress?: (t: UploadTask) => void }
): Promise<MediaAsset[]> {
  if (!files) return [];
  const arr = Array.from(files as any as File[]);
  if (!arr.length) return [];
  const q = useUploadQueue.getState();
  const tasks: UploadTask[] = arr.map((f) => ({
    id: `up_${Math.random().toString(36).slice(2, 9)}`,
    name: f.name, size: f.size, progress: 0, status: "queued",
  }));
  q.pushTasks(tasks);
  const out: MediaAsset[] = [];
  for (let i = 0; i < arr.length; i++) {
    const file = arr[i], task = tasks[i];
    // check cancellation between files
    const cur = useUploadQueue.getState().tasks.find((t) => t.id === task.id);
    if (!cur || cur.status === "cancelled") continue;
    try {
      useUploadQueue.getState().updateTask(task.id, { status: "uploading", progress: 15 });
      const url = await readAsDataURL(file);
      useUploadQueue.getState().updateTask(task.id, { progress: 70 });
      const kind = kindOfFile(file);
      const meta: Partial<MediaAsset> = { name: file.name, url, kind, size: file.size, mimeType: file.type, folderId: opts?.folderId ?? null };
      if (kind === "image") {
        const { width, height } = await probeImage(url);
        meta.width = width; meta.height = height;
      }
      const asset = useStoreData.getState().registerUpload({ url, ...meta } as any);
      useUploadQueue.getState().updateTask(task.id, { status: "done", progress: 100, assetId: asset.id });
      opts?.onProgress?.(useUploadQueue.getState().tasks.find((t) => t.id === task.id)!);
      out.push(asset);
    } catch (e: any) {
      useUploadQueue.getState().updateTask(task.id, { status: "error", error: e?.message ?? "Upload failed" });
    }
  }
  // auto-clear finished tasks after a moment
  setTimeout(() => useUploadQueue.getState().clearDone(), 2400);
  return out;
}

export async function retryUpload(taskId: string) {
  const task = useUploadQueue.getState().tasks.find((t) => t.id === taskId);
  if (!task) return;
  useUploadQueue.getState().updateTask(taskId, { status: "queued", progress: 0, error: undefined });
  // caller must re-supply file — this helper only resets state; consumer that keeps the File can retry via uploadFilesToLibrary
}

/* ------------ imperative picker API ------------ */

export type MediaPickerOptions = {
  multiple?: boolean;
  kind?: "image" | "video" | "doc" | "audio" | "any";
  title?: string;
  initialFolderId?: string | null;
};
type PickerState = {
  open: boolean;
  opts: MediaPickerOptions;
  resolver?: (v: MediaAsset[] | null) => void;
};
const usePickerState = create<PickerState>(() => ({ open: false, opts: {} }));

export function openMediaPicker(opts: MediaPickerOptions = {}): Promise<MediaAsset[] | null> {
  return new Promise((resolve) => {
    usePickerState.setState({ open: true, opts, resolver: resolve });
  });
}
export function openImagePicker(): Promise<MediaAsset | null> {
  return openMediaPicker({ multiple: false, kind: "image", title: "Choose an image" }).then((r) => r?.[0] ?? null);
}

/* ------------ Dialog UI ------------ */

function KindIcon({ kind, className }: { kind: MediaAsset["kind"]; className?: string }) {
  const cls = cn("h-4 w-4", className);
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "video") return <Film className={cls} />;
  if (kind === "audio") return <Music className={cls} />;
  return <FileText className={cls} />;
}

export function MediaThumb({ asset, className }: { asset: MediaAsset; className?: string }) {
  if (asset.kind === "image") {
    return <img loading="lazy" decoding="async" src={asset.url} alt={asset.alt || asset.name} className={cn("h-full w-full object-cover", className)} />;
  }
  if (asset.kind === "video") {
    return (
      <div className={cn("h-full w-full grid place-items-center bg-black/40 text-white/70", className)}>
        <Film className="h-6 w-6" />
      </div>
    );
  }
  if (asset.kind === "audio") {
    return (
      <div className={cn("h-full w-full grid place-items-center bg-white/[0.03] text-muted-foreground", className)}>
        <Music className="h-6 w-6" />
      </div>
    );
  }
  return (
    <div className={cn("h-full w-full grid place-items-center bg-white/[0.03] text-muted-foreground", className)}>
      <FileText className="h-6 w-6" />
    </div>
  );
}

export function MediaPickerHost() {
  const { open, opts, resolver } = usePickerState();
  const media = useStoreData((s) => s.media);
  const folders = useStoreData((s) => s.mediaFolders ?? []);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setQ("");
      setFolderId(opts.initialFolderId ?? null);
    }
  }, [open, opts.initialFolderId]);

  const items = useMemo(() => {
    const kf = opts.kind && opts.kind !== "any" ? opts.kind : null;
    return media.filter((m) => {
      if (kf && m.kind !== kf) return false;
      if (folderId !== null && m.folderId !== folderId) return false;
      if (q) {
        const hay = `${m.name} ${m.alt ?? ""} ${(m.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [media, opts.kind, q, folderId]);

  const close = (result: MediaAsset[] | null) => {
    resolver?.(result);
    usePickerState.setState({ open: false, opts: {}, resolver: undefined });
  };
  const toggle = (id: string) => {
    if (!opts.multiple) return setSelected([id]);
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };
  const confirm = () => {
    const chosen = media.filter((m) => selected.includes(m.id));
    close(chosen.length ? chosen : null);
  };
  const onUpload = async (files: FileList | null) => {
    const accept = opts.kind && opts.kind !== "any" ? opts.kind : null;
    const filtered = files ? Array.from(files).filter((f) => !accept || kindOfFile(f) === accept) : [];
    if (!filtered.length) return;
    const added = await uploadFilesToLibrary(filtered, { folderId });
    if (added.length) setSelected(opts.multiple ? added.map((a) => a.id) : [added[0].id]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => close(null)} className="fixed inset-0 z-[80] bg-background/70 backdrop-blur-xl" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-5xl h-[80vh] glass-strong border border-white/10 rounded-2xl shadow-glow overflow-hidden flex flex-col">
              {/* header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
                <ImageIcon className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">{opts.title ?? "Media library"}</div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, alt, tag"
                      className="h-8 pl-8 pr-3 rounded-lg bg-white/[0.03] border border-white/10 text-xs outline-none focus:border-primary/40 w-64" />
                  </div>
                  <button onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </button>
                  <input ref={inputRef} type="file" hidden multiple
                    accept={opts.kind === "image" ? "image/*" : opts.kind === "video" ? "video/*" : opts.kind === "audio" ? "audio/*" : undefined}
                    onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
                  <button onClick={() => close(null)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* body */}
              <div className="flex-1 flex overflow-hidden">
                {/* folders */}
                <div className="hidden md:flex w-52 shrink-0 flex-col gap-1 p-3 border-r border-white/[0.06] overflow-y-auto text-xs">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 pb-1">Folders</div>
                  <button onClick={() => setFolderId(null)}
                    className={cn("flex items-center gap-2 h-8 px-2 rounded-md text-left", folderId === null ? "bg-white/10" : "hover:bg-white/5")}>
                    <FolderIcon className="h-3.5 w-3.5" /> All files
                    <span className="ml-auto text-[10px] text-muted-foreground">{media.length}</span>
                  </button>
                  {folders.map((f) => (
                    <button key={f.id} onClick={() => setFolderId(f.id)}
                      className={cn("flex items-center gap-2 h-8 px-2 rounded-md text-left", folderId === f.id ? "bg-white/10" : "hover:bg-white/5")}>
                      <FolderIcon className="h-3.5 w-3.5" />
                      <span className="truncate">{f.name}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{media.filter((m) => m.folderId === f.id).length}</span>
                    </button>
                  ))}
                  <button onClick={() => {
                    const name = prompt("Folder name");
                    if (name?.trim()) useStoreData.getState().addFolder(name.trim());
                  }}
                    className="mt-2 flex items-center gap-2 h-8 px-2 rounded-md border border-dashed border-white/15 text-muted-foreground hover:text-foreground">
                    <FolderPlus className="h-3.5 w-3.5" /> New folder
                  </button>
                </div>

                {/* grid */}
                <div className="flex-1 overflow-y-auto p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}>
                  {items.length === 0 ? (
                    <div className="h-full grid place-items-center text-xs text-muted-foreground">
                      <div className="text-center space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                        <div>No media yet. Drag files here or click Upload.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {items.map((m) => {
                        const isSel = selected.includes(m.id);
                        return (
                          <button key={m.id} type="button" onClick={() => toggle(m.id)} onDoubleClick={() => { setSelected([m.id]); setTimeout(confirm, 0); }}
                            className={cn("group relative aspect-square rounded-xl overflow-hidden border transition text-left",
                              isSel ? "border-primary shadow-glow ring-2 ring-primary/40" : "border-white/10 hover:border-white/20")}>
                            <MediaThumb asset={m} />
                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                              <div className="text-[10px] text-white truncate">{m.name}</div>
                              <div className="text-[9px] text-white/60 flex items-center gap-1">
                                <KindIcon kind={m.kind} className="h-2.5 w-2.5" />
                                {m.width && m.height ? `${m.width}×${m.height} · ` : ""}{fmtBytes(m.size)}
                              </div>
                            </div>
                            {isSel && (
                              <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <UploadQueueBar />
                </div>
              </div>

              {/* footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
                <div className="text-[11px] text-muted-foreground">
                  {selected.length ? `${selected.length} selected` : `${items.length} items`}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => close(null)} className="h-8 px-3 rounded-lg text-xs hover:bg-white/5">Cancel</button>
                  <button disabled={!selected.length} onClick={confirm}
                    className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40">
                    Select {opts.multiple && selected.length > 1 ? `(${selected.length})` : ""}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------- Upload progress dock (also mountable globally) ---------- */

export function UploadQueueBar({ compact = false }: { compact?: boolean }) {
  const tasks = useUploadQueue((s) => s.tasks);
  const active = tasks.filter((t) => t.status !== "done");
  if (!active.length) return null;
  return (
    <div className={cn("mt-4 rounded-xl glass border border-white/10 p-3 space-y-2", compact && "mt-0")}>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Uploading {active.length} file{active.length === 1 ? "" : "s"}</div>
        <button onClick={() => useUploadQueue.getState().clearDone()} className="hover:text-foreground">Clear done</button>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {tasks.slice(0, 8).map((t) => (
          <div key={t.id} className="text-[11px]">
            <div className="flex items-center gap-2">
              <span className="truncate flex-1">{t.name}</span>
              <span className="text-muted-foreground">{fmtBytes(t.size)}</span>
              {t.status === "uploading" && <span className="text-primary">{t.progress}%</span>}
              {t.status === "done" && <Check className="h-3 w-3 text-emerald-400" />}
              {t.status === "error" && <span className="text-rose-400">Failed</span>}
              {t.status === "cancelled" && <span className="text-muted-foreground">Cancelled</span>}
              {(t.status === "uploading" || t.status === "queued") && (
                <button onClick={() => useUploadQueue.getState().updateTask(t.id, { status: "cancelled" })}
                  className="text-muted-foreground hover:text-rose-400">Cancel</button>
              )}
            </div>
            <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className={cn("h-full transition-all", t.status === "error" ? "bg-rose-400" : "bg-primary")}
                style={{ width: `${t.status === "done" ? 100 : t.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
