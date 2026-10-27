import { createFileRoute, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Building2, Sparkles, Wallet, UserCog, CreditCard, ShoppingBag, Truck, MapPin,
  Globe, Scale, Save, Check, Plus, Trash2, ExternalLink, Copy, Rocket,
  Mail, Phone, Image as ImageIcon,
} from "lucide-react";
import { useAuthStore, type StorePlan } from "@/lib/auth-store";
import { SETTINGS_NAV } from "@/components/dashboard/nav-config";
import { HelpCenter } from "@/components/dashboard/help-center";
import { cn } from "@/lib/utils";
import { getCountries, getStates, getCities, countryHasStates } from "@/lib/locations-data";
import { Portal } from "@/components/ui/portal";

export const Route = createFileRoute("/store_/$storeId/settings/$")({
  component: SettingsCatchAll,
});

function SettingsCatchAll() {
  const { storeId, _splat } = useParams({ from: "/store_/$storeId/settings/$" });
  const slug = _splat ?? "store-details";
  const meta = SETTINGS_NAV.find((s) => s.slug === slug);
  const title = meta?.label ?? "Settings";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Header title={title} subtitle={subtitleFor(slug)} icon={meta?.icon ?? Building2} />
      {slug === "store-details" && <StoreDetails storeId={storeId} />}
      {slug === "plan" && <PlanPanel storeId={storeId} />}
      {slug === "billing" && <BillingPanel />}
      {slug === "users" && <UsersPanel />}
      {slug === "payments" && <ProvidersPanel providers={["Stripe", "PayPal", "Apple Pay", "Cash on delivery"]} />}
      {slug === "checkout" && <CheckoutPanel />}
      {slug === "shipping" && <ShippingPanel />}
      {slug === "locations" && <LocationsPanel />}
      {slug === "domains" && <DomainsPanel storeId={storeId} />}
      {slug === "policies" && <PoliciesPanel />}
      {slug === "help" && <HelpCenter />}
    </motion.div>
  );
}

function subtitleFor(slug: string): string {
  const map: Record<string, string> = {
    "store-details": "Basic information visible to customers and used in receipts.",
    "plan": "Choose the right plan for your team. Change anytime.",
    "billing": "Manage payment method, invoices and current subscription.",
    "users": "Invite teammates and manage their permissions.",
    "payments": "Enable payment providers and manage payout accounts.",
    "checkout": "Customize checkout behaviour, taxes and communications.",
    "shipping": "Zones, rates and carriers used when fulfilling orders.",
    "locations": "Physical locations used for inventory and pickup.",
    "domains": "Manage the domain your store is served from.",
    "policies": "Legal policies displayed in your storefront footer.",
    "help": "Docs, tutorials, community and a human on the other side.",
  };
  return map[slug] ?? "Configure your store.";
}

function Header({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ---------- Panels ---------- */

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("w-full max-w-full rounded-2xl glass-strong border border-white/[0.06] p-4 sm:p-5 overflow-hidden", className)}>{children}</div>;
}
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 w-full min-w-0 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition", props.className)} />;
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full min-w-0 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 min-h-[90px] resize-y", props.className)} />;
}
function Button({ children, variant = "primary", ...props }: any) {
  const styles = variant === "primary"
    ? "bg-primary-gradient text-primary-foreground shadow-glow"
    : "glass hover:bg-white/10";
  return <button {...props} className={cn("inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium transition", styles, props.className)}>{children}</button>;
}

function StoreDetails({ storeId }: { storeId: string }) {
  const store = useAuthStore((s) => s.stores.find((x) => x.id === storeId));
  const updateStore = useAuthStore((s) => s.updateStore);
  const [name, setName] = useState(store?.name ?? "");
  const [slug, setSlug] = useState(store?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(store?.logoUrl ?? "");
  const [email, setEmail] = useState("hello@" + (store?.slug ?? "store") + ".com");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  if (!store) return null;

  const save = () => {
    updateStore(storeId, { name: name.trim() || store.name, slug: slug.trim() || store.slug, logoUrl: logoUrl || null });
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  };

  return (
    <Card className="space-y-5">
      <div className="grid gap-5 items-start sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="grid gap-2 justify-items-center sm:justify-items-start">
          <div className="h-24 w-24 rounded-2xl bg-primary-gradient overflow-hidden grid place-items-center shrink-0">
            {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-primary-foreground" />}
          </div>
          <Input value={logoUrl ?? ""} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" />
        </div>
        <div className="grid gap-4 min-w-0 sm:grid-cols-2">
          <Row label="Store name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Row>
          <Row label="Handle" hint="Used in your store URL"><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></Row>
          <Row label="Contact email"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Row>
          <Row label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Row>
          <div className="sm:col-span-2 min-w-0">
            <Row label="Business address" hint="Displayed on invoices"><TextArea value={address} onChange={(e) => setAddress(e.target.value)} /></Row>
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button onClick={save} className="w-full sm:w-auto justify-center">{saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save changes</>}</Button>
      </div>
    </Card>
  );
}

function PlanPanel({ storeId }: { storeId: string }) {
  const store = useAuthStore((s) => s.stores.find((x) => x.id === storeId));
  const updateStore = useAuthStore((s) => s.updateStore);
  const plans: { id: StorePlan; name: string; price: string; perks: string[] }[] = [
    { id: "starter", name: "Starter", price: "$0", perks: ["1 store", "Community support", "Basic analytics"] },
    { id: "growth", name: "Growth", price: "$29", perks: ["Unlimited products", "Priority email", "Advanced analytics"] },
    { id: "plus", name: "Plus", price: "$99", perks: ["Multi-currency", "Custom domain", "Automation"] },
    { id: "enterprise", name: "Enterprise", price: "Custom", perks: ["SSO", "SLA", "Dedicated CSM"] },
  ];
  if (!store) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {plans.map((p) => {
        const active = store.plan === p.id;
        return (
          <div key={p.id} className={cn("rounded-2xl glass-strong border border-white/[0.06] p-5 relative", active && "ring-1 ring-primary/40 shadow-glow")}>
            {active && <span className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.14em] rounded-full px-2 py-0.5 bg-primary/15 text-primary">Current</span>}
            <div className="text-sm font-medium">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <div className="font-display text-2xl font-semibold">{p.price}</div>
              <div className="text-[11px] text-muted-foreground">/mo</div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {p.perks.map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300" /> {x}</li>)}
            </ul>
            <button onClick={() => updateStore(storeId, { plan: p.id })}
              disabled={active}
              className={cn("mt-4 w-full h-9 rounded-xl text-xs font-medium transition",
                active ? "glass opacity-60 cursor-default" : "bg-primary-gradient text-primary-foreground shadow-glow")}
            >{active ? "Selected" : "Choose plan"}</button>
          </div>
        );
      })}
    </div>
  );
}

function BillingPanel() {
  const invoices = [
    { id: "INV-2041", date: "Feb 1, 2026", amount: "$29.00", status: "Paid" },
    { id: "INV-2020", date: "Jan 1, 2026", amount: "$29.00", status: "Paid" },
    { id: "INV-1998", date: "Dec 1, 2025", amount: "$29.00", status: "Paid" },
  ];
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 rounded-lg bg-white/5 border border-white/10 grid place-items-center text-xs">VISA</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm">Visa •••• 4242</div>
            <div className="text-xs text-muted-foreground">Expires 04/28 · Default</div>
          </div>
          <Button variant="ghost">Update</Button>
        </div>
      </Card>
      <Card>
        <div className="text-sm font-medium mb-3">Recent invoices</div>
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
            <tr className="border-b border-white/[0.06]"><th className="text-left py-2 px-1">Invoice</th><th className="text-left">Date</th><th className="text-left">Amount</th><th className="text-left">Status</th><th /></tr>
          </thead>
          <tbody>
            {invoices.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04]">
                <td className="py-3 px-1">{r.id}</td><td>{r.date}</td><td>{r.amount}</td>
                <td><span className="text-[11px] rounded-full px-2 py-0.5 bg-emerald-400/10 text-emerald-300">{r.status}</span></td>
                <td className="text-right"><Button variant="ghost"><ExternalLink className="h-3 w-3" /> View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([
    { name: "You", email: "you@aether.co", role: "Owner" },
    { name: "Maren Lund", email: "maren@aether.co", role: "Editor" },
  ]);
  const [invite, setInvite] = useState("");
  return (
    <div className="space-y-5">
      <Card>
        <div className="text-sm font-medium mb-3">Invite a teammate</div>
        <div className="flex gap-2">
          <Input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="teammate@company.com" className="flex-1" />
          <Button onClick={() => { if (invite.trim()) { setUsers((u) => [...u, { name: invite.split("@")[0], email: invite, role: "Editor" }]); setInvite(""); } }}>
            <Plus className="h-3.5 w-3.5" /> Invite
          </Button>
        </div>
      </Card>
      <Card>
        {users.map((u, i) => (
          <div key={u.email} className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-white/[0.04]")}>
            <div className="h-9 w-9 rounded-full bg-primary-gradient grid place-items-center text-primary-foreground text-xs font-medium">{u.name[0]}</div>
            <div className="min-w-0 flex-1"><div className="text-sm">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></div>
            <span className="text-[11px] rounded-full px-2 py-0.5 bg-white/5">{u.role}</span>
            {u.role !== "Owner" && <button onClick={() => setUsers((prev) => prev.filter((x) => x.email !== u.email))} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>
        ))}
      </Card>
    </div>
  );
}

function ProvidersPanel({ providers }: { providers: string[] }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ Stripe: true });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {providers.map((p) => (
        <Card key={p} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-gradient grid place-items-center text-primary-foreground"><CreditCard className="h-4 w-4" /></div>
          <div className="flex-1 min-w-0"><div className="text-sm">{p}</div><div className="text-[11px] text-muted-foreground">{enabled[p] ? "Connected" : "Not connected"}</div></div>
          <button onClick={() => setEnabled((e) => ({ ...e, [p]: !e[p] }))}
            className={cn("h-9 px-3 rounded-xl text-xs font-medium", enabled[p] ? "glass" : "bg-primary-gradient text-primary-foreground shadow-glow")}>
            {enabled[p] ? "Disconnect" : "Connect"}
          </button>
        </Card>
      ))}
    </div>
  );
}

