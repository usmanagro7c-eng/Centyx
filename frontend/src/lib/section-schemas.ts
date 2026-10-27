import type { SectionType } from "@/lib/template-kits";

export type FieldKind =
  | "text" | "textarea" | "image" | "button" | "list"
  | "color" | "toggle" | "select" | "url" | "number";

export type Field = {
  key: string;
  kind: FieldKind;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  itemFields?: Field[];
  itemDefault?: () => any;
  itemLabelKey?: string;
  min?: number; max?: number; step?: number;
};

export type SectionSchema = { fields: Field[]; defaults: Record<string, any> };

const CTA = { label: "", url: "", newTab: false };
const twoCTAs = (): Field[] => [
  { key: "primaryCta", kind: "button", label: "Primary button" },
  { key: "secondaryCta", kind: "button", label: "Secondary button" },
];
const head3 = (): Field[] => [
  { key: "eyebrow", kind: "text", label: "Eyebrow" },
  { key: "title", kind: "text", label: "Title" },
  { key: "body", kind: "textarea", label: "Body", rows: 3 },
];
const heading = (): Field[] => [
  { key: "eyebrow", kind: "text", label: "Eyebrow" },
  { key: "title", kind: "text", label: "Title" },
];

const listField = (
  key: string, label: string, itemFields: Field[], itemDefault: () => any, itemLabelKey = "title",
): Field => ({ key, kind: "list", label, itemFields, itemDefault, itemLabelKey });

export const SCHEMAS: Partial<Record<SectionType, SectionSchema>> = {
  "hero-simple": {
    fields: [...head3(), ...twoCTAs()],
    defaults: { eyebrow: "Section", title: "Page title", body: "A short description of what this page is about.", primaryCta: { ...CTA }, secondaryCta: { ...CTA } },
  },
  "hero-fashion": {
    fields: [...head3(), { key: "image", kind: "image", label: "Hero image" }, ...twoCTAs()],
    defaults: { eyebrow: "Drop 07 · Live now", title: "MOVE\nDIFFERENT", body: "Technical outerwear built for the city at night. Limited to 300 pieces.", image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200&auto=format&fit=crop", primaryCta: { label: "Shop the drop", url: "#" }, secondaryCta: { label: "Watch film", url: "#" } },
  },
  "hero-luxury": {
    fields: [...head3(), ...twoCTAs()],
    defaults: { eyebrow: "Maison · Est. 1902", title: "Objects made\nto be inherited.", body: "Bespoke leather goods, cut and stitched by hand in our Florentine atelier.", primaryCta: { label: "Discover collection", url: "#" }, secondaryCta: { label: "Book atelier visit", url: "#" } },
  },
  "hero-electronics": {
    fields: [...head3(), ...twoCTAs(),
      listField("stats", "Stats", [
        { key: "value", kind: "text", label: "Value" },
        { key: "label", kind: "text", label: "Label" },
      ], () => ({ value: "10x", label: "Faster" }), "label"),
    ],
    defaults: {
      eyebrow: "New · Pulse Pro X", title: "Engineered to disappear.",
      body: "Titanium chassis. 42-hour battery. Studio-grade drivers. Available in three finishes.",
      primaryCta: { label: "Buy — $329", url: "#" }, secondaryCta: { label: "Compare models", url: "#" },
      stats: [{ value: "42h", label: "Battery" }, { value: "<9ms", label: "Latency" }, { value: "IP67", label: "Rated" }],
    },
  },
  "hero-restaurant": {
    fields: [...head3(), { key: "image", kind: "image", label: "Background image" }, ...twoCTAs()],
    defaults: { eyebrow: "Trattoria · Since 1972", title: "Sable & Smoke", body: "A wood-fired kitchen tucked into a converted grain mill. Six-course tasting menu nightly.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&auto=format&fit=crop", primaryCta: { label: "Reserve a table", url: "#" }, secondaryCta: { label: "View menu", url: "#" } },
  },
  "hero-medical": {
    fields: [...head3(), ...twoCTAs()],
    defaults: { eyebrow: "Vitals · Family Health", title: "Care that shows up.", body: "Same-day appointments, transparent pricing, and a team that actually returns calls.", primaryCta: { label: "Book appointment", url: "#" }, secondaryCta: { label: "Meet the doctors", url: "#" } },
  },
  "hero-corporate": {
    fields: [...head3(), ...twoCTAs()],
    defaults: { eyebrow: "Orbit · Platform", title: "The operating system for modern operations.", body: "Unify sales, finance, and ops in one platform. Deployed by 1,200+ teams.", primaryCta: { label: "Start free trial", url: "#" }, secondaryCta: { label: "Book a demo", url: "#" } },
  },
  "hero-portfolio": {
    fields: [...head3()],
    defaults: { eyebrow: "Independent designer", title: "Quinn Vasquez.\nBrand · Motion · Web.", body: "Currently @ Field Studio · Available Q3 2026 · Brooklyn, NY" },
  },
  "hero-agency": {
    fields: [...head3()],
    defaults: { eyebrow: "Kinetic · Independent studio", title: "We build\nmomentum.", body: "Brand systems, motion identities, and interactive stories for ambitious teams." },
  },
  "hero-beauty": {
    fields: [...head3(), { key: "image", kind: "image", label: "Product image" }, ...twoCTAs()],
    defaults: { eyebrow: "Lumen · Skin", title: "The five-step ritual for luminous skin.", body: "Clean formulas. Clinical results. Every ingredient disclosed.", image: "", primaryCta: { label: "Shop the ritual", url: "#" }, secondaryCta: { label: "Take the quiz", url: "#" } },
  },
  "hero-realestate": {
    fields: [...head3(), { key: "image", kind: "image", label: "Background" }],
    defaults: { eyebrow: "Brix · Homes", title: "Find the address you've been picturing.", body: "", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop" },
  },
  "hero-furniture": {
    fields: [...head3(), ...twoCTAs()],
    defaults: { eyebrow: "Hearth · Autumn 26", title: "Rooms that hold a life.", body: "Sofas, tables, and beds — made by hand in North Carolina, delivered in weeks not months.", primaryCta: { label: "Shop rooms", url: "#" }, secondaryCta: { label: "Book a designer", url: "#" } },
  },
  "hero-education": {
    fields: [...head3(), ...twoCTAs(),
      listField("badges", "Badges", [{ key: "title", kind: "text", label: "Badge" }], () => ({ title: "New badge" })),
    ],
    defaults: { eyebrow: "Campus · Learn anything", title: "Skills that compound. Courses that finish.", body: "Bite-sized courses from working practitioners. Cohort-based when it matters, self-paced when it doesn't.", primaryCta: { label: "Browse courses", url: "#" }, secondaryCta: { label: "How it works", url: "#" }, badges: [{ title: "120k+ learners" }, { title: "4.8★ rated" }, { title: "350+ courses" }, { title: "Cert on complete" }] },
  },

  banner: {
    fields: [{ key: "text", kind: "text", label: "Text" }, { key: "url", kind: "url", label: "Link URL" }],
    defaults: { text: "Free shipping this weekend · Use code AETHER", url: "" },
  },

  cta: {
    fields: [{ key: "title", kind: "text", label: "Title" }, { key: "body", kind: "textarea", label: "Body", rows: 2 }, ...twoCTAs()],
    defaults: { title: "Ready when you are.", body: "Start free, upgrade when it clicks. No credit card required.", primaryCta: { label: "Get started", url: "#" }, secondaryCta: { label: "Talk to sales", url: "#" } },
  },

  newsletter: {
    fields: [...heading(), { key: "placeholder", kind: "text", label: "Placeholder" }, { key: "ctaLabel", kind: "text", label: "Button label" }],
    defaults: { eyebrow: "Stay in the loop", title: "Get notified when new drops go live", placeholder: "you@domain.com", ctaLabel: "Subscribe" },
  },

  countdown: {
    fields: [...heading(), { key: "date", kind: "text", label: "Target date (ISO)" }],
    defaults: { eyebrow: "Launching soon", title: "The drop begins in", date: "2026-12-31T00:00:00Z" },
  },

  "featured-collections": {
    fields: [...heading(),
      listField("items", "Collections", [
        { key: "name", kind: "text", label: "Name" },
        { key: "meta", kind: "text", label: "Meta" },
        { key: "image", kind: "image", label: "Image" },
        { key: "url", kind: "url", label: "Link" },
      ], () => ({ name: "New collection", meta: "12 pieces", image: "", url: "#" }), "name"),
    ],
    defaults: { eyebrow: "Collections", title: "Shop by story", items: [
      { name: "Nightshift", meta: "18 pieces", image: "", url: "#" },
      { name: "Off-grid", meta: "12 pieces", image: "", url: "#" },
      { name: "Studio", meta: "9 pieces", image: "", url: "#" },
    ]},
  },

  lookbook: {
    fields: [...heading(),
      listField("images", "Images", [{ key: "url", kind: "image", label: "Image" }], () => ({ url: "" }), "url"),
    ],
    defaults: { eyebrow: "Lookbook", title: "SS26 · In motion", images: Array.from({ length: 10 }, () => ({ url: "" })) },
  },

  instagram: {
    fields: [
      { key: "handle", kind: "text", label: "Handle" }, { key: "title", kind: "text", label: "Title" },
      listField("images", "Images", [{ key: "url", kind: "image", label: "Image" }], () => ({ url: "" }), "url"),
    ],
    defaults: { handle: "@aether.runner", title: "Follow along", images: Array.from({ length: 12 }, () => ({ url: "" })) },
  },

  "product-comparison": {
    fields: [...heading(),
      listField("columns", "Columns", [{ key: "title", kind: "text", label: "Name" }], () => ({ title: "New" })),
      listField("rows", "Rows", [
        { key: "label", kind: "text", label: "Row label" },
        { key: "a", kind: "text", label: "Col 1" },
        { key: "b", kind: "text", label: "Col 2" },
        { key: "c", kind: "text", label: "Col 3" },
      ], () => ({ label: "Spec", a: "-", b: "-", c: "-" }), "label"),
    ],
    defaults: { eyebrow: "Compare", title: "Pick your Pulse",
      columns: [{ title: "Pro X" }, { title: "Standard" }, { title: "Lite" }],
      rows: [
        { label: "Battery", a: "42 hr", b: "28 hr", c: "18 hr" },
        { label: "Weight", a: "221 g", b: "198 g", c: "174 g" },
        { label: "Drivers", a: "40 mm", b: "36 mm", c: "32 mm" },
        { label: "Water", a: "IP67", b: "IP54", c: "—" },
        { label: "Price", a: "$329", b: "$229", c: "$149" },
      ],
    },
  },

  "featured-gadgets": {
    fields: [...heading(),
      listField("items", "Items", [
        { key: "title", kind: "text", label: "Name" },
        { key: "description", kind: "textarea", label: "Description", rows: 2 },
        { key: "price", kind: "text", label: "Price" },
        { key: "image", kind: "image", label: "Image" },
      ], () => ({ title: "New item", description: "Short description.", price: "$199", image: "" })),
    ],
    defaults: { eyebrow: "Editors picks", title: "Featured", items: [
      { title: "Item 1", description: "Short description of the product or listing.", price: "$199", image: "" },
      { title: "Item 2", description: "Short description of the product or listing.", price: "$249", image: "" },
      { title: "Item 3", description: "Short description of the product or listing.", price: "$299", image: "" },
    ]},
  },

  "categories-grid": {
    fields: [...heading(),
      listField("items", "Categories", [
        { key: "name", kind: "text", label: "Name" },
        { key: "url", kind: "url", label: "Link" },
      ], () => ({ name: "New category", url: "#" }), "name"),
    ],
    defaults: { eyebrow: "Browse", title: "Shop by category", items: [
      { name: "Audio", url: "#" }, { name: "Wearables", url: "#" }, { name: "Home", url: "#" },
      { name: "Mobile", url: "#" }, { name: "Cameras", url: "#" }, { name: "Gaming", url: "#" },
    ]},
  },

  products: {
    fields: [...heading(),
      listField("items", "Products", [
        { key: "name", kind: "text", label: "Name" },
        { key: "price", kind: "text", label: "Price" },
        { key: "image", kind: "image", label: "Image" },
        { key: "url", kind: "url", label: "Link" },
      ], () => ({ name: "New product", price: "$99", image: "", url: "#" }), "name"),
    ],
    defaults: { eyebrow: "Shop", title: "All pieces", items: Array.from({ length: 8 }, (_, i) => ({ name: `Product ${i + 1}`, price: `$${89 + i * 20}`, image: "", url: "#" })) },
  },

  pricing: {
    fields: [...heading(),
      listField("plans", "Plans", [
        { key: "name", kind: "text", label: "Name" },
        { key: "price", kind: "text", label: "Price" },
        { key: "period", kind: "text", label: "Period" },
        { key: "features", kind: "textarea", label: "Features (one per line)", rows: 4 },
        { key: "highlighted", kind: "toggle", label: "Highlighted" },
        { key: "ctaLabel", kind: "text", label: "CTA label" },
        { key: "ctaUrl", kind: "url", label: "CTA URL" },
      ], () => ({ name: "New plan", price: "$0", period: "/mo", features: "Feature one\nFeature two", highlighted: false, ctaLabel: "Choose plan", ctaUrl: "#" }), "name"),
    ],
    defaults: { eyebrow: "Pricing", title: "Simple, honest pricing", plans: [
      { name: "Starter", price: "$0", period: "/mo", features: "1 project\nCommunity support", highlighted: false, ctaLabel: "Choose Starter", ctaUrl: "#" },
      { name: "Pro", price: "$29", period: "/mo", features: "Unlimited projects\nPriority support\nTeam features", highlighted: true, ctaLabel: "Choose Pro", ctaUrl: "#" },
      { name: "Studio", price: "$99", period: "/mo", features: "Everything in Pro\nWhite label\nSSO", highlighted: false, ctaLabel: "Choose Studio", ctaUrl: "#" },
    ]},
  },

  "food-menu": {
    fields: [...heading(),
      listField("sections", "Menu sections", [
        { key: "name", kind: "text", label: "Section name" },
        listField("items", "Items", [
          { key: "name", kind: "text", label: "Dish" },
          { key: "description", kind: "text", label: "Description" },
          { key: "price", kind: "text", label: "Price" },
        ], () => ({ name: "New dish", description: "", price: "10" }), "name"),
      ], () => ({ name: "New section", items: [] }), "name"),
    ],
    defaults: { eyebrow: "Tonight", title: "The menu", sections: [
      { name: "To start", items: [
        { name: "Grilled focaccia", description: "charred rosemary oil", price: "9" },
        { name: "Beet tartare", description: "horseradish, rye", price: "14" },
        { name: "Burrata", description: "stone fruit, basil", price: "16" },
      ]},
      { name: "Mains", items: [
        { name: "Wood-fired branzino", description: "fennel, lemon", price: "38" },
        { name: "Braised short rib", description: "polenta, marrow", price: "42" },
        { name: "Handmade tagliatelle", description: "brown butter, sage", price: "28" },
      ]},
      { name: "Sweet", items: [
        { name: "Olive oil cake", description: "citrus, sea salt", price: "12" },
        { name: "Affogato", description: "espresso, vanilla", price: "10" },
      ]},
    ]},
  },

  chef: {
    fields: [...head3(), { key: "quote", kind: "textarea", label: "Quote", rows: 2 }, { key: "image", kind: "image", label: "Portrait" }],
    defaults: { eyebrow: "Our kitchen", title: "Chef Elena Marchetti", body: "Trained in Modena, Elena spent a decade with Bottura before returning home to open the trattoria. Her cooking is rooted in memory and market.", quote: "I cook the food I want to eat with the people I love.", image: "" },
  },

  "opening-hours": {
    fields: [...heading(),
      listField("days", "Hours", [
        { key: "label", kind: "text", label: "Day" },
        { key: "hours", kind: "text", label: "Hours" },
      ], () => ({ label: "Monday", hours: "Closed" }), "label"),
      { key: "address", kind: "textarea", label: "Address / contact", rows: 2 },
    ],
    defaults: { eyebrow: "Visit", title: "Hours", days: [
      { label: "Monday", hours: "Closed" },
      { label: "Tue – Thu", hours: "17:30 – 22:30" },
      { label: "Fri – Sat", hours: "17:30 – 23:30" },
      { label: "Sunday", hours: "12:00 – 21:00" },
    ], address: "14 Riverbank Ln · Portland, OR · +1 (555) 219-4444" },
  },

  "reservation-form": {
    fields: [...heading(),
      listField("fields", "Fields", [{ key: "label", kind: "text", label: "Field label" }],
        () => ({ label: "New field" }), "label"),
      { key: "ctaLabel", kind: "text", label: "Button label" },
    ],
    defaults: { eyebrow: "Book a table", title: "Reserve",
      fields: ["Party size", "Date", "Time", "Occasion", "Name", "Phone"].map((label) => ({ label })),
      ctaLabel: "Request reservation" },
  },

  doctors: {
    fields: [...heading(),
      listField("items", "Doctors", [
        { key: "name", kind: "text", label: "Name" },
        { key: "specialty", kind: "text", label: "Specialty" },
        { key: "image", kind: "image", label: "Photo" },
      ], () => ({ name: "Dr. New", specialty: "General", image: "" }), "name"),
    ],
    defaults: { eyebrow: "Our team", title: "Doctors on staff", items: [
      { name: "Dr. Amara Chen", specialty: "Family medicine", image: "" },
      { name: "Dr. Luis Ortega", specialty: "Pediatrics", image: "" },
      { name: "Dr. Priya Rao", specialty: "Cardiology", image: "" },
      { name: "Dr. Sam Al-Hadi", specialty: "Dermatology", image: "" },
    ]},
  },

  "appointment-form": {
    fields: [...heading(),
      listField("fields", "Fields", [{ key: "label", kind: "text", label: "Field label" }],
        () => ({ label: "New field" }), "label"),
      { key: "ctaLabel", kind: "text", label: "Button label" },
    ],
    defaults: { eyebrow: "Book online", title: "Appointment request",
      fields: ["Full name","Date of birth","Insurance","Reason for visit","Preferred date","Preferred time"].map((label) => ({ label })),
      ctaLabel: "Submit request" },
  },

  services: {
    fields: [...heading(),
      listField("items", "Services", [
        { key: "name", kind: "text", label: "Service" },
        { key: "description", kind: "textarea", label: "Description", rows: 2 },
      ], () => ({ name: "New service", description: "" }), "name"),
    ],
    defaults: { eyebrow: "What we do", title: "Services", items: [
      { name: "Strategy", description: "One-line description of the offering and typical engagement shape." },
      { name: "Brand identity", description: "One-line description of the offering and typical engagement shape." },
      { name: "Product design", description: "One-line description of the offering and typical engagement shape." },
      { name: "Web engineering", description: "One-line description of the offering and typical engagement shape." },
      { name: "Motion", description: "One-line description of the offering and typical engagement shape." },
      { name: "Systems", description: "One-line description of the offering and typical engagement shape." },
    ]},
  },

  team: {
    fields: [...heading(),
      listField("items", "People", [
        { key: "name", kind: "text", label: "Name" },
        { key: "role", kind: "text", label: "Role" },
        { key: "image", kind: "image", label: "Photo" },
      ], () => ({ name: "New person", role: "Role · Location", image: "" }), "name"),
    ],
    defaults: { eyebrow: "Studio", title: "Team", items: ["Alex Rivera","Sam Cho","Kira Patel","Jordan Ng","Mila Weber","Theo Adeyemi"].map((n) => ({ name: n, role: "Role · Location", image: "" })) },
  },

  testimonials: {
    fields: [...heading(),
      listField("items", "Quotes", [
        { key: "quote", kind: "textarea", label: "Quote", rows: 2 },
        { key: "author", kind: "text", label: "Author" },
      ], () => ({ quote: "A great quote.", author: "Someone" }), "author"),
    ],
    defaults: { eyebrow: "What clients say", title: "Testimonials", items: [
      { quote: "Fastest ship of our year. Design carried the launch.", author: "Head of Product, Northwind" },
      { quote: "They built a system we still use two years later.", author: "CEO, Meridian" },
      { quote: "Made our team look 3× bigger than we are.", author: "Founder, Fable" },
    ]},
  },

  "portfolio-grid": {
    fields: [...heading(),
      listField("items", "Projects", [
        { key: "title", kind: "text", label: "Title" },
        { key: "meta", kind: "text", label: "Meta" },
        { key: "image", kind: "image", label: "Cover" },
        { key: "url", kind: "url", label: "Link" },
      ], () => ({ title: "New project", meta: "Brand · 2026", image: "", url: "#" })),
    ],
    defaults: { eyebrow: "Selected work", title: "Recent projects", items: Array.from({ length: 6 }, (_, i) => ({ title: `Project ${i + 1}`, meta: "Brand · 2026", image: "", url: "#" })) },
  },

  timeline: {
    fields: [...heading(),
      listField("items", "Events", [
        { key: "year", kind: "text", label: "Year" },
        { key: "title", kind: "text", label: "Title" },
      ], () => ({ year: "2026", title: "New event" })),
    ],
    defaults: { eyebrow: "History", title: "Timeline", items: [
      { year: "2018", title: "Founded in Brooklyn" },
      { year: "2020", title: "Shipped Version 2" },
      { year: "2022", title: "30-person team" },
      { year: "2024", title: "Opened Berlin studio" },
      { year: "2026", title: "Launching Aether OS" },
    ]},
  },

  "case-studies": {
    fields: [...heading(),
      listField("items", "Case studies", [
        { key: "client", kind: "text", label: "Client" },
        { key: "year", kind: "text", label: "Year" },
        { key: "title", kind: "text", label: "Headline" },
        { key: "image", kind: "image", label: "Image" },
        { key: "m1v", kind: "text", label: "Metric 1 value" },
        { key: "m1l", kind: "text", label: "Metric 1 label" },
        { key: "m2v", kind: "text", label: "Metric 2 value" },
        { key: "m2l", kind: "text", label: "Metric 2 label" },
        { key: "m3v", kind: "text", label: "Metric 3 value" },
        { key: "m3l", kind: "text", label: "Metric 3 label" },
      ], () => ({ client: "New client", year: "2026", title: "New case study", image: "", m1v: "+50%", m1l: "Growth", m2v: "-20%", m2l: "Churn", m3v: "5.0", m3l: "CSAT" }), "client"),
    ],
    defaults: { eyebrow: "Case studies", title: "Selected work with numbers", items: [
      { client: "Client 1", year: "2026", title: "Rebuilt onboarding, doubled activation.", image: "", m1v: "+124%", m1l: "Activation", m2v: "-38%", m2l: "Time to value", m3v: "4.9", m3l: "CSAT" },
      { client: "Client 2", year: "2026", title: "Redesigned marketing, tripled leads.", image: "", m1v: "+310%", m1l: "Leads", m2v: "+92%", m2l: "MQL rate", m3v: "4.8", m3l: "CSAT" },
      { client: "Client 3", year: "2026", title: "Launched a new SKU in six weeks.", image: "", m1v: "6 wk", m1l: "Time to launch", m2v: "12k", m2l: "Pre-orders", m3v: "4.7", m3l: "CSAT" },
    ]},
  },

  gallery: {
    fields: [
      listField("images", "Images", [{ key: "url", kind: "image", label: "Image" }, { key: "alt", kind: "text", label: "Alt" }],
        () => ({ url: "", alt: "" }), "alt"),
    ],
    defaults: { images: Array.from({ length: 9 }, () => ({ url: "", alt: "" })) },
  },

  video: {
    fields: [...heading(), { key: "videoUrl", kind: "url", label: "Video URL (embed)" }, { key: "poster", kind: "image", label: "Poster" }],
    defaults: { eyebrow: "Watch", title: "Studio reel", videoUrl: "", poster: "" },
  },

  faq: {
    fields: [...heading(),
      listField("items", "Questions", [
        { key: "q", kind: "text", label: "Question" },
        { key: "a", kind: "textarea", label: "Answer", rows: 2 },
      ], () => ({ q: "New question?", a: "Answer here." }), "q"),
    ],
    defaults: { eyebrow: "Support", title: "Frequently asked", items: [
      { q: "Do you offer refunds?", a: "30-day returns on unused items." },
      { q: "Do you ship internationally?", a: "Yes, to 60+ countries." },
      { q: "Can I request a custom order?", a: "For orders over 20 units, absolutely." },
      { q: "Where are you based?", a: "Portland, OR with a studio in Berlin." },
    ]},
  },

  "contact-form": {
    fields: [...heading(),
      listField("fields", "Fields", [{ key: "label", kind: "text", label: "Label" }], () => ({ label: "New field" }), "label"),
      { key: "ctaLabel", kind: "text", label: "Button label" },
    ],
    defaults: { eyebrow: "Contact", title: "Send us a note", fields: ["Name","Email","Subject","Message"].map((label) => ({ label })), ctaLabel: "Send message" },
  },

  map: {
    fields: [{ key: "address", kind: "textarea", label: "Address", rows: 2 }],
    defaults: { address: "" },
  },

  "text-block": {
    fields: [{ key: "title", kind: "text", label: "Heading" }, { key: "body", kind: "textarea", label: "Body", rows: 8 }],
    defaults: { title: "Section heading", body: "Add long-form copy here. This block is perfect for policies, terms, or extended narratives." },
  },

  "featured-products": {
    fields: [...heading(), { key: "limit", kind: "number", label: "Max items", min: 2, max: 24, step: 1 }],
    defaults: { eyebrow: "Featured", title: "Editor's picks", limit: 8 },
  },
  "new-arrivals": {
    fields: [...heading(), { key: "limit", kind: "number", label: "Max items", min: 2, max: 24, step: 1 }],
    defaults: { eyebrow: "Just in", title: "New arrivals", limit: 8 },
  },
  "best-sellers": {
    fields: [...heading(), { key: "limit", kind: "number", label: "Max items", min: 2, max: 24, step: 1 }],
    defaults: { eyebrow: "Top selling", title: "Best sellers", limit: 8 },
  },
  "collections-showcase": {
    fields: [...heading(), { key: "limit", kind: "number", label: "Max collections", min: 2, max: 12, step: 1 }],
    defaults: { eyebrow: "Explore", title: "Shop by collection", limit: 6 },
  },
  "promo-banner": {
    fields: [...head3(), { key: "button", kind: "button", label: "Button" }],
    defaults: { eyebrow: "Limited time", title: "Free shipping this weekend", body: "Use code AETHER at checkout.", button: { label: "Shop now", url: "" } },
  },
};

export function getSchema(type: SectionType): SectionSchema {
  return SCHEMAS[type] ?? { fields: [], defaults: {} };
}

export function mergeDefaults(type: SectionType, props: Record<string, any> | undefined): Record<string, any> {
  const d = getSchema(type).defaults;
  const merged: Record<string, any> = { ...d, ...(props ?? {}) };
  // Ensure list defaults exist when props omit them
  for (const k of Object.keys(d)) {
    if (Array.isArray(d[k]) && !Array.isArray(merged[k])) merged[k] = d[k];
  }
  return merged;
}
