import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type Align = "start" | "end" | "center";
type Side = "bottom" | "top" | "auto";

export function FloatingLayer({
  open,
  onClose,
  anchorRef,
  align = "end",
  side = "auto",
  offset = 6,
  className,
  children,
  matchAnchorWidth = false,
  minWidth,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: Align;
  side?: Side;
  offset?: number;
  className?: string;
  children: ReactNode;
  matchAnchorWidth?: boolean;
  minWidth?: number;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width?: number } | null>(null);

  const compute = () => {
    const anchor = anchorRef.current;
    const el = contentRef.current;
    if (!anchor || !el) return;
    const a = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;
    // Measure natural size
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    const width = matchAnchorWidth ? a.width : cw;

    // Vertical
    let top: number;
    const spaceBelow = vh - a.bottom - pad;
    const spaceAbove = a.top - pad;
    const wantsTop = side === "top" || (side === "auto" && ch > spaceBelow && spaceAbove > spaceBelow);
    if (wantsTop) top = a.top - ch - offset;
    else top = a.bottom + offset;
    top = Math.max(pad, Math.min(top, vh - ch - pad));

    // Horizontal
    let left: number;
    if (align === "end") left = a.right - width;
    else if (align === "center") left = a.left + a.width / 2 - width / 2;
    else left = a.left;
    left = Math.max(pad, Math.min(left, vw - width - pad));

    setPos({ top, left, width: matchAnchorWidth ? width : undefined });
  };

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    // Two-pass: mount hidden, then measure
    const raf = requestAnimationFrame(() => compute());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => compute();
    const onResize = () => compute();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            width: pos?.width,
            minWidth,
            zIndex: 9999,
            visibility: pos ? "visible" : "hidden",
          }}
          className={cn(
            "rounded-xl glass-strong border border-white/10 shadow-elegant backdrop-blur-xl",
            className,
          )}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
