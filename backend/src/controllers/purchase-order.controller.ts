import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

const SORTABLE_FIELDS = new Set(["transaction_date", "creation", "modified", "grand_total", "status"]);

export async function getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userCookie = req.headers.cookie || "";
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const supplier = (req.query.supplier as string) || "";
    const fromDate = (req.query.from_date as string) || "";
    const toDate = (req.query.to_date as string) || "";
    const sortBy = SORTABLE_FIELDS.has(String(req.query.sort_by || "")) ? String(req.query.sort_by) : "transaction_date";
    const sortOrder = req.query.sort_order === "asc" ? "asc" : "desc";

    const filters: any[] = [];
    if (search) filters.push(["supplier_name", "like", `%${search}%`]);
    if (status) filters.push(["status", "=", status]);
    if (supplier) filters.push(["supplier", "=", supplier]);
    if (fromDate) filters.push(["transaction_date", ">=", fromDate]);
    if (toDate) filters.push(["transaction_date", "<=", toDate]);

    const fields = [
      "name",
      "supplier",
      "supplier_name",
      "transaction_date",
      "schedule_date",
      "status",
      "grand_total",
      "items",
      "creation",
      "modified",
    ];

    const result = await erpnextService.getResource("Purchase Order", {
      fields,
      filters,
      limit_page_length: limit,
      limit_start: (page - 1) * limit,
      order_by: `${sortBy} ${sortOrder}`,
    }, userCookie ? { userCookie } : undefined);

    res.json({
      data: result.data,
      total_count: result.data.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userCookie = req.headers.cookie || "";
    const payload = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : null;
    if (!payload) return res.status(400).json({ message: "Purchase Order payload is required." });

    const allowed: Record<string, any> = {};
    const keys = ["supplier", "supplier_name", "company", "currency", "conversion_rate", "transaction_date", "schedule_date", "items", "remarks", "status"];
    for (const k of keys) if (Object.prototype.hasOwnProperty.call(payload, k)) allowed[k] = payload[k];

    if (Array.isArray(allowed.items)) {
      allowed.items = allowed.items.map((item: any) => {
        const itemAllowed: Record<string, any> = {};
        const itemKeys = ["item_code", "item_name", "qty", "rate", "amount", "uom", "warehouse", "schedule_date", "description"];
        for (const k of itemKeys) if (item && Object.prototype.hasOwnProperty.call(item, k)) itemAllowed[k] = item[k];
        return itemAllowed;
      });
    }

    const result = await erpnextService.createResource("Purchase Order", allowed, userCookie ? { userCookie } : undefined);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
