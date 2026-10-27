import {
  Request,
  Response,
  NextFunction,
} from "express";

import { erpnextService } from "../services/erpnext.service.js";

// ============================================================
// GET PURCHASE INVOICES
// ============================================================

export async function getPurchaseInvoices(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userCookie =
      req.headers.cookie || "";

    const page = Math.max(
      parseInt(req.query.page as string, 10) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit as string, 10) || 20,
        1,
      ),
      500,
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim()
        : "";

    const supplier =
      typeof req.query.supplier === "string"
        ? req.query.supplier.trim()
        : "";

    const fromDate =
      typeof req.query.from_date === "string"
        ? req.query.from_date.trim()
        : "";

    const toDate =
      typeof req.query.to_date === "string"
        ? req.query.to_date.trim()
        : "";

    const SORTABLE_FIELDS = new Set(["posting_date", "creation", "modified", "grand_total", "status", "supplier_name"]);

const sortBy =
      typeof req.query.sort_by === "string" &&
      SORTABLE_FIELDS.has(req.query.sort_by.trim())
        ? req.query.sort_by.trim()
        : "posting_date";

    const sortOrder =
      req.query.sort_order === "asc"
        ? "asc"
        : "desc";

    // ========================================================
    // FILTERS
    // ========================================================

    const filters: any[] = [];

    if (search) {
      filters.push([
        "supplier_name",
        "like",
        `%${search}%`,
      ]);
    }

    if (status) {
      filters.push([
        "status",
        "=",
        status,
      ]);
    }

    if (supplier) {
      filters.push([
        "supplier",
        "=",
        supplier,
      ]);
    }

    if (fromDate) {
      filters.push([
        "posting_date",
        ">=",
        fromDate,
      ]);
    }

    if (toDate) {
      filters.push([
        "posting_date",
        "<=",
        toDate,
      ]);
    }

    // ========================================================
    // FIELDS
    // ========================================================

    const fields = [
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
    ];

    // ========================================================
    // ERPNext
    // ========================================================

    const result =
      await erpnextService.getResource(
        "Purchase Invoice",
        {
          fields,
          filters,
          limit_page_length: limit,
          limit_start: (page - 1) * limit,
          order_by: `${sortBy} ${sortOrder}`,
        },
        userCookie
          ? { userCookie }
          : undefined,
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.json({
      data: result.data || [],
      total_count: result.data?.length || 0,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// GET SINGLE PURCHASE INVOICE
// ============================================================

export async function getPurchaseInvoice(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userCookie =
      req.headers.cookie || "";

    const invoiceName =
      req.params.name;

    if (
      !invoiceName ||
      Array.isArray(invoiceName)
    ) {
      return res.status(400).json({
        message:
          "Valid Purchase Invoice name is required.",
      });
    }

    const result =
      await erpnextService.getResourceByName(
        "Purchase Invoice",
        invoiceName,
        userCookie
          ? { userCookie }
          : undefined,
      );

    if (!result?.data) {
      return res.status(404).json({
        message:
          "Purchase Invoice not found.",
      });
    }

    return res.json({
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================
// CREATE PURCHASE INVOICE
// ============================================================

export async function createPurchaseInvoice(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = req.body;

    const userCookie =
      req.headers.cookie || "";

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return res.status(400).json({
        message:
          "Purchase Invoice payload is required.",
      });
    }

    if (!payload.supplier) {
      return res.status(400).json({
        message:
          "Supplier is required.",
      });
    }

    if (!payload.company) {
      return res.status(400).json({
        message:
          "Company is required.",
      });
    }

    if (
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one Purchase Invoice item is required.",
      });
    }

    const validItems =
      payload.items.filter(
        (item: any) =>
          Number(item?.qty || 0) > 0,
      );

    if (validItems.length === 0) {
      return res.status(400).json({
        message:
          "At least one Purchase Invoice item with quantity greater than zero is required.",
      });
    }

const allowedKeys = ["supplier", "supplier_name", "company", "currency", "conversion_rate", "posting_date", "due_date", "bill_no", "bill_date", "items", "discount_amount", "additional_discount_percentage", "payment_terms_template", "remarks", "terms", "update_stock", "set_warehouse", "is_return", "return_against"];
    const finalPayload: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        finalPayload[key] = payload[key];
      }
    }
    finalPayload.items = validItems;

    const result =
      await erpnextService.createResource(
        "Purchase Invoice",
        finalPayload,
        userCookie
          ? { userCookie }
          : undefined,
      );

    return res
      .status(201)
      .json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================================
// UPDATE PURCHASE INVOICE
// ============================================================

export async function amendPurchaseInvoice(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const invoiceName = String(req.params.name || "");
    const payload = req.body;
    const userCookie = req.headers.cookie || "";

    if (!invoiceName) {
      return res.status(400).json({
        message: "Valid Purchase Invoice name is required.",
      });
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({
        message: "Purchase Invoice payload is required.",
      });
    }

    await erpnextService.callMethod(
      "frappe.client.cancel",
      {
        doctype: "Purchase Invoice",
        name: invoiceName,
      },
      "POST",
      userCookie ? { userCookie } : undefined,
    );

const allowedKeys = ["supplier", "supplier_name", "company", "currency", "conversion_rate", "posting_date", "due_date", "bill_no", "bill_date", "items", "discount_amount", "additional_discount_percentage", "payment_terms_template", "remarks", "terms", "update_stock", "set_warehouse", "is_return", "return_against"];
    const allowed: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        allowed[key] = payload[key];
      }
    }
    allowed.amended_from = invoiceName;

    const result = await erpnextService.createResource(
      "Purchase Invoice",
      allowed,
      userCookie ? { userCookie } : undefined,
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseInvoice(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const invoiceName = String(req.params.name || "");
    const payload = req.body;
    const userCookie = req.headers.cookie || "";

    if (!invoiceName) {
      return res.status(400).json({
        message: "Valid Purchase Invoice name is required.",
      });
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({
        message: "Purchase Invoice payload is required.",
      });
    }

    if (payload.items !== undefined) {
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return res.status(400).json({
          message: "At least one Purchase Invoice item is required.",
        });
      }

      payload.items = payload.items.filter(
        (item: any) => Number(item?.qty || 0) > 0,
      );

      const existing = await erpnextService.getResourceByName(
        "Purchase Invoice",
        invoiceName,
        userCookie ? { userCookie } : undefined,
      );

      const existingInvoice = existing?.data as any;
      const existingItems = Array.isArray(existingInvoice?.items)
        ? existingInvoice.items
        : [];
      const submitted = Number(existingInvoice?.docstatus) === 1;

      // ERPNext does not allow editing child item fields after submission.
      // Keep the complete server-side child rows unchanged in that case.
      if (submitted) {
        payload.items = existingItems;
      } else {
        payload.items = payload.items.map((item: any) => {
          const existingItem = existingItems.find(
            (candidate: any) => candidate.name && candidate.name === item.name,
          );

          if (!existingItem) {
            return item;
          }

          return { ...existingItem, ...item };
        });
      }
    }

const allowedKeys = ["supplier", "supplier_name", "company", "currency", "conversion_rate", "posting_date", "due_date", "bill_no", "bill_date", "items", "discount_amount", "additional_discount_percentage", "payment_terms_template", "remarks", "terms", "update_stock", "set_warehouse", "is_return", "return_against"];
    const sanitized: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        sanitized[key] = payload[key];
      }
    }
    if (payload.items !== undefined) sanitized.items = payload.items;

    const result = await erpnextService.updateResource(
      "Purchase Invoice",
      invoiceName,
      sanitized,
      userCookie ? { userCookie } : undefined,
    );

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// ============================================================
// DELETE PURCHASE INVOICE
// ============================================================

export async function deletePurchaseInvoice(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userCookie = req.headers.cookie || "";

    const invoiceName = String(req.params.name || "");

    if (!invoiceName) {
      return res.status(400).json({
        message: "Valid Purchase Invoice name is required.",
      });
    }

    const result =
      await erpnextService.deleteResource(
        "Purchase Invoice",
        invoiceName,
        userCookie
          ? { userCookie }
          : undefined,
      );

    return res.json(result);
  } catch (error) {
    next(error);
  }
}