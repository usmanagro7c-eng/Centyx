import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

const ALLOWED_ORDER_BY = new Set([
  "posting_date desc, creation desc",
  "posting_date asc, creation asc",
  "creation desc",
  "creation asc",
  "grand_total desc",
  "grand_total asc",
]);

/**
 * Fetch Sales Invoices from ERPNext.
 *
 * Supports:
 * - search
 * - status
 * - date filters
 * - pagination
 * - ordering
 */
export async function getSalesInvoices(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userCookie = req.headers.cookie || "";

    const {
      search,
      status,
      company,
      customer,
      from_date,
      to_date,
      limit_page_length = "50",
      limit_start = "0",
      order_by = "posting_date desc, creation desc",
    } = req.query;

    const filters: any[] = [];

    if (status && typeof status === "string" && status !== "All") {
      filters.push(["status", "=", status]);
    }

    if (company && typeof company === "string") {
      filters.push(["company", "=", company]);
    }

    if (customer && typeof customer === "string") {
      filters.push(["customer", "=", customer]);
    }

    if (from_date && typeof from_date === "string") {
      filters.push(["posting_date", ">=", from_date]);
    }

    if (to_date && typeof to_date === "string") {
      filters.push(["posting_date", "<=", to_date]);
    }

    /**
     * Search against invoice number / customer / customer name.
     *
     * Frappe filters use OR conditions through ["or", [...]].
     * Keeping search optional avoids unnecessary filtering.
     */
    if (search && typeof search === "string" && search.trim()) {
      const value = search.trim();

      filters.push([
        "or",
        [
          ["name", "like", `%${value}%`],
          ["customer", "like", `%${value}%`],
          ["customer_name", "like", `%${value}%`],
        ],
      ]);
    }

    const fields = [
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

      // Frappe blocks these address fields in document-list queries.
      // They are still available when fetching a single Sales Invoice by name.
      "shipping_address_name",
      // "shipping_address",
      // "billing_address",

      "contact_person",
      "contact_email",

      "remarks",
    ];

    const result = await erpnextService.getResource(
      "Sales Invoice",
      {
        fields,
        filters,
        limit_page_length: Math.min(Math.max(Number(limit_page_length) || 50, 1), 200),
        limit_start: Number(limit_start) || 0,
        order_by:
          typeof order_by === "string" && ALLOWED_ORDER_BY.has(order_by.trim())
            ? order_by.trim()
            : "posting_date desc, creation desc",
      },
      userCookie ? { userCookie } : undefined
    );

    res.json({
      data: result.data,
      total_count: result.total_count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch a single Sales Invoice by invoice name.
 */
export async function getSalesInvoiceById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const invoiceId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!invoiceId) {
      return res.status(400).json({
        error: "Sales Invoice ID is required",
      });
    }

    const userCookie = req.headers.cookie || "";

    const result =
      await erpnextService.getResourceByName(
        "Sales Invoice",
        invoiceId,
        userCookie ? { userCookie } : undefined
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createSalesInvoice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userCookie = req.headers.cookie || "";
    const payload = req.body;

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({
        error: "Sales Invoice payload is required",
      });
    }

    const allowedKeys = ["customer", "customer_name", "company", "currency", "conversion_rate", "posting_date", "due_date", "items", "discount_amount", "additional_discount_percentage", "payment_terms_template", "remarks", "territory", "customer_group", "shipping_address_name", "contact_person", "contact_email"];
    const sanitized: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) sanitized[key] = payload[key];
    }
    if (Array.isArray(sanitized.items)) {
      const itemKeys = ["item_code", "item_name", "qty", "rate", "amount", "uom", "warehouse", "income_account", "cost_center", "description", "name"];
      sanitized.items = sanitized.items.map((item: any) => {
        const out: Record<string, any> = {};
        for (const k of itemKeys) if (item && Object.prototype.hasOwnProperty.call(item, k)) out[k] = item[k];
        return out;
      });
    }

    const result = await erpnextService.createResource(
      "Sales Invoice",
      sanitized,
      userCookie ? { userCookie } : undefined
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateSalesInvoice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const invoiceId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userCookie = req.headers.cookie || "";
    const payload = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        error: "Sales Invoice ID is required",
      });
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({
        error: "Sales Invoice payload is required",
      });
    }

    const allowedKeys = ["customer", "customer_name", "company", "currency", "conversion_rate", "posting_date", "due_date", "items", "discount_amount", "additional_discount_percentage", "payment_terms_template", "remarks", "territory", "customer_group", "shipping_address_name", "contact_person", "contact_email"];
    const sanitized: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) sanitized[key] = payload[key];
    }
    if (Array.isArray(sanitized.items)) {
      const itemKeys = ["item_code", "item_name", "qty", "rate", "amount", "uom", "warehouse", "income_account", "cost_center", "description", "name"];
      sanitized.items = sanitized.items.map((item: any) => {
        const out: Record<string, any> = {};
        for (const k of itemKeys) if (item && Object.prototype.hasOwnProperty.call(item, k)) out[k] = item[k];
        return out;
      });
    }

    const result = await erpnextService.updateResource(
      "Sales Invoice",
      invoiceId,
      sanitized,
      userCookie ? { userCookie } : undefined
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}