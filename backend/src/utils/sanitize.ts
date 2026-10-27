const ALLOWED_DOCTYPES = new Set([
  "Item",
  "Item Group",
  "Bin",
  "Sales Order",
  "Purchase Order",
  "Purchase Invoice",
  "Sales Invoice",
  "Gift Card",
  "Customer",
  "User",
  "Web Page",
  "Company",
  "Warehouse",
  "Delivery Note",
  "Sales Invoice Item",
  "Sales Order Item",
  "Purchase Invoice Item",
  "Purchase Order Item",
]);

const ALLOWED_METHODS = new Set([
  "login",
  "logout",
  "frappe.auth.get_logged_user",
  "frappe.client.get_count",
  "frappe.client.submit",
  "frappe.client.set_value",
  "frappe.client.cancel",
  "frappe.model.workflow.apply_workflow",
]);

const SAFE_FIELDS: Record<string, string[]> = {
  Item: [
    "name",
    "item_code",
    "item_name",
    "item_group",
    "description",
    "standard_rate",
    "is_stock_item",
    "has_variants",
    "variant_of",
    "brand",
    "weight_per_unit",
    "weight_uom",
    "stock_uom",
    "image",
    "disabled",
    "creation",
    "modified",
  ],
  "Item Group": ["name", "item_group_name", "parent_item_group", "is_group", "image"],
  Bin: ["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "ordered_qty", "projected_qty"],
  "Sales Order": [
    "name",
    "customer",
    "customer_name",
    "transaction_date",
    "delivery_date",
    "status",
    "docstatus",
    "total",
    "grand_total",
    "currency",
    "items",
    "creation",
    "modified",
    "owner",
    "company",
    "shipping_address_name",
    "contact_email",
    "contact_mobile",
    "delivery_note",
    "sales_invoice",
  ],
  "Purchase Order": [
    "name",
    "supplier",
    "supplier_name",
    "transaction_date",
    "schedule_date",
    "status",
    "grand_total",
    "total",
    "currency",
    "items",
    "creation",
    "modified",
  ],
  "Purchase Invoice": [
    "name",
    "supplier",
    "supplier_name",
    "company",
    "currency",
    "posting_date",
    "due_date",
    "bill_no",
    "bill_date",
    "net_total",
    "total_taxes_and_charges",
    "discount_amount",
    "grand_total",
    "rounded_total",
    "paid_amount",
    "outstanding_amount",
    "status",
    "docstatus",
    "is_return",
    "update_stock",
    "set_warehouse",
    "payment_terms_template",
    "remarks",
    "terms",
    "creation",
    "modified",
  ],
  "Sales Invoice": [
    "name",
    "owner",
    "creation",
    "modified",
    "modified_by",
    "docstatus",
    "customer",
    "customer_name",
    "company",
    "posting_date",
    "posting_time",
    "due_date",
    "status",
    "currency",
    "conversion_rate",
    "total_qty",
    "total",
    "net_total",
    "grand_total",
    "rounded_total",
    "outstanding_amount",
    "discount_amount",
    "additional_discount_percentage",
    "debit_to",
    "territory",
    "customer_group",
    "payment_terms_template",
    "shipping_address_name",
    "contact_person",
    "contact_email",
    "remarks",
  ],
  "Gift Card": [
    "name",
    "gift_card_number",
    "customer",
    "customer_name",
    "balance",
    "initial_balance",
    "status",
    "expiry_date",
    "issue_date",
    "currency",
    "conversion_rate",
    "company",
    "creation",
    "modified",
    "owner",
    "docstatus",
  ],
  Customer: [
    "name",
    "customer_name",
    "customer_type",
    "customer_group",
    "territory",
    "email_id",
    "mobile_no",
    "phone",
    "disabled",
    "creation",
    "modified",
  ],
  User: ["name", "email", "full_name", "user_image", "user_type", "enabled", "roles"],
  "Web Page": ["name", "title", "route", "owner", "creation", "modified", "published"],
};

const USER_SENSITIVE = new Set(["api_key", "api_secret", "password", "new_password", "reset_password_key", "sid"]);

const ALLOWED_ITEM_KEYS: Record<string, Set<string>> = {
  "Purchase Invoice": new Set([
    "item_code",
    "item_name",
    "qty",
    "rate",
    "amount",
    "uom",
    "warehouse",
    "expense_account",
    "cost_center",
    "description",
    "name",
  ]),
  "Purchase Order": new Set([
    "item_code",
    "item_name",
    "qty",
    "rate",
    "amount",
    "uom",
    "warehouse",
    "schedule_date",
    "description",
    "name",
  ]),
  "Sales Invoice": new Set([
    "item_code",
    "item_name",
    "qty",
    "rate",
    "amount",
    "uom",
    "warehouse",
    "income_account",
    "cost_center",
    "description",
    "name",
  ]),
  "Sales Order": new Set([
    "item_code",
    "item_name",
    "qty",
    "rate",
    "amount",
    "uom",
    "warehouse",
    "delivery_date",
    "description",
    "name",
  ]),
};

const ALLOWED_PAYLOAD_KEYS: Record<string, Set<string>> = {
  "Purchase Invoice": new Set([
    "supplier",
    "supplier_name",
    "company",
    "currency",
    "conversion_rate",
    "posting_date",
    "due_date",
    "bill_no",
    "bill_date",
    "items",
    "discount_amount",
    "additional_discount_percentage",
    "payment_terms_template",
    "remarks",
    "terms",
    "update_stock",
    "set_warehouse",
    "is_return",
    "return_against",
  ]),
  "Purchase Order": new Set([
    "supplier",
    "supplier_name",
    "company",
    "currency",
    "conversion_rate",
    "transaction_date",
    "schedule_date",
    "items",
    "remarks",
    "status",
  ]),
  "Sales Invoice": new Set([
    "customer",
    "customer_name",
    "company",
    "currency",
    "conversion_rate",
    "posting_date",
    "due_date",
    "items",
    "discount_amount",
    "additional_discount_percentage",
    "payment_terms_template",
    "remarks",
    "territory",
    "customer_group",
    "shipping_address_name",
    "contact_person",
    "contact_email",
  ]),
  "Sales Order": new Set([
    "customer",
    "customer_name",
    "company",
    "currency",
    "conversion_rate",
    "transaction_date",
    "delivery_date",
    "items",
    "remarks",
    "territory",
    "customer_group",
  ]),
  "Web Page": new Set(["title", "slug", "route", "published", "content", "meta_title", "meta_description"]),
  Item: new Set([
    "item_code",
    "item_name",
    "item_group",
    "description",
    "standard_rate",
    "is_stock_item",
    "has_variants",
    "variant_of",
    "brand",
    "weight_per_unit",
    "weight_uom",
    "stock_uom",
    "image",
    "disabled",
  ]),
};

export function isAllowedDoctype(doctype: string): boolean {
  return ALLOWED_DOCTYPES.has(doctype);
}

export function isAllowedMethod(method: string): boolean {
  return ALLOWED_METHODS.has(method);
}

export function sanitizeFields(doctype: string, raw: unknown): string[] {
  const allowed = SAFE_FIELDS[doctype];
  if (!allowed) return [];
  if (!Array.isArray(raw)) return allowed.slice();
  const requested = raw.map((v) => String(v)).filter(Boolean);
  if (requested.includes("*")) return allowed.slice();
  return requested.filter((f) => allowed.includes(f));
}

export function sanitizePayload(doctype: string, payload: any): any {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const allowed = ALLOWED_PAYLOAD_KEYS[doctype];
  const out: Record<string, any> = {};
  const keys = allowed ? [...allowed] : Object.keys(payload);
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      out[key] = payload[key];
    }
  }
  // sanitize child items
  if (Array.isArray(out.items)) {
    const itemAllowed = ALLOWED_ITEM_KEYS[doctype];
    if (itemAllowed) {
      out.items = out.items.map((item: any) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return item;
        const itemOut: Record<string, any> = {};
        for (const key of itemAllowed) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            itemOut[key] = item[key];
          }
        }
        return itemOut;
      });
    }
  }
  // never allow sensitive user fields through proxy
  if (doctype === "User") {
    for (const k of USER_SENSITIVE) delete out[k];
  }
  return out;
}

export function sanitizeUserResponse(data: any, currentUser: string | null): any {
  if (!data) return data;
  const strip = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(strip);
    const copy: Record<string, any> = { ...obj };
    for (const k of USER_SENSITIVE) delete copy[k];
    return copy;
  };
  // enforce self-access for User
  if (currentUser) {
    const name = data?.data?.name ?? data?.name ?? data?.message;
    if (typeof name === "string" && name !== currentUser) {
      return null;
    }
  }
  return strip(data);
}

export function validateMethodParams(method: string, data: any): { ok: boolean; reason?: string } {
  const doctype =
    (typeof data?.doctype === "string" && data.doctype) ||
    (typeof data?.doc?.doctype === "string" && data.doc.doctype) ||
    null;

  if (method === "frappe.client.get_count") {
    if (!doctype || !isAllowedDoctype(doctype)) return { ok: false, reason: "doctype not allowed" };
    return { ok: true };
  }
  if (method === "frappe.client.submit" || method === "frappe.client.cancel") {
    if (!doctype || !isAllowedDoctype(doctype)) return { ok: false, reason: "doctype not allowed" };
    return { ok: true };
  }
  if (method === "frappe.client.set_value") {
    if (!doctype || !isAllowedDoctype(doctype)) return { ok: false, reason: "doctype not allowed" };
    return { ok: true };
  }
  if (method === "frappe.model.workflow.apply_workflow") {
    const docDoctype = typeof data?.doc?.doctype === "string" ? data.doc.doctype : null;
    if (!docDoctype || !isAllowedDoctype(docDoctype)) return { ok: false, reason: "doctype not allowed" };
    return { ok: true };
  }
  return { ok: true };
}
