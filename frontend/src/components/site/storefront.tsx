import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useSiteStore } from "@/lib/site-store";
import {
  useStoreData,
  useCartSelectors,
  useWishlistSelectors,
  useSavedForLaterSelectors,
  useRecentlyViewedSelectors,
  type Product,
  type Address,
} from "@/lib/store-data-store";

import { useSiteUI } from "@/lib/site-ui-store";
import { cn } from "@/lib/utils";
import { Minus, Plus, X, ShoppingBag, CheckCircle2, ArrowRight, Heart, Bookmark, Trash2, Zap, CreditCard, Truck, Store, Landmark, Wallet, MapPin, Package, Printer, Copy as CopyIcon } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";


/* ---------- helpers ---------- */
function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function useCtx() {
  const s = useSiteStore();
  return {
    accent: s.accent,
    fontDisplay: s.fontDisplay,
    fontBody: s.fontBody,
    mode: s.mode,
    isLight: s.mode === "light",
  };
}

function useReplaceSearch() {
  const nav = useNavigate();
  return (patch: Record<string, string | undefined>) => {
    nav({
      to: ".",
      search: (prev: any) => {
        const next = { ...(prev ?? {}) };
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined) delete next[k]; else next[k] = v;
        }
        return next;
      },
      replace: true,
    });
  };
}

/* ---------- PRODUCT DETAIL ---------- */

export function ProductDetailView({ handle }: { handle: string }) {
  const products = useStoreData((s) => s.products);
  const addToCart = useStoreData((s) => s.addToCart);
  const toggleWishlist = useStoreData((s) => s.toggleWishlist);
  const wishlistIds = useStoreData((s) => s.wishlist);
  const trackProductView = useStoreData((s) => s.trackProductView);
  const openCart = useSiteUI((u) => u.openCart);
  const toast = useSiteUI((u) => u.toast);
  const replace = useReplaceSearch();
  const ctx = useCtx();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);

  const product = useMemo(
    () => products.find((p) => p.handle === handle) ?? products.find((p) => p.id === handle),
    [products, handle],
  );

  useEffect(() => {
    if (product) trackProductView(product.id);
  }, [product, trackProductView]);

  const inWishlist = product ? wishlistIds.includes(product.id) : false;

  const related = useMemo(() => {
    if (!product) return [] as Product[];
    return products
      .filter((p) => p.id !== product.id && p.status === "Published")
      .filter((p) => (p.category && p.category === product.category)
        || (p.collectionIds ?? []).some((c) => (product.collectionIds ?? []).includes(c)))
      .slice(0, 4);
  }, [product, products]);

  const { items: recentItems } = useRecentlyViewedSelectors(product?.id);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="text-lg font-semibold mb-2">Product not found</div>
        <p className="text-sm text-muted-foreground mb-4">This product may have been removed or the link is invalid.</p>
        <button onClick={() => replace({ product: undefined, view: undefined })}
          className="inline-flex h-10 px-4 rounded-full text-sm font-medium text-black"
          style={{ background: ctx.accent }}>Back to store</button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const outOfStock = product.trackInventory !== false && product.stock === 0 && product.continueSellingWhenOutOfStock !== true;
  const lowStock = product.trackInventory !== false && product.stock > 0 && product.stock <= 5;

  const doAdd = (thenOpen: "drawer" | "checkout" | null = "drawer") => {
    const r = addToCart(product.id, qty);
    if (!r.ok) { toast(r.message, "error"); return; }
    toast(r.message, "success");
    setAdded(true); setTimeout(() => setAdded(false), 1500);
    if (thenOpen === "drawer") openCart();
    else if (thenOpen === "checkout") replace({ view: "checkout", product: undefined });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 relative"
            style={{ background: `linear-gradient(135deg, ${ctx.accent}22, #0000)` }}>
            {images[imgIdx] ? <img src={images[imgIdx]} alt={product.name} className="h-full w-full object-cover" /> : null}
            {outOfStock && (
              <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded" style={{ background: "#7f1d1d", color: "#fff" }}>Sold out</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={cn("aspect-square rounded-lg overflow-hidden border", i === imgIdx ? "ring-2 ring-offset-2 ring-offset-transparent" : "opacity-60")}
                  style={i === imgIdx ? { borderColor: ctx.accent, boxShadow: `0 0 0 2px ${ctx.accent}` } : undefined}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand ? <div className="text-xs uppercase tracking-widest" style={{ color: ctx.accent }}>{product.brand}</div> : null}
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-2xl font-semibold">{fmt(product.price)}</div>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <div className="text-base line-through text-muted-foreground">{fmt(product.compareAtPrice)}</div>
            ) : null}
          </div>
          {product.shortDescription ? <p className="mt-4 text-muted-foreground">{product.shortDescription}</p> : null}

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center rounded-full border border-white/15 h-11">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full w-11 grid place-items-center"><Minus className="h-4 w-4" /></button>
              <div className="w-10 text-center text-sm font-medium">{qty}</div>
              <button onClick={() => setQty((q) => q + 1)} className="h-full w-11 grid place-items-center"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              disabled={outOfStock}
              onClick={() => doAdd("drawer")}
              className="h-11 px-6 rounded-full text-sm font-semibold text-black disabled:opacity-40 inline-flex items-center gap-2"
              style={{ background: ctx.accent }}
            >
              {added ? <><CheckCircle2 className="h-4 w-4" /> Added</> : outOfStock ? "Sold out" : "Add to cart"}
            </button>
            <button
              disabled={outOfStock}
              onClick={() => doAdd("checkout")}
              className="h-11 px-5 rounded-full text-sm font-semibold border inline-flex items-center gap-2 disabled:opacity-40"
              style={{ borderColor: ctx.accent, color: ctx.accent }}
            >
              <Zap className="h-4 w-4" /> Buy now
            </button>
            <button
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => {
                const now = toggleWishlist(product.id);
                toast(now ? "Added to wishlist" : "Removed from wishlist", "info");
              }}
              className="h-11 w-11 rounded-full border grid place-items-center hover:scale-105 transition-transform"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <Heart className={cn("h-4 w-4 transition-colors", inWishlist ? "fill-current" : "")} style={inWishlist ? { color: ctx.accent } : undefined} />
            </button>
          </div>

          {product.trackInventory !== false ? (
            <div className="mt-3 text-xs">
              {outOfStock ? (
                <span className="text-red-400">Out of stock</span>
              ) : lowStock ? (
                <span style={{ color: ctx.accent }}>Only {product.stock} left in stock — order soon</span>
              ) : (
                <span className="text-muted-foreground">In stock · {product.stock} available</span>
              )}
            </div>
          ) : null}

          {product.description ? (
            <div className="mt-8 prose prose-sm dark:prose-invert max-w-none">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Details</div>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          ) : null}

          {product.sku ? <div className="mt-6 text-xs text-muted-foreground">SKU · {product.sku}</div> : null}
        </div>
      </div>

      {related.length > 0 && (
        <ProductRow title="Related products" items={related} />
      )}
      {recentItems.length > 0 && (
        <ProductRow title="Recently viewed" items={recentItems.slice(0, 4)} />
      )}
    </div>
  );
}