function CheckoutPanel() {
  const [autoTax, setAutoTax] = useState(true);
  const [guest, setGuest] = useState(true);
  const [abandonment, setAbandonment] = useState(true);
  return (
    <Card className="space-y-3">
      <Toggle label="Automatic tax calculation" value={autoTax} onChange={setAutoTax} />
      <Toggle label="Allow guest checkout" value={guest} onChange={setGuest} />
      <Toggle label="Send abandoned cart emails" value={abandonment} onChange={setAbandonment} />
    </Card>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 py-2">
      <button onClick={() => onChange(!value)}
        className={cn("relative h-5 w-9 rounded-full transition", value ? "bg-primary" : "bg-white/10")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition", value ? "left-4" : "left-0.5")} />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}

type ShippingZone = {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  state: string;
  city: string;
  price: number;
  deliveryTime: string;
  freeThreshold: number;
  enabled: boolean;
};

function ShippingPanel() {
  const [zones, setZones] = useState<ShippingZone[]>([
    { id: "z1", name: "Domestic", countryCode: "US", countryName: "United States", state: "California", city: "Los Angeles", price: 5, deliveryTime: "2-4 days", freeThreshold: 75, enabled: true },
    { id: "z2", name: "International", countryCode: "AE", countryName: "United Arab Emirates", state: "Dubai", city: "Dubai", price: 18, deliveryTime: "5-9 days", freeThreshold: 150, enabled: true },
  ]);
  const [editing, setEditing] = useState<ShippingZone | null>(null);

  const openNew = () => setEditing({
    id: "z" + Date.now(), name: "", countryCode: "", countryName: "",
    state: "", city: "", price: 0, deliveryTime: "", freeThreshold: 0, enabled: true,
  });

  const save = (z: ShippingZone, isNew: boolean) => {
    const duplicate = zones.some((x) =>
      x.id !== z.id &&
      x.countryCode === z.countryCode &&
      x.state.trim().toLowerCase() === z.state.trim().toLowerCase() &&
      x.city.trim().toLowerCase() === z.city.trim().toLowerCase()
    );
    if (duplicate) { alert("A shipping zone already exists for this Country / State / City."); return; }
    setZones((prev) => isNew ? [...prev, z] : prev.map((x) => x.id === z.id ? z : x));
    setEditing(null);
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <div className="text-sm font-medium">Shipping zones</div>
            <div className="text-[11px] text-muted-foreground">Configure worldwide delivery by Country, State/Province and City.</div>
          </div>
          <Button onClick={openNew}><Plus className="h-3.5 w-3.5" /> Add zone</Button>
        </div>

        {zones.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No zones yet. Add your first shipping zone to start delivering.</div>
        )}

        <div className="divide-y divide-white/[0.05]">
          {zones.map((z) => (
            <div key={z.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn("h-9 w-9 shrink-0 rounded-xl grid place-items-center",
                  z.enabled ? "bg-primary-gradient text-primary-foreground shadow-glow" : "bg-white/5 text-muted-foreground")}>
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {z.name || "Untitled zone"}
                    {!z.enabled && <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Disabled</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {[z.city, z.state, z.countryName].filter(Boolean).join(" · ") || "No location"}
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                    ${z.price.toFixed(2)} · {z.deliveryTime || "—"}
                    {z.freeThreshold > 0 && ` · Free over $${z.freeThreshold}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Toggle label="" value={z.enabled} onChange={(v) => setZones((prev) => prev.map((x) => x.id === z.id ? { ...x, enabled: v } : x))} />
                <button onClick={() => setEditing(z)} className="h-8 px-3 rounded-lg text-xs glass hover:bg-white/10">Edit</button>
                <button onClick={() => setZones((prev) => prev.filter((x) => x.id !== z.id))}
                  className="h-8 w-8 grid place-items-center rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {editing && (
        <ZoneEditor
          zone={editing}
          isNew={!zones.some((x) => x.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function ZoneEditor({ zone, isNew, onClose, onSave }: {
  zone: ShippingZone; isNew: boolean; onClose: () => void; onSave: (z: ShippingZone, isNew: boolean) => void;
}) {
  const [z, setZ] = useState<ShippingZone>(zone);
  const [err, setErr] = useState<string | null>(null);

  const countries = getCountries();
  const states = z.countryCode ? getStates(z.countryCode) : [];
  const cities = z.countryCode && z.state ? getCities(z.countryCode, z.state) : [];
  const hasStates = z.countryCode ? countryHasStates(z.countryCode) : true;

  const submit = () => {
    if (!z.name.trim()) { setErr("Zone name is required."); return; }
    if (!z.countryCode) { setErr("Please select a country."); return; }
    if (hasStates && !z.state.trim()) { setErr("Please select a state/province."); return; }
    if (!z.city.trim()) { setErr("Please provide a city."); return; }
    if (z.price < 0 || z.freeThreshold < 0) { setErr("Values cannot be negative."); return; }
    setErr(null);
    onSave(z, isNew);
  };

  return (
    <Portal>
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl glass-strong border border-white/[0.08] p-5 space-y-4 my-8">

        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow"><Truck className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-medium">{isNew ? "New shipping zone" : "Edit shipping zone"}</div>
            <div className="text-[11px] text-muted-foreground">Country → State/Province → City</div>
          </div>
        </div>

        <Row label="Zone name">
          <Input value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} placeholder="e.g. Domestic, GCC, Europe" />
        </Row>

        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Country">
            <SearchableSelect
              value={z.countryCode}
              options={countries.map((c) => ({ value: c.code, label: c.name }))}
              placeholder="Select country"
              onChange={(code, label) => setZ({ ...z, countryCode: code, countryName: label ?? "", state: "", city: "" })}
            />
          </Row>
          <Row label="State / Province" hint={!z.countryCode ? "Select a country first" : (!hasStates ? "Not applicable for this country" : undefined)}>
            <SearchableSelect
              value={z.state}
              options={states.map((s) => ({ value: s, label: s }))}
              placeholder={hasStates ? "Select state / province" : "N/A"}
              disabled={!z.countryCode || !hasStates}
              onChange={(v) => setZ({ ...z, state: v, city: "" })}
            />
          </Row>
          <Row label="City" hint={hasStates && !z.state ? "Select a state first" : (cities.length === 0 && z.countryCode ? "Type your city" : undefined)}>
            <SearchableSelect
              value={z.city}
              options={cities.map((c) => ({ value: c, label: c }))}
              placeholder="Select or type city"
              disabled={!z.countryCode || (hasStates && !z.state)}
              allowCustom
              onChange={(v) => setZ({ ...z, city: v })}
            />
          </Row>
          <Row label="Shipping price (USD)">
            <Input type="number" min={0} step="0.01" value={z.price}
              onChange={(e) => setZ({ ...z, price: Number(e.target.value) || 0 })} />
          </Row>
          <Row label="Estimated delivery time">
            <Input value={z.deliveryTime} onChange={(e) => setZ({ ...z, deliveryTime: e.target.value })} placeholder="e.g. 2-4 business days" />
          </Row>
          <Row label="Free shipping threshold (USD)" hint="0 to disable">
            <Input type="number" min={0} step="0.01" value={z.freeThreshold}
              onChange={(e) => setZ({ ...z, freeThreshold: Number(e.target.value) || 0 })} />
          </Row>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Toggle label={z.enabled ? "Zone enabled" : "Zone disabled"} value={z.enabled} onChange={(v) => setZ({ ...z, enabled: v })} />
        </div>

        {err && <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto justify-center">Cancel</Button>
          <Button onClick={submit} className="w-full sm:w-auto justify-center"><Save className="h-3.5 w-3.5" /> Save zone</Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

function SearchableSelect({ value, options, onChange, placeholder, disabled, allowCustom }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string, label?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;
  const filtered = q.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-10 w-full min-w-0 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-left flex items-center justify-between gap-2 transition",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/20 focus:border-primary/40",
        )}
      >
        <span className={cn("truncate", !currentLabel && "text-muted-foreground")}>
          {currentLabel || placeholder || "Select"}
        </span>
        <span className="text-muted-foreground text-xs">▾</span>
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute z-[91] mt-1 w-full rounded-xl glass-strong border border-white/[0.08] shadow-xl overflow-hidden">
            <div className="p-2 border-b border-white/[0.06]">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && allowCustom && q.trim()) {
                    onChange(q.trim(), q.trim()); setOpen(false); setQ("");
                  }
                }}
                placeholder={allowCustom ? "Search or type new…" : "Search…"}
                className="h-8 w-full px-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {allowCustom && q.trim() ? `Press Enter to use "${q.trim()}"` : "No results"}
                </div>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value, o.label); setOpen(false); setQ(""); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-white/[0.06] flex items-center justify-between gap-2",
                    o.value === value && "text-primary",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
              {allowCustom && q.trim() && !filtered.some((o) => o.label.toLowerCase() === q.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => { onChange(q.trim(), q.trim()); setOpen(false); setQ(""); }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/[0.06] text-primary border-t border-white/[0.06]"
                >
                  Use "{q.trim()}"
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type Location = {
  id: string;
  name: string;
  contactPerson: string;
  companyName: string;
  phone: string;
  email: string;
  countryCode: string;
  countryName: string;
  state: string;
  city: string;
  postalCode: string;
  address1: string;
  address2: string;
  landmark: string;
  mapsUrl: string;
  latitude: string;
  longitude: string;
  active: boolean;
  pickup: boolean;
  localDelivery: boolean;
  shipFrom: boolean;
  isDefault: boolean;
};

const EMPTY_LOCATION: Location = {
  id: "", name: "", contactPerson: "", companyName: "", phone: "", email: "",
  countryCode: "", countryName: "", state: "", city: "", postalCode: "",
  address1: "", address2: "", landmark: "", mapsUrl: "", latitude: "", longitude: "",
  active: true, pickup: true, localDelivery: false, shipFrom: true, isDefault: false,
};

function LocationsPanel() {
  const [locs, setLocs] = useState<Location[]>([{
    ...EMPTY_LOCATION,
    id: "l1", name: "Main warehouse", contactPerson: "Ops team", phone: "+1 305 555 0100",
    email: "ops@brand.com", countryCode: "US", countryName: "United States", state: "Florida",
    city: "Miami", postalCode: "33101", address1: "1 Ocean Ave", isDefault: true,
  }]);
  const [editing, setEditing] = useState<Location | null>(null);
  const [viewing, setViewing] = useState<Location | null>(null);

  const save = (loc: Location) => {
    setLocs((prev) => {
      const others = prev.filter((x) => x.id !== loc.id);
      let next = loc.id ? [...others, loc] : [...prev, { ...loc, id: "l" + Date.now() }];
      if (loc.isDefault) next = next.map((x) => ({ ...x, isDefault: x.id === (loc.id || next[next.length - 1].id) }));
      else if (!next.some((x) => x.isDefault) && next.length) next[0].isDefault = true;
      return next;
    });
    setEditing(null);
  };

  const remove = (id: string) => {
    setLocs((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (!next.some((x) => x.isDefault) && next.length) next[0].isDefault = true;
      return next;
    });
    import("sonner").then(({ toast }) => toast.success("Location deleted"));
  };

  const setDefault = (id: string) => {
    setLocs((prev) => prev.map((x) => ({ ...x, isDefault: x.id === id })));
    import("sonner").then(({ toast }) => toast.success("Default location updated"));
  };

  const toggleActive = (id: string) => {
    setLocs((prev) => prev.map((x) => x.id === id ? { ...x, active: !x.active } : x));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <div className="text-sm font-medium">Locations</div>
          <div className="text-[11px] text-muted-foreground">{locs.length} location{locs.length === 1 ? "" : "s"}</div>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY_LOCATION })}><Plus className="h-3.5 w-3.5" /> Add location</Button>
      </div>
      <div className="divide-y divide-white/[0.05]">
        {locs.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No locations yet. Click "Add location" to create one.</div>
        )}
        {locs.map((l) => (
          <div key={l.id} className="py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <MapPin className={cn("h-4 w-4 shrink-0", l.active ? "text-primary" : "text-muted-foreground")} />
            <div className="flex-1 min-w-0">
              <div className="text-sm flex items-center gap-2 flex-wrap">
                <span className="truncate">{l.name}</span>
                {l.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Default</span>}
                {!l.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">Disabled</span>}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {[l.address1, l.city, l.state, l.countryName].filter(Boolean).join(", ") || "No address"}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setViewing(l)} title="View"
                className="h-8 px-2 rounded-lg glass hover:bg-white/10 text-[11px]">View</button>
              <button onClick={() => setEditing(l)} title="Edit"
                className="h-8 px-2 rounded-lg glass hover:bg-white/10 text-[11px]">Edit</button>
              {!l.isDefault && (
                <button onClick={() => setDefault(l.id)} title="Set as default"
                  className="h-8 px-2 rounded-lg glass hover:bg-white/10 text-[11px]">Default</button>
              )}
              <button onClick={() => toggleActive(l.id)} title={l.active ? "Disable" : "Enable"}
                className="h-8 px-2 rounded-lg glass hover:bg-white/10 text-[11px]">{l.active ? "Disable" : "Enable"}</button>
              <button onClick={() => remove(l.id)} title="Delete"
                className="h-8 w-8 grid place-items-center rounded-lg hover:bg-rose-500/10 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <LocationEditor
          initial={editing}
          existing={locs}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {viewing && <LocationViewer loc={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} />}
    </Card>
  );
}

function LocationViewer({ loc, onClose, onEdit }: { loc: Location; onClose: () => void; onEdit: () => void }) {
  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl glass-strong border border-white/10 p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{loc.name}</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="space-y-2 text-sm">
          {loc.contactPerson && <div><span className="text-muted-foreground text-xs">Contact: </span>{loc.contactPerson}</div>}
          {loc.companyName && <div><span className="text-muted-foreground text-xs">Company: </span>{loc.companyName}</div>}
          {loc.phone && <div><span className="text-muted-foreground text-xs">Phone: </span>{loc.phone}</div>}
          {loc.email && <div><span className="text-muted-foreground text-xs">Email: </span>{loc.email}</div>}
          <div><span className="text-muted-foreground text-xs">Address: </span>
            {[loc.address1, loc.address2, loc.landmark, loc.city, loc.state, loc.postalCode, loc.countryName].filter(Boolean).join(", ")}
          </div>
          {(loc.latitude || loc.longitude) && <div><span className="text-muted-foreground text-xs">Coords: </span>{loc.latitude}, {loc.longitude}</div>}
          {loc.mapsUrl && <a href={loc.mapsUrl} target="_blank" rel="noreferrer" className="text-primary text-xs inline-flex items-center gap-1">Open in Maps <ExternalLink className="h-3 w-3" /></a>}
          <div className="flex flex-wrap gap-1 pt-2">
            {loc.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">Active</span>}
            {loc.pickup && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">Pickup</span>}
            {loc.localDelivery && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">Local delivery</span>}
            {loc.shipFrom && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">Ship from</span>}
            {loc.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Default</span>}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

function LocationEditor({ initial, existing, onClose, onSave }: {
  initial: Location; existing: Location[]; onClose: () => void; onSave: (l: Location) => void;
}) {
  const [f, setF] = useState<Location>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Location>(k: K, v: Location[K]) => setF((p) => ({ ...p, [k]: v }));

  const states = f.countryCode ? getStates(f.countryCode) : [];
  const cities = f.countryCode && f.state ? getCities(f.countryCode, f.state) : [];
  const hasStates = f.countryCode ? countryHasStates(f.countryCode) : false;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Location name is required";
    if (!f.address1.trim()) e.address1 = "Address line 1 is required";
    if (!f.countryCode) e.countryCode = "Country is required";
    if (hasStates && !f.state) e.state = "State/Province is required";
    if (f.phone && !/^[+\d][\d\s\-()]{5,20}$/.test(f.phone.trim())) e.phone = "Invalid phone number";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Invalid email address";
    if (f.postalCode && !/^[A-Za-z0-9\s\-]{3,12}$/.test(f.postalCode.trim())) e.postalCode = "Invalid postal code";
    const nameKey = f.name.trim().toLowerCase();
    if (nameKey && existing.some((x) => x.id !== f.id && x.name.trim().toLowerCase() === nameKey)) {
      e.name = "A location with this name already exists";
    }
    const addrKey = [f.address1, f.city, f.state, f.countryCode].join("|").toLowerCase();
    if (f.address1.trim() && existing.some((x) => x.id !== f.id && [x.address1, x.city, x.state, x.countryCode].join("|").toLowerCase() === addrKey)) {
      e.address1 = "This address already exists";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      import("sonner").then(({ toast }) => toast.error("Please fix the errors before saving"));
      return;
    }
    onSave(f);
    import("sonner").then(({ toast }) => toast.success(initial.id ? "Location updated" : "Location created"));
  };

  const countries = getCountries().map((c) => ({ value: c.code, label: c.name }));
  const stateOptions = states.map((s) => ({ value: s, label: s }));
  const cityOptions = cities.map((c) => ({ value: c, label: c }));

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <form onSubmit={submit} className="relative w-full max-w-2xl rounded-2xl glass-strong border border-white/10 max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="text-sm font-medium">{initial.id ? "Edit location" : "Add location"}</div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Location name *">
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Main warehouse" />
              {errors.name && <div className="text-[11px] text-rose-300">{errors.name}</div>}
            </Row>
            <Row label="Contact person">
              <Input value={f.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Jane Doe" />
            </Row>
            <Row label="Company name">
              <Input value={f.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Row>
            <Row label="Phone number">
              <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 000 0000" />
              {errors.phone && <div className="text-[11px] text-rose-300">{errors.phone}</div>}
            </Row>
            <Row label="Email address">
              <Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="ops@brand.com" />
              {errors.email && <div className="text-[11px] text-rose-300">{errors.email}</div>}
            </Row>
            <Row label="Postal / ZIP code">
              <Input value={f.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              {errors.postalCode && <div className="text-[11px] text-rose-300">{errors.postalCode}</div>}
            </Row>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Row label="Country *">
              <SearchableSelect
                value={f.countryCode}
                options={countries}
                placeholder="Select country"
                onChange={(value, label) => setF((p) => ({ ...p, countryCode: value, countryName: label ?? value, state: "", city: "" }))}
              />
              {errors.countryCode && <div className="text-[11px] text-rose-300">{errors.countryCode}</div>}
            </Row>
            <Row label={`State / Province${hasStates ? " *" : ""}`}>
              <SearchableSelect
                value={f.state}
                options={stateOptions}
                placeholder={f.countryCode ? (hasStates ? "Select state" : "Type state") : "Select country first"}
                disabled={!f.countryCode}
                allowCustom={!hasStates}
                onChange={(value) => setF((p) => ({ ...p, state: value, city: "" }))}
              />
              {errors.state && <div className="text-[11px] text-rose-300">{errors.state}</div>}
            </Row>
            <Row label="City">
              <SearchableSelect
                value={f.city}
                options={cityOptions}
                placeholder={f.state ? (cityOptions.length ? "Select city" : "Type city") : "Select state first"}
                disabled={!f.countryCode || (hasStates && !f.state)}
                allowCustom
                onChange={(value) => set("city", value)}
              />
            </Row>
          </div>

          <div className="grid gap-3">
            <Row label="Address line 1 *">
              <Input value={f.address1} onChange={(e) => set("address1", e.target.value)} placeholder="Street, building" />
              {errors.address1 && <div className="text-[11px] text-rose-300">{errors.address1}</div>}
            </Row>
            <Row label="Address line 2">
              <Input value={f.address2} onChange={(e) => set("address2", e.target.value)} placeholder="Apt, suite (optional)" />
            </Row>
            <div className="grid gap-3 sm:grid-cols-2">
              <Row label="Landmark">
                <Input value={f.landmark} onChange={(e) => set("landmark", e.target.value)} />
              </Row>
              <Row label="Google Maps URL">
                <Input value={f.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} placeholder="https://maps.google.com/…" />
              </Row>
              <Row label="Latitude">
                <Input value={f.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="25.2048" />
              </Row>
              <Row label="Longitude">
                <Input value={f.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="55.2708" />
              </Row>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Location settings</div>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Toggle label="Active location" value={f.active} onChange={(v) => set("active", v)} />
              <Toggle label="Pickup available" value={f.pickup} onChange={(v) => set("pickup", v)} />
              <Toggle label="Local delivery available" value={f.localDelivery} onChange={(v) => set("localDelivery", v)} />
              <Toggle label="Ship from this location" value={f.shipFrom} onChange={(v) => set("shipFrom", v)} />
              <Toggle label="Use as default location" value={f.isDefault} onChange={(v) => set("isDefault", v)} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/[0.06] flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit"><Save className="h-3.5 w-3.5" /> Save location</Button>
        </div>
      </form>
    </div>
    </Portal>
  );
}

function DomainsPanel({ storeId }: { storeId: string }) {
  const store = useAuthStore((s) => s.stores.find((x) => x.id === storeId));
  if (!store) return null;
  const primary = `${store.slug}.aether.app`;
  return (
    <div className="space-y-3">
      <Card className="flex items-center gap-3">
        <Globe className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-sm">{primary}</div>
          <div className="text-[11px] text-muted-foreground">Primary domain · SSL active</div>
        </div>
        <button onClick={() => navigator.clipboard?.writeText(primary)}
          className="h-9 w-9 grid place-items-center rounded-xl glass hover:bg-white/10"><Copy className="h-3.5 w-3.5" /></button>
      </Card>
      <Card>
        <div className="text-sm font-medium mb-2">Connect a custom domain</div>
        <div className="flex gap-2">
          <Input placeholder="www.yourbrand.com" className="flex-1" />
          <Button><Rocket className="h-3.5 w-3.5" /> Connect</Button>
        </div>
      </Card>
    </div>
  );
}

function PoliciesPanel() {
  const [pol, setPol] = useState({
    refund: "We offer a 30-day return policy for unopened products.",
    privacy: "We collect information necessary to process orders and improve your experience.",
    terms: "By using this store you agree to our terms and conditions.",
    shipping: "Orders ship within 1–3 business days. Delivery times vary by region.",
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(pol) as (keyof typeof pol)[]).map((k) => (
        <Card key={k} className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /><div className="text-sm capitalize">{k} policy</div></div>
          <TextArea value={pol[k]} onChange={(e) => setPol({ ...pol, [k]: e.target.value })} className="min-h-[140px]" />
        </Card>
      ))}
    </div>
  );
}
