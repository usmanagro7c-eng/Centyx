import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Minus, Plus, ShoppingBag, Heart, ArrowRight, Bookmark } from "lucide-react";
import { useSiteStore } from "@/lib/site-store";
import { useSiteUI } from "@/lib/site-ui-store";
import { useCartSelectors, useStoreData } from "@/lib/store-data-store";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

export function CartDrawer() {
  const s = useSiteStore();
  const open = useSiteUI((u) => u.cartOpen);
  const close = useSiteUI((u) => u.closeCart);
  const toast = useSiteUI((u) => u.toast);
  const { lines, subtotal, discount, tax, shipping, total, count, coupon, qualifiesFree, freeShippingThreshold } = useCartSelectors();
  const updateCartQty = useStoreData((st) => st.updateCartQty);
  const removeFromCart = useStoreData((st) => st.removeFromCart);
  const saveForLater = useStoreData((st) => st.saveForLater);
  const isLight = s.mode === "light";
  const borderColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const remainingForFree = freeShippingThreshold != null ? Math.max(0, freeShippingThreshold - subtotal + discount) : 0;

  const goToCartPage = () => {
    close();
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    u.searchParams.set("view", "cart");
    u.searchParams.delete("product");
    window.history.pushState({}, "", u.pathname + u.search);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const goToCheckout = () => {
    close();
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    u.searchParams.set("view", "checkout");
    u.searchParams.delete("product");
    window.history.pushState({}, "", u.pathname + u.search);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ fontFamily: s.fontBody }}
        >
          <motion.div
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: isLight ? "rgba(15,15,20,0.4)" : "rgba(0,0,0,0.65)" }}
            onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 h-full w-full sm:w-[440px] flex flex-col shadow-2xl"
            style={{ background: isLight ? "rgba(255,255,255,0.98)" : "rgba(10,10,10,0.98)", borderLeft: `1px solid ${borderColor}`, color: isLight ? "#0a0a0a" : "#fff" }}
          >
            {/* Header */}
            <div className="h-14 px-5 flex items-center justify-between border-b shrink-0" style={{ borderColor }}>
              <div className="flex items-center gap-2 font-semibold" style={{ fontFamily: s.fontDisplay }}>
                <ShoppingBag className="h-4 w-4" style={{ color: s.accent }} />
                <span>Your cart</span>
                <span className="text-xs font-medium opacity-60">({count})</span>
              </div>
              <button aria-label="Close" onClick={close} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            {freeShippingThreshold != null && lines.length > 0 && (
              <div className="px-5 pt-4">
                {qualifiesFree ? (
                  <div className="text-xs px-3 py-2 rounded-lg" style={{ background: `${s.accent}1a`, color: s.accent }}>
                    🎉 You've unlocked free shipping!
                  </div>
                ) : (
                  <>
                    <div className="text-xs opacity-70 mb-1">Spend {fmt(remainingForFree)} more for free shipping</div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)" }}>
                      <motion.div className="h-full" style={{ background: s.accent }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((subtotal - discount) / freeShippingThreshold) * 100)}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {lines.length === 0 ? (
                <div className="h-full grid place-items-center text-center py-16">
                  <div>
                    <ShoppingBag className="h-10 w-10 mx-auto opacity-30" />
                    <div className="mt-4 text-base font-semibold">Your cart is empty</div>
                    <p className="mt-1 text-sm opacity-60">Add products to get started.</p>
                    <button onClick={close} className="mt-5 h-10 px-5 rounded-full text-sm font-semibold text-black"
                      style={{ background: s.accent }}>Continue shopping</button>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {lines.map((l) => (
                    <motion.div
                      key={l.productId}
                      layout
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.22 }}
                      className="flex gap-3"
                    >
                      <div className="h-20 w-20 rounded-lg overflow-hidden shrink-0"
                        style={{ background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }}>
                        {l.product.images?.[0] ? <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{l.product.name}</div>
                        {l.product.sku && <div className="text-[11px] opacity-60">SKU · {l.product.sku}</div>}
                        <div className="text-xs opacity-70 mt-0.5">{fmt(l.product.price)} each</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex items-center rounded-full border h-7" style={{ borderColor }}>
                            <button onClick={() => { const r = updateCartQty(l.productId, l.qty - 1); if (!r.ok && r.message) toast(r.message, "error"); }} className="h-full w-7 grid place-items-center"><Minus className="h-3 w-3" /></button>
                            <div className="w-7 text-center text-xs font-medium">{l.qty}</div>
                            <button onClick={() => { const r = updateCartQty(l.productId, l.qty + 1); if (!r.ok && r.message) toast(r.message, "error"); }} className="h-full w-7 grid place-items-center"><Plus className="h-3 w-3" /></button>
                          </div>
                          <button onClick={() => { saveForLater(l.productId); toast("Saved for later", "info"); }}
                            className="text-[11px] opacity-70 hover:opacity-100 inline-flex items-center gap-1">
                            <Bookmark className="h-3 w-3" /> Save
                          </button>
                          <button onClick={() => removeFromCart(l.productId)} className="text-[11px] opacity-70 hover:opacity-100 inline-flex items-center gap-1">
                            <X className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">{fmt(l.product.price * l.qty)}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {lines.length > 0 && (
              <div className="border-t p-5 shrink-0 space-y-3" style={{ borderColor }}>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="opacity-70">Subtotal</span><span>{fmt(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between" style={{ color: s.accent }}><span>Discount {coupon ? `(${coupon.code})` : ""}</span><span>−{fmt(discount)}</span></div>}
                  <div className="flex justify-between"><span className="opacity-70">Shipping (est.)</span><span>{shipping === 0 ? "Free" : fmt(shipping)}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">Tax (est.)</span><span>{fmt(tax)}</span></div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t" style={{ borderColor }}><span>Total</span><span>{fmt(total)}</span></div>
                </div>
                <button onClick={goToCheckout}
                  className={cn("w-full h-11 rounded-full text-sm font-semibold text-black inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98]")}
                  style={{ background: s.accent }}>
                  Checkout · {fmt(total)} <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex gap-2">
                  <button onClick={goToCartPage} className="flex-1 h-9 rounded-full text-xs font-medium border" style={{ borderColor }}>View cart</button>
                  <button onClick={close} className="flex-1 h-9 rounded-full text-xs opacity-70 hover:opacity-100">Continue shopping</button>
                </div>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function SiteToaster() {
  const toasts = useSiteUI((u) => u.toasts);
  const dismiss = useSiteUI((u) => u.dismissToast);
  const s = useSiteStore();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed z-[9999] bottom-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22 }}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto px-4 py-3 rounded-lg text-xs font-medium shadow-lg backdrop-blur-md cursor-pointer max-w-xs"
            style={{
              background: t.kind === "error" ? "#7f1d1d" : t.kind === "info" ? "rgba(30,30,30,0.9)" : s.accent,
              color: t.kind === "success" ? "#000" : "#fff",
            }}
          >
            <div className="flex items-center gap-2">
              {t.kind === "success" ? <Heart className="h-3.5 w-3.5" /> : t.kind === "error" ? <X className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
              {t.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
