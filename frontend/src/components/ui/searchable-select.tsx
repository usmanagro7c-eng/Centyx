import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SSOption = {
  value: string;
  label: string;
  hint?: string;   // secondary text (e.g. code)
  prefix?: ReactNode; // e.g. flag emoji
  keywords?: string; // extra searchable text
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: SSOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  clearable?: boolean;
  className?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  value, onChange, options, placeholder = "Select…",
  searchPlaceholder = "Search…", clearable, className, disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.trim().toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(s) ||
      o.value.toLowerCase().includes(s) ||
      (o.hint?.toLowerCase().includes(s) ?? false) ||
      (o.keywords?.toLowerCase().includes(s) ?? false)
    );
  }, [q, options]);

  useEffect(() => { setActive(0); }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) { onChange(opt.value); setOpen(false); setQ(""); }
    } else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full h-10 pl-3 pr-9 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none text-left",
          "hover:border-white/20 focus:border-primary/40 focus:bg-white/[0.05] focus:shadow-glow transition-all duration-300",
          "flex items-center gap-2 disabled:opacity-60"
        )}
      >
        {selected ? (
          <>
            {selected.prefix && <span className="shrink-0">{selected.prefix}</span>}
            <span className="truncate">{selected.label}</span>
            {selected.hint && <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{selected.hint}</span>}
          </>
        ) : (
          <span className="text-muted-foreground/70">{placeholder}</span>
        )}
        <ChevronDown className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-1.5 w-full rounded-xl glass-strong border border-white/10 shadow-elegant p-1.5"
          >
            <div className="relative mb-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-8 pr-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm outline-none focus:border-primary/40"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div ref={listRef} className="max-h-64 overflow-auto scroll-elegant">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>
              )}
              {filtered.map((o, i) => {
                const isSel = o.value === value;
                const isActive = i === active;
                return (
                  <button
                    key={o.value}
                    data-idx={i}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors",
                      isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                      isSel && "text-foreground"
                    )}
                  >
                    {o.prefix && <span className="shrink-0">{o.prefix}</span>}
                    <span className="truncate">{o.label}</span>
                    {o.hint && <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{o.hint}</span>}
                    {isSel && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {clearable && value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="mt-1 w-full text-xs text-muted-foreground hover:text-foreground py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                Clear selection
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