function ProductRow({ title, items }: { title: string; items: Product[] }) {
  const ctx = useCtx();
  const replace = useReplaceSearch();
  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: ctx.fontDisplay }}>{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => (
          <button key={p.id} onClick={() => replace({ product: p.handle ?? p.id, view: undefined })}
            className="text-left group">
            <div className="aspect-square rounded-xl overflow-hidden border border-white/10 mb-2">
              {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : null}
            </div>
            <div className="text-sm font-medium truncate">{p.name}</div>
            <div className="text-xs opacity-70">{fmt(p.price)}</div>
          </button>
        ))}
      </div>
    </section>
  );
}


export function CartView() {
  const { lines, subtotal, discount, tax, shipping, total, coupon, cheapestShipping, qualifiesFree, freeShippingThreshold } = useCartSelectors();
  const updateCartQty = useStoreData((s) => s.updateCartQty);
  const removeFromCart = useStoreData((s) => s.removeFromCart);
  const applyCoupon = useStoreData((s) => s.applyCoupon);
  const clearCoupon = useStoreData((s) => s.clearCoupon);
  const clearCart = useStoreData((s) => s.clearCart);
  const saveForLater = useStoreData((s) => s.saveForLater);
  const moveSavedToCart = useStoreData((s) => s.moveSavedToCart);
  const removeSavedForLater = useStoreData((s) => s.removeSavedForLater);
  const toast = useSiteUI((u) => u.toast);
  const { items: savedItems } = useSavedForLaterSelectors();
  const { items: recentItems } = useRecentlyViewedSelectors();
  const products = useStoreData((s) => s.products);
  const replace = useReplaceSearch();
  const ctx = useCtx();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string>("");

  const cartIds = new Set(lines.map((l) => l.productId));
  const suggested = products
    .filter((p) => p.status === "Published" && !cartIds.has(p.id))
    .filter((p) => lines.some((l) => (p.collectionIds ?? []).some((c) => (l.product.collectionIds ?? []).includes(c)) || p.category === l.product.category))
    .slice(0, 4);

  if (lines.length === 0 && savedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 opacity-40" />
        <div className="mt-4 text-xl font-semibold">Your cart is empty</div>
        <p className="mt-1 text-sm text-muted-foreground">Add products from the store to get started.</p>
        <button onClick={() => replace({ view: undefined, product: undefined })}
          className="mt-6 inline-flex h-10 px-4 rounded-full text-sm font-medium text-black"
          style={{ background: ctx.accent }}>Continue shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h1 className="text-3xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>Your cart</h1>
            {lines.length > 0 && (
              <button onClick={() => { clearCart(); toast("Cart cleared", "info"); }}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Clear cart
              </button>
            )}
          </div>

          {freeShippingThreshold != null && lines.length > 0 && (
            <div className="mb-4 rounded-xl border border-white/10 p-3">
              {qualifiesFree ? (
                <div className="text-xs" style={{ color: ctx.accent }}>🎉 You've unlocked free shipping!</div>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground mb-1.5">Spend {fmt(Math.max(0, freeShippingThreshold - subtotal + discount))} more for free shipping</div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                    <motion.div className="h-full" style={{ background: ctx.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((subtotal - discount) / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {lines.length > 0 && (
            <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.div key={l.productId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 30 }} className="p-4 flex gap-4">
                    <button onClick={() => replace({ product: l.product.handle ?? l.product.id, view: undefined })} className="h-24 w-24 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      {l.product.images?.[0] ? <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => replace({ product: l.product.handle ?? l.product.id, view: undefined })} className="text-sm font-medium hover:underline block truncate text-left">{l.product.name}</button>
                      <div className="text-xs text-muted-foreground mt-0.5">{fmt(l.product.price)} each</div>
                      {l.product.sku && <div className="text-[11px] text-muted-foreground">SKU · {l.product.sku}</div>}
                      {l.product.trackInventory !== false && l.product.stock <= 5 && l.product.stock > 0 && (
                        <div className="text-[11px] mt-0.5" style={{ color: ctx.accent }}>Only {l.product.stock} left</div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center rounded-full border border-white/15 h-8">
                          <button onClick={() => { const r = updateCartQty(l.productId, l.qty - 1); if (!r.ok && r.message) toast(r.message, "error"); }} className="h-full w-8 grid place-items-center"><Minus className="h-3 w-3" /></button>
                          <div className="w-8 text-center text-xs font-medium">{l.qty}</div>
                          <button onClick={() => { const r = updateCartQty(l.productId, l.qty + 1); if (!r.ok && r.message) toast(r.message, "error"); }} className="h-full w-8 grid place-items-center"><Plus className="h-3 w-3" /></button>
                        </div>
                        <button onClick={() => { saveForLater(l.productId); toast("Saved for later", "info"); }} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                          <Bookmark className="h-3 w-3" /> Save for later
                        </button>
                        <button onClick={() => removeFromCart(l.productId)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{fmt(l.product.price * l.qty)}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {savedItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-widest text-muted-foreground">Saved for later ({savedItems.length})</h2>
              <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
                {savedItems.map((l) => (
                  <div key={l.productId} className="p-4 flex gap-4">
                    <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
                      {l.product.images?.[0] ? <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.product.name}</div>
                      <div className="text-xs text-muted-foreground">{fmt(l.product.price)}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <button onClick={() => { const r = moveSavedToCart(l.productId); toast(r.message, r.ok ? "success" : "error"); }}
                          className="text-xs font-medium inline-flex items-center gap-1" style={{ color: ctx.accent }}>
                          <ShoppingBag className="h-3 w-3" /> Move to cart
                        </button>
                        <button onClick={() => removeSavedForLater(l.productId)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-white/10 p-6 h-fit lg:sticky lg:top-4">
          <div className="text-sm font-semibold mb-4">Order summary</div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between" style={{ color: ctx.accent }}><span>Discount {coupon ? `(${coupon.code})` : ""}</span><span>−{fmt(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping {cheapestShipping ? `(${cheapestShipping.label})` : ""}</span><span>{shipping === 0 ? "Free" : fmt(shipping)}</span></div>
            {cheapestShipping?.etaDays && (
              <div className="text-[11px] text-muted-foreground -mt-1">Estimated delivery: {cheapestShipping.etaDays[0]}–{cheapestShipping.etaDays[1]} days</div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Tax (est.)</span><span>{fmt(tax)}</span></div>
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-base font-semibold"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
          <div className="mt-4">
            {coupon ? (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                <span>Coupon <b>{coupon.code}</b> applied</span>
                <button onClick={() => { clearCoupon(); setMsg(""); }} className="text-muted-foreground hover:text-foreground">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code"
                  className="flex-1 h-9 px-3 rounded-lg border border-white/15 bg-transparent text-sm" />
                <button onClick={() => { const r = applyCoupon(code); setMsg(r.message); toast(r.message, r.ok ? "success" : "error"); if (r.ok) setCode(""); }}
                  className="h-9 px-3 rounded-lg text-xs font-medium border border-white/15">Apply</button>
              </div>
            )}
            {msg && <div className="mt-2 text-xs text-muted-foreground">{msg}</div>}
          </div>
          <button
            disabled={lines.length === 0}
            onClick={() => replace({ view: "checkout", product: undefined })}
            className="mt-5 w-full h-11 rounded-full text-sm font-semibold text-black inline-flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: ctx.accent }}>Checkout <ArrowRight className="h-4 w-4" /></button>
          <button onClick={() => replace({ view: undefined, product: undefined })}
            className="mt-2 w-full h-10 rounded-full text-xs text-muted-foreground hover:text-foreground">Continue shopping</button>
        </aside>
      </div>

      {suggested.length > 0 && <ProductRow title="You may also like" items={suggested} />}
      {recentItems.length > 0 && <ProductRow title="Recently viewed" items={recentItems.slice(0, 4)} />}
    </div>
  );
}

/* ---------- WISHLIST ---------- */

export function WishlistView() {
  const { items } = useWishlistSelectors();
  const removeFromWishlist = useStoreData((s) => s.removeFromWishlist);
  const moveWishlistToCart = useStoreData((s) => s.moveWishlistToCart);
  const clearWishlist = useStoreData((s) => s.clearWishlist);
  const openCart = useSiteUI((u) => u.openCart);
  const toast = useSiteUI((u) => u.toast);
  const replace = useReplaceSearch();
  const ctx = useCtx();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 opacity-40" />
        <div className="mt-4 text-xl font-semibold">Your wishlist is empty</div>
        <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
        <button onClick={() => replace({ view: undefined, product: undefined })}
          className="mt-6 inline-flex h-10 px-4 rounded-full text-sm font-medium text-black"
          style={{ background: ctx.accent }}>Browse products</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-3xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>Wishlist ({items.length})</h1>
        <button onClick={() => { clearWishlist(); toast("Wishlist cleared", "info"); }} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <Trash2 className="h-3 w-3" /> Clear all
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {items.map((p) => {
            const outOfStock = p.trackInventory !== false && p.stock === 0 && p.continueSellingWhenOutOfStock !== true;
            return (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                <button onClick={() => replace({ product: p.handle ?? p.id, view: undefined })} className="aspect-square bg-white/5 relative">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                  {outOfStock && <div className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-1 rounded" style={{ background: "#7f1d1d", color: "#fff" }}>Sold out</div>}
                </button>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground mb-3">{fmt(p.price)}</div>
                  <div className="mt-auto flex gap-2">
                    <button disabled={outOfStock}
                      onClick={() => { const r = moveWishlistToCart(p.id); toast(r.message, r.ok ? "success" : "error"); if (r.ok) openCart(); }}
                      className="flex-1 h-9 rounded-full text-xs font-semibold text-black disabled:opacity-40" style={{ background: ctx.accent }}>
                      {outOfStock ? "Sold out" : "Move to cart"}
                    </button>
                    <button aria-label="Remove" onClick={() => removeFromWishlist(p.id)}
                      className="h-9 w-9 rounded-full border grid place-items-center" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}


/* ---------- CHECKOUT ---------- */

const CHECKOUT_STEPS = ["Contact", "Shipping", "Delivery", "Payment", "Review"] as const;
type CheckoutStep = typeof CHECKOUT_STEPS[number];

type CheckoutForm = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createAccount: boolean;
  marketingOptIn: boolean;
  ship: {
    line1: string; apartment: string; city: string; state: string; zip: string; country: string; company: string;
  };
  billingSame: boolean;
  bill: {
    firstName: string; lastName: string; line1: string; apartment: string; city: string; state: string; zip: string; country: string; company: string;
  };
  shippingRateId: string;
  paymentMethod: "Card" | "PayPal" | "Apple Pay" | "Bank transfer" | "Cash on delivery";
  card: { number: string; name: string; exp: string; cvc: string };
  notes: string;
};

const emptyCheckout = (): CheckoutForm => ({
  email: "", firstName: "", lastName: "", phone: "",
  createAccount: false, marketingOptIn: true,
  ship: { line1: "", apartment: "", city: "", state: "", zip: "", country: "United States", company: "" },
  billingSame: true,
  bill: { firstName: "", lastName: "", line1: "", apartment: "", city: "", state: "", zip: "", country: "United States", company: "" },
  shippingRateId: "",
  paymentMethod: "Card",
  card: { number: "", name: "", exp: "", cvc: "" },
  notes: "",
});

function draftKey(tenantId: string) { return `aether.checkout.${tenantId}`; }

function loadDraft(tenantId: string): CheckoutForm {
  if (typeof window === "undefined") return emptyCheckout();
  try {
    const raw = localStorage.getItem(draftKey(tenantId));
    if (!raw) return emptyCheckout();
    const parsed = { ...emptyCheckout(), ...JSON.parse(raw) };
    // Never restore card data from storage.
    parsed.card = { number: "", name: "", exp: "", cvc: "" };
    return parsed;
  } catch { return emptyCheckout(); }
}

function saveDraft(tenantId: string, f: CheckoutForm) {
  if (typeof window === "undefined") return;
  try {
    const safe = { ...f, card: { number: "", name: "", exp: "", cvc: "" } };
    localStorage.setItem(draftKey(tenantId), JSON.stringify(safe));
  } catch {}
}

function clearDraft(tenantId: string) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(draftKey(tenantId)); } catch {}
}

const paymentOptions = [
  { id: "Card", label: "Credit / debit card", Icon: CreditCard, desc: "Visa, Mastercard, Amex" },
  { id: "PayPal", label: "PayPal", Icon: Wallet, desc: "Redirect to PayPal" },
  { id: "Apple Pay", label: "Apple Pay", Icon: Wallet, desc: "Fast checkout" },
  { id: "Bank transfer", label: "Bank transfer", Icon: Landmark, desc: "Manual bank transfer" },
  { id: "Cash on delivery", label: "Cash on delivery", Icon: Truck, desc: "Pay when your order arrives" },
] as const;

export function CheckoutView() {
  const { lines, subtotal, discount, tax, shipping, total, coupon, shippingRates, freeShippingThreshold, qualifiesFree, requiresShipping } = useCartSelectors();
  const placeOrder = useStoreData((s) => s.placeOrder);
  const activeTenantId = useStoreData((s) => s.activeTenantId);
  const customers = useStoreData((s) => s.customers);
  const applyCoupon = useStoreData((s) => s.applyCoupon);
  const clearCoupon = useStoreData((s) => s.clearCoupon);
  const authUser = useAuthStore((a) => a.user);
  const toast = useSiteUI((u) => u.toast);
  const replace = useReplaceSearch();
  const ctx = useCtx();

  const [step, setStep] = useState<CheckoutStep>("Contact");
  const [form, setForm] = useState<CheckoutForm>(() => loadDraft(activeTenantId));
  const [error, setError] = useState<string>("");
  const [couponInput, setCouponInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from logged-in user (one-time)
  useEffect(() => {
    if (!authUser) return;
    setForm((f) => {
      if (f.email) return f;
      const [fn, ...rest] = (authUser.name ?? "").split(" ");
      return { ...f, email: authUser.email, firstName: f.firstName || fn || "", lastName: f.lastName || rest.join(" ") };
    });
  }, [authUser]);

  // Auto-select cheapest shipping rate
  useEffect(() => {
    if (!form.shippingRateId && shippingRates.length > 0) {
      const cheapest = [...shippingRates].sort((a, b) => a.cost - b.cost)[0];
      setForm((f) => ({ ...f, shippingRateId: cheapest.id }));
    }
  }, [form.shippingRateId, shippingRates]);

  // Persist draft
  useEffect(() => { saveDraft(activeTenantId, form); }, [activeTenantId, form]);

  const savedAddresses = useMemo(() => {
    if (!form.email) return [] as Address[];
    const c = customers.find((x) => x.email.toLowerCase() === form.email.toLowerCase());
    return c?.addresses ?? [];
  }, [customers, form.email]);


  const selectedRate = shippingRates.find((r) => r.id === form.shippingRateId);
  const rateCostEffective = !requiresShipping
    ? 0
    : (qualifiesFree || (coupon?.freeShipping) || (selectedRate?.freeAbove != null && subtotal - discount >= (selectedRate.freeAbove ?? Infinity)))
      ? 0 : (selectedRate?.cost ?? 0);
  const grandTotal = Math.max(0, subtotal - discount) + tax + rateCostEffective;

  if (lines.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 opacity-40" />
        <div className="mt-4 text-lg font-semibold">Your cart is empty</div>
        <p className="mt-2 text-sm text-muted-foreground">Add products to your cart before checking out.</p>
        <button onClick={() => replace({ view: undefined, product: undefined })}
          className="mt-6 inline-flex h-10 px-5 rounded-full text-sm font-medium text-black"
          style={{ background: ctx.accent }}>Continue shopping</button>
      </div>
    );
  }

  const setField = <K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setShip = (patch: Partial<CheckoutForm["ship"]>) => setForm((f) => ({ ...f, ship: { ...f.ship, ...patch } }));
  const setBill = (patch: Partial<CheckoutForm["bill"]>) => setForm((f) => ({ ...f, bill: { ...f.bill, ...patch } }));

  const validateStep = (s: CheckoutStep): string | null => {
    if (s === "Contact") {
      if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address.";
      if (!form.firstName || !form.lastName) return "Please enter your first and last name.";
    }
    if (s === "Shipping" && requiresShipping) {
      const { line1, city, state, zip, country } = form.ship;
      if (!line1 || !city || !state || !zip || !country) return "Please complete your shipping address.";
    }
    if (s === "Delivery" && requiresShipping) {
      if (!form.shippingRateId) return "Please choose a delivery method.";
    }
    if (s === "Payment") {
      if (form.paymentMethod === "Card") {
        const digits = form.card.number.replace(/\s+/g, "");
        if (!/^\d{12,19}$/.test(digits)) return "Enter a valid card number.";
        if (!/^\d{2}\/\d{2}$/.test(form.card.exp)) return "Enter expiry as MM/YY.";
        if (!/^\d{3,4}$/.test(form.card.cvc)) return "Enter a valid CVC.";
        if (!form.card.name.trim()) return "Enter the cardholder name.";
      }
      if (!form.billingSame) {
        const { firstName, lastName, line1, city, state, zip, country } = form.bill;
        if (!firstName || !lastName || !line1 || !city || !state || !zip || !country) return "Please complete your billing address.";
      }
    }
    return null;
  };

  const stepsForFlow = requiresShipping ? CHECKOUT_STEPS : (["Contact", "Payment", "Review"] as CheckoutStep[]);
  const stepIdx = stepsForFlow.indexOf(step);

  const goNext = () => {
    setError("");
    const err = validateStep(step);
    if (err) { setError(err); return; }
    if (stepIdx < stepsForFlow.length - 1) setStep(stepsForFlow[stepIdx + 1]);
  };
  const goBack = () => {
    setError("");
    if (stepIdx === 0) return replace({ view: "cart" });
    setStep(stepsForFlow[stepIdx - 1]);
  };

  const doApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    const r = applyCoupon(code);
    toast(r.message, r.ok ? "success" : "error");
    if (r.ok) setCouponInput("");
  };

  const doRemoveCoupon = () => { clearCoupon(); toast("Coupon removed", "info"); };

  const submit = async () => {
    setError("");
    // final validation across steps
    for (const s of stepsForFlow) {
      const e = validateStep(s);
      if (e) { setError(e); setStep(s); return; }
    }
    setSubmitting(true);
    // Simulate payment latency
    await new Promise((r) => setTimeout(r, 900));
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    const shipAddr = requiresShipping ? {
      firstName: form.firstName, lastName: form.lastName, name: fullName,
      email: form.email, phone: form.phone, company: form.ship.company,
      line1: form.ship.line1, apartment: form.ship.apartment, city: form.ship.city,
      state: form.ship.state, zip: form.ship.zip, country: form.ship.country,
    } : undefined;
    const billAddr = form.billingSame ? shipAddr : {
      firstName: form.bill.firstName, lastName: form.bill.lastName,
      name: `${form.bill.firstName} ${form.bill.lastName}`.trim(),
      email: form.email, phone: form.phone, company: form.bill.company,
      line1: form.bill.line1, apartment: form.bill.apartment, city: form.bill.city,
      state: form.bill.state, zip: form.bill.zip, country: form.bill.country,
    };
    const method = selectedRate ? {
      id: selectedRate.id, label: selectedRate.label,
      cost: rateCostEffective, etaDays: selectedRate.etaDays,
    } : undefined;
    const result = placeOrder({
      email: form.email, name: fullName, phone: form.phone,
      shipping: shipAddr, billing: billAddr, billingSameAsShipping: form.billingSame,
      shippingMethod: method, paymentMethod: form.paymentMethod,
      notes: form.notes,
      userId: authUser?.id, userName: authUser?.name,
    });
    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    clearDraft(activeTenantId);
    toast(`Order ${result.number} placed!`, "success");
    replace({ view: "order", order: result.number, product: undefined });
  };

  const inputCls = "w-full h-11 px-3 rounded-lg border border-white/15 bg-transparent text-sm outline-none focus:border-white/40 transition-colors";
  const labelCls = "text-xs mb-1.5 text-muted-foreground block";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: ctx.fontDisplay }}>Checkout</h1>
        <button onClick={() => replace({ view: "cart" })} className="text-xs text-muted-foreground hover:underline mb-6">← Return to cart</button>

        {/* Step tracker */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto text-xs">
          {stepsForFlow.map((sName, i) => {
            const active = sName === step;
            const done = stepsForFlow.indexOf(sName) < stepIdx;
            return (
              <div key={sName} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => done && setStep(sName)}
                  className={cn("h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold shrink-0",
                    active ? "text-black" : done ? "text-black" : "text-muted-foreground border border-white/15")}
                  style={active || done ? { background: ctx.accent } : undefined}
                >{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</button>
                <span className={active ? "font-medium" : "text-muted-foreground"}>{sName}</span>
                {i < stepsForFlow.length - 1 && <span className="text-muted-foreground mx-1">›</span>}
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* ---- CONTACT ---- */}
          {step === "Contact" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Contact information</h2>
                {!authUser && <span className="text-xs text-muted-foreground">Have an account? <button className="underline" onClick={() => toast("Sign in from the top nav to reuse saved addresses", "info")}>Sign in</button></span>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={form.email} onChange={(e) => setField("email", e.target.value)} type="email" placeholder="you@example.com" className={inputCls} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>First name</label>
                  <input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last name</label>
                  <input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone (optional)</label>
                <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} placeholder="+1 555 123 4567" />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => setField("marketingOptIn", e.target.checked)} />
                Email me with news and offers
              </label>
              {!authUser && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={form.createAccount} onChange={(e) => setField("createAccount", e.target.checked)} />
                  Save my info for a faster checkout next time
                </label>
              )}
            </section>
          )}

          {/* ---- SHIPPING ---- */}
          {step === "Shipping" && requiresShipping && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold">Shipping address</h2>
              {savedAddresses.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {savedAddresses.slice(0, 4).map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setShip({
                        line1: a.line1 ?? "", apartment: a.apartment ?? "", city: a.city ?? "",
                        state: a.state ?? "", zip: a.zip ?? "", country: a.country ?? "United States",
                        company: a.company ?? "",
                      })}
                      className="text-left rounded-xl border border-white/10 p-3 hover:border-white/30 transition-colors"
                    >
                      <div className="text-xs font-semibold flex items-center gap-1">
                        <MapPin className="h-3 w-3" style={{ color: ctx.accent }} />
                        {a.label ?? a.city ?? "Saved address"}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 truncate">
                        {[a.line1, a.city, a.state, a.zip].filter(Boolean).join(", ")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <label className={labelCls}>Company (optional)</label>
                <input value={form.ship.company} onChange={(e) => setShip({ company: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Street address</label>
                <input value={form.ship.line1} onChange={(e) => setShip({ line1: e.target.value })} className={inputCls} placeholder="123 Main St" />
              </div>
              <div>
                <label className={labelCls}>Apartment, suite, etc. (optional)</label>
                <input value={form.ship.apartment} onChange={(e) => setShip({ apartment: e.target.value })} className={inputCls} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input value={form.ship.city} onChange={(e) => setShip({ city: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State / Region</label>
                  <input value={form.ship.state} onChange={(e) => setShip({ state: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ZIP / Postal</label>
                  <input value={form.ship.zip} onChange={(e) => setShip({ zip: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input value={form.ship.country} onChange={(e) => setShip({ country: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Order notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} className="w-full min-h-[80px] p-3 rounded-lg border border-white/15 bg-transparent text-sm outline-none focus:border-white/40" placeholder="Delivery instructions, gift note…" />
              </div>
            </section>
          )}

          {/* ---- DELIVERY ---- */}
          {step === "Delivery" && requiresShipping && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold">Delivery method</h2>
              {freeShippingThreshold != null && !qualifiesFree && !coupon?.freeShipping && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: `${ctx.accent}1a`, color: ctx.accent }}>
                  Spend {fmt(Math.max(0, freeShippingThreshold - (subtotal - discount)))} more for free shipping.
                </div>
              )}
              <div className="grid gap-2">
                {shippingRates.map((r) => {
                  const selected = form.shippingRateId === r.id;
                  const free = qualifiesFree || coupon?.freeShipping || (r.freeAbove != null && subtotal - discount >= r.freeAbove);
                  const cost = free ? 0 : r.cost;
                  return (
                    <label key={r.id} className={cn("flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                      selected ? "" : "border-white/15 hover:border-white/30")}
                      style={selected ? { borderColor: ctx.accent, background: `${ctx.accent}10` } : undefined}>
                      <div className="flex items-center gap-3 text-sm">
                        <input type="radio" name="ship" checked={selected} onChange={() => setField("shippingRateId", r.id)} />
                        <div>
                          <div className="font-medium">{r.label}</div>
                          {r.etaDays && <div className="text-[11px] text-muted-foreground">Arrives in {r.etaDays[0]}–{r.etaDays[1]} business days</div>}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{cost === 0 ? "Free" : fmt(cost)}</div>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---- PAYMENT ---- */}
          {step === "Payment" && (
            <section className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold mb-3">Payment method</h2>
                <div className="grid gap-2">
                  {paymentOptions.map((p) => {
                    const selected = form.paymentMethod === p.id;
                    return (
                      <label key={p.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                        selected ? "" : "border-white/15 hover:border-white/30")}
                        style={selected ? { borderColor: ctx.accent, background: `${ctx.accent}10` } : undefined}>
                        <input type="radio" name="pay" checked={selected} onChange={() => setField("paymentMethod", p.id)} />
                        <p.Icon className="h-4 w-4" style={{ color: ctx.accent }} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className="text-[11px] text-muted-foreground">{p.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {form.paymentMethod === "Card" && (
                <div className="rounded-xl border border-white/10 p-4 space-y-3">
                  <div>
                    <label className={labelCls}>Card number</label>
                    <input value={form.card.number} onChange={(e) => setForm((f) => ({ ...f, card: { ...f.card, number: e.target.value } }))} className={inputCls} placeholder="4242 4242 4242 4242" />
                  </div>
                  <div>
                    <label className={labelCls}>Cardholder name</label>
                    <input value={form.card.name} onChange={(e) => setForm((f) => ({ ...f, card: { ...f.card, name: e.target.value } }))} className={inputCls} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Expiry</label>
                      <input value={form.card.exp} onChange={(e) => setForm((f) => ({ ...f, card: { ...f.card, exp: e.target.value } }))} className={inputCls} placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className={labelCls}>CVC</label>
                      <input value={form.card.cvc} onChange={(e) => setForm((f) => ({ ...f, card: { ...f.card, cvc: e.target.value } }))} className={inputCls} placeholder="123" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Demo checkout — no real card is charged.</p>
                </div>
              )}
              {form.paymentMethod === "Bank transfer" && (
                <div className="rounded-xl border border-white/10 p-4 text-xs text-muted-foreground">
                  Bank details will be emailed once the order is confirmed. Your order will be reserved for 3 business days.
                </div>
              )}
              {form.paymentMethod === "Cash on delivery" && (
                <div className="rounded-xl border border-white/10 p-4 text-xs text-muted-foreground">
                  Pay in cash to the courier upon delivery. A small handling fee may apply per your local policy.
                </div>
              )}

              {requiresShipping && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Billing address</h3>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <input type="checkbox" checked={form.billingSame} onChange={(e) => setField("billingSame", e.target.checked)} />
                    Same as shipping address
                  </label>
                  {!form.billingSame && (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input placeholder="First name" value={form.bill.firstName} onChange={(e) => setBill({ firstName: e.target.value })} className={inputCls} />
                        <input placeholder="Last name" value={form.bill.lastName} onChange={(e) => setBill({ lastName: e.target.value })} className={inputCls} />
                      </div>
                      <input placeholder="Company (optional)" value={form.bill.company} onChange={(e) => setBill({ company: e.target.value })} className={inputCls} />
                      <input placeholder="Street address" value={form.bill.line1} onChange={(e) => setBill({ line1: e.target.value })} className={inputCls} />
                      <input placeholder="Apartment, suite (optional)" value={form.bill.apartment} onChange={(e) => setBill({ apartment: e.target.value })} className={inputCls} />
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input placeholder="City" value={form.bill.city} onChange={(e) => setBill({ city: e.target.value })} className={inputCls} />
                        <input placeholder="State / Region" value={form.bill.state} onChange={(e) => setBill({ state: e.target.value })} className={inputCls} />
                        <input placeholder="ZIP / Postal" value={form.bill.zip} onChange={(e) => setBill({ zip: e.target.value })} className={inputCls} />
                      </div>
                      <input placeholder="Country" value={form.bill.country} onChange={(e) => setBill({ country: e.target.value })} className={inputCls} />
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ---- REVIEW ---- */}
          {step === "Review" && (
            <section className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Review your order</h2>
                <button onClick={() => replace({ view: "cart" })} className="text-xs underline text-muted-foreground">Edit cart</button>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                  <span>Contact</span>
                  <button onClick={() => setStep("Contact")} className="underline">Edit</button>
                </div>
                <div>{form.firstName} {form.lastName}</div>
                <div className="text-muted-foreground">{form.email}{form.phone ? ` · ${form.phone}` : ""}</div>
              </div>
              {requiresShipping && (
                <div className="rounded-xl border border-white/10 p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                    <span>Ship to</span>
                    <button onClick={() => setStep("Shipping")} className="underline">Edit</button>
                  </div>
                  <div>{form.ship.line1}{form.ship.apartment ? `, ${form.ship.apartment}` : ""}</div>
                  <div className="text-muted-foreground">{form.ship.city}, {form.ship.state} {form.ship.zip}, {form.ship.country}</div>
                  {selectedRate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Delivery: <span className="text-foreground">{selectedRate.label}</span>
                      {selectedRate.etaDays && <> · Arrives in {selectedRate.etaDays[0]}–{selectedRate.etaDays[1]} days</>}
                      · {rateCostEffective === 0 ? "Free" : fmt(rateCostEffective)}
                    </div>
                  )}
                </div>
              )}
              <div className="rounded-xl border border-white/10 p-4">
                <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                  <span>Payment</span>
                  <button onClick={() => setStep("Payment")} className="underline">Edit</button>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" style={{ color: ctx.accent }} />
                  {form.paymentMethod}
                  {form.paymentMethod === "Card" && form.card.number && (
                    <span className="text-muted-foreground text-xs">
                      ·••• {form.card.number.replace(/\s+/g, "").slice(-4)}
                    </span>
                  )}
                </div>
                {!form.billingSame && requiresShipping && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Billing: {form.bill.line1}, {form.bill.city}, {form.bill.state} {form.bill.zip}
                  </div>
                )}
              </div>
              {form.notes && (
                <div className="rounded-xl border border-white/10 p-4 text-xs">
                  <div className="text-muted-foreground mb-1">Order notes</div>
                  <div>{form.notes}</div>
                </div>
              )}
            </section>
          )}

          {error && <div className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex justify-between gap-3 pt-2">
            <button onClick={goBack} className="h-11 px-4 rounded-full text-sm text-muted-foreground hover:text-foreground border border-white/10">← Back</button>
            {step !== stepsForFlow[stepsForFlow.length - 1] ? (
              <button onClick={goNext} className="h-11 px-6 rounded-full text-sm font-semibold text-black" style={{ background: ctx.accent }}>Continue</button>
            ) : (
              <button onClick={submit} disabled={submitting}
                className="h-11 px-6 rounded-full text-sm font-semibold text-black inline-flex items-center gap-2 disabled:opacity-60"
                style={{ background: ctx.accent }}>
                {submitting ? "Placing order…" : <>Place order · {fmt(grandTotal)} <ArrowRight className="h-4 w-4" /></>}
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground pt-2">By placing your order you agree to the store's terms and privacy policy.</p>
        </div>
      </div>

      {/* SUMMARY */}
      <aside className="rounded-2xl border border-white/10 p-6 h-fit lg:sticky lg:top-24 space-y-4">
        <div className="text-sm font-semibold">Order summary</div>
        <div className="space-y-3 max-h-72 overflow-auto pr-1">
          {lines.map((l) => (
            <div key={l.productId} className="flex gap-3 text-sm">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {l.product.images?.[0] ? <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold grid place-items-center text-black" style={{ background: ctx.accent }}>{l.qty}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{l.product.name}</div>
                {l.product.sku && <div className="text-[10px] text-muted-foreground">SKU · {l.product.sku}</div>}
              </div>
              <div className="text-sm">{fmt(l.product.price * l.qty)}</div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="border-t border-white/10 pt-3">
          {coupon ? (
            <div className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ background: `${ctx.accent}1a` }}>
              <span style={{ color: ctx.accent }}>Coupon <b>{coupon.code}</b> applied</span>
              <button onClick={doRemoveCoupon} className="opacity-70 hover:opacity-100">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code" className="flex-1 h-9 px-3 rounded-lg border border-white/15 bg-transparent text-xs uppercase" />
              <button onClick={doApplyCoupon} className="h-9 px-3 rounded-lg text-xs font-semibold border border-white/15 hover:border-white/40">Apply</button>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between" style={{ color: ctx.accent }}><span>Discount{coupon ? ` (${coupon.code})` : ""}</span><span>−{fmt(discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{rateCostEffective === 0 ? (requiresShipping ? "Free" : "—") : fmt(rateCostEffective)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(tax)}</span></div>
          <div className="border-t border-white/10 pt-2 flex justify-between text-base font-semibold"><span>Total</span><span>{fmt(grandTotal)}</span></div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- ORDER CONFIRMATION ---------- */

export function OrderConfirmationView({ orderNumber }: { orderNumber: string }) {
  const orders = useStoreData((s) => s.orders);
  const replace = useReplaceSearch();
  const toast = useSiteUI((u) => u.toast);
  const ctx = useCtx();
  const order = useMemo(
    () => orders.find((o) => o.number === orderNumber || o.number === `#${orderNumber}` || o.id === orderNumber),
    [orders, orderNumber],
  );

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="text-lg font-semibold">Order not found</div>
        <p className="mt-2 text-sm text-muted-foreground">We couldn't find order <b>{orderNumber}</b>.</p>
        <button onClick={() => replace({ view: undefined, order: undefined })}
          className="mt-6 inline-flex h-10 px-4 rounded-full text-sm font-medium text-black"
          style={{ background: ctx.accent }}>Continue shopping</button>
      </div>
    );
  }

  const eta = order.estimatedDelivery;
  const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const copyNumber = async () => {
    try { await navigator.clipboard.writeText(order.number); toast("Order number copied", "success"); } catch { /* noop */ }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 rounded-full grid place-items-center" style={{ background: `${ctx.accent}22` }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: ctx.accent }} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold" style={{ fontFamily: ctx.fontDisplay }}>Thank you, {order.customerName.split(" ")[0] || "friend"}!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order <b>{order.number}</b> has been placed. A confirmation email is on its way to <b>{order.customerEmail}</b>.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full border border-white/10">Invoice · {order.invoiceNumber}</span>
          <button onClick={copyNumber} className="px-2 py-1 rounded-full border border-white/10 inline-flex items-center gap-1"><CopyIcon className="h-3 w-3" /> Copy order #</button>
        </div>
      </div>

      {eta && (
        <div className="mt-8 rounded-2xl border border-white/10 p-5 flex items-center gap-4">
          <Package className="h-8 w-8 shrink-0" style={{ color: ctx.accent }} />
          <div>
            <div className="text-sm font-semibold">Estimated delivery</div>
            <div className="text-xs text-muted-foreground">
              {fmtDate(eta.earliest)} – {fmtDate(eta.latest)}
              {order.shippingMethod ? <> · via {order.shippingMethod.label}</> : null}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {order.shipping && (
          <div className="rounded-2xl border border-white/10 p-5">
            <div className="text-xs text-muted-foreground mb-1">Shipping address</div>
            <div className="text-sm">{order.shipping.name ?? order.customerName}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {[order.shipping.line1, order.shipping.apartment, order.shipping.city, order.shipping.state, order.shipping.zip, order.shipping.country].filter(Boolean).join(", ")}
            </div>
            {order.customerPhone && <div className="text-xs text-muted-foreground mt-1">{order.customerPhone}</div>}
          </div>
        )}
        <div className="rounded-2xl border border-white/10 p-5">
          <div className="text-xs text-muted-foreground mb-1">Payment</div>
          <div className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" style={{ color: ctx.accent }} />{order.paymentMethod}</div>
          <div className="text-xs text-muted-foreground mt-2">Status: <span className="text-foreground">{order.status}</span></div>
          <div className="text-xs text-muted-foreground">Fulfillment: <span className="text-foreground">{order.fulfillment}</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 p-5">
        <div className="text-sm font-semibold mb-4">Items ({order.itemsCount})</div>
        <div className="space-y-3">
          {order.items.map((i) => (
            <div key={i.productId} className="flex gap-3 text-sm">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{i.name}</div>
                <div className="text-xs text-muted-foreground">Qty {i.qty} · {fmt(i.price)} each</div>
              </div>
              <div className="text-sm">{fmt(i.price * i.qty)}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-white/10 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between" style={{ color: ctx.accent }}><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>−{fmt(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingCost === 0 ? "Free" : fmt(order.shippingCost)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(order.tax)}</span></div>
          <div className="border-t border-white/10 pt-2 flex justify-between text-base font-semibold"><span>Total paid</span><span>{fmt(order.total)}</span></div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 p-5">
        <div className="text-sm font-semibold mb-3">Order timeline</div>
        <ol className="space-y-2">
          {order.timeline.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <div className="h-2 w-2 mt-2 rounded-full" style={{ background: ctx.accent }} />
              <div>
                <div>{t.label}</div>
                <div className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button onClick={() => window.print()} className="h-10 px-4 rounded-full text-xs font-medium border border-white/15 inline-flex items-center gap-2">
          <Printer className="h-3.5 w-3.5" /> Print receipt
        </button>
        <button onClick={() => replace({ view: undefined, order: undefined, product: undefined })}
          className="h-10 px-5 rounded-full text-xs font-semibold text-black"
          style={{ background: ctx.accent }}>Continue shopping</button>
      </div>
    </div>
  );
}



/* ---------- SHOP (all products) ---------- */

export function ShopView() {
  const products = useStoreData((s) => s.products.filter((p) => p.status === "Published"));
  const ctx = useCtx();
  const addToCart = useStoreData((s) => s.addToCart);
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-6" style={{ fontFamily: ctx.fontDisplay }}>Shop</h1>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p: Product) => (
            <div key={p.id} className="group">
              <a href={`?product=${p.handle}`}>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${ctx.accent}22, #0000)` }}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" /> : null}
                </div>
              </a>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                  <a href={`?product=${p.handle}`} className="text-sm font-medium hover:underline">{p.name}</a>
                  <div className="text-xs text-muted-foreground">{fmt(p.price)}</div>
                </div>
                <button onClick={() => addToCart(p.id, 1)} className="h-8 px-3 rounded-full text-[11px] font-medium text-black"
                  style={{ background: ctx.accent }}>Add</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- CATEGORY / COLLECTION browse ---------- */

function ProductGrid({ products }: { products: Product[] }) {
  const ctx = useCtx();
  const addToCart = useStoreData((s) => s.addToCart);
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground mt-8">No products in this group yet.</p>;
  }
  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((p) => (
        <div key={p.id} className="group">
          <a href={`?product=${p.handle}`}>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10"
              style={{ background: `linear-gradient(135deg, ${ctx.accent}22, #0000)` }}>
              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" /> : null}
            </div>
          </a>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <a href={`?product=${p.handle}`} className="text-sm font-medium hover:underline">{p.name}</a>
              <div className="text-xs text-muted-foreground">{fmt(p.price)}</div>
            </div>
            <button onClick={() => addToCart(p.id, 1)} className="h-8 px-3 rounded-full text-[11px] font-medium text-black"
              style={{ background: ctx.accent }}>Add</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryView({ handle }: { handle: string }) {
  const ctx = useCtx();
  const categories = useStoreData((s) => s.categories);
  const products = useStoreData((s) => s.products.filter((p) => p.status === "Published"));
  const cat = categories.find((c) => c.handle === handle) ?? categories.find((c) => c.id === handle);
  const childIds = new Set<string>();
  if (cat) {
    childIds.add(cat.id);
    // include descendants
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of categories) if (c.parentId && childIds.has(c.parentId) && !childIds.has(c.id)) { childIds.add(c.id); grew = true; }
    }
  }
  const list = cat
    ? products.filter((p) => childIds.has(p.category) || p.category === cat.name || p.category === cat.id)
    : [];

  if (!cat) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="text-lg font-semibold mb-2">Category not found</div>
        <p className="text-sm text-muted-foreground">This category may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="rounded-3xl overflow-hidden border border-white/10 relative"
        style={cat.bannerUrl ? { background: `url(${cat.bannerUrl}) center/cover` } : { background: `linear-gradient(135deg, ${ctx.accent}33, transparent)` }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative p-10">
          <div className="text-xs uppercase tracking-widest text-white/80">Category</div>
          <h1 className="mt-1 text-3xl md:text-5xl font-semibold text-white" style={{ fontFamily: ctx.fontDisplay }}>{cat.name}</h1>
          {cat.description && <p className="mt-2 text-sm text-white/80 max-w-2xl">{cat.description}</p>}
          <div className="mt-3 text-xs text-white/70">{list.length} products</div>
        </div>
      </div>
      <ProductGrid products={list} />
    </div>
  );
}

export function CollectionView({ handle }: { handle: string }) {
  const ctx = useCtx();
  const collections = useStoreData((s) => s.collections);
  const products = useStoreData((s) => s.products.filter((p) => p.status === "Published"));
  const col = collections.find((c) => c.handle === handle) ?? collections.find((c) => c.id === handle);
  if (!col) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="text-lg font-semibold mb-2">Collection not found</div>
      </div>
    );
  }
  const list = products.filter((p) => col.productIds.includes(p.id));
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="rounded-3xl overflow-hidden border border-white/10 relative"
        style={col.bannerUrl || col.imageUrl ? { background: `url(${col.bannerUrl || col.imageUrl}) center/cover` } : { background: `linear-gradient(135deg, ${ctx.accent}33, transparent)` }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative p-10">
          <div className="text-xs uppercase tracking-widest text-white/80">Collection</div>
          <h1 className="mt-1 text-3xl md:text-5xl font-semibold text-white" style={{ fontFamily: ctx.fontDisplay }}>{col.name}</h1>
          {col.description && <p className="mt-2 text-sm text-white/80 max-w-2xl">{col.description}</p>}
          <div className="mt-3 text-xs text-white/70">{list.length} products · {col.kind === "auto" ? "Automated" : "Curated"}</div>
        </div>
      </div>
      <ProductGrid products={list} />
    </div>
  );
}

/* ---------- ROUTER-LIKE DISPATCHER ---------- */

export function StorefrontOverlay() {
  const search = useSearch({ strict: false }) as { view?: string; product?: string; category?: string; collection?: string; order?: string };
  if (search.product) return <ProductDetailView handle={search.product} />;
  if (search.category) return <CategoryView handle={search.category} />;
  if (search.collection) return <CollectionView handle={search.collection} />;
  if (search.view === "order" && search.order) return <OrderConfirmationView orderNumber={search.order} />;
  if (search.view === "cart") return <CartView />;
  if (search.view === "wishlist") return <WishlistView />;
  if (search.view === "checkout") return <CheckoutView />;
  if (search.view === "shop") return <ShopView />;
  return null;
}

