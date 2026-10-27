import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

const SORTABLE_FIELDS = new Set([
  "modified",
  "creation",
  "item_name",
  "standard_rate",
]);

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 200);
    const search = (req.query.search as string) || "";
    const itemGroup = (req.query.item_group as string) || "";
    const disabled = req.query.disabled !== undefined ? parseInt(req.query.disabled as string) : undefined;
    const sortBy = SORTABLE_FIELDS.has(String(req.query.sort_by || "")) ? String(req.query.sort_by) : "modified";
    const sortOrder = req.query.sort_order === "asc" ? "asc" : "desc";
    const includeCost = req.query.include_cost === "true" || req.query.include_cost === "1";

    const cookie = req.headers.cookie || "";
    let authenticated = false;
    if (cookie) {
      try {
        const r = await erpnextService.callMethod<{ message: string }>("frappe.auth.get_logged_user", {}, "GET", { userCookie: cookie });
        authenticated = !!r?.message && r.message !== "Guest";
      } catch {
        authenticated = false;
      }
    }

    const fields = [
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
    ];
    if (includeCost && authenticated) fields.splice(6, 0, "valuation_rate");

    const filters: any[] = [];
    if (disabled !== undefined) filters.push(["disabled", "=", disabled]);
    if (itemGroup) filters.push(["item_group", "=", itemGroup]);
    if (search) filters.push(["item_name", "like", `%${search}%`]);

const headers = undefined;
    const useServiceAccount = true;

    const result = await erpnextService.getResource("Item", {
      fields,
      filters,
      limit_page_length: limit,
      limit_start: (page - 1) * limit,
      order_by: `${sortBy} ${sortOrder}`,
    }, headers, useServiceAccount ? { useServiceAccount: true } : undefined);

    const totalCount = await erpnextService
      .callMethod("frappe.client.get_count", { doctype: "Item", filters }, "GET", headers ?? (useServiceAccount ? { useServiceAccount: true } as any : undefined))
      .then((res: any) => res.message || result.data.length)
      .catch(() => result.data.length);

    res.json({ data: result.data, total_count: totalCount });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const itemCode = Array.isArray(req.params.itemCode) ? req.params.itemCode[0] : req.params.itemCode;
    const cookie = req.headers.cookie || "";
const headers = undefined;
    const useServiceAccount = true;
    const result = await erpnextService.getResourceByName(
      "Item",
      itemCode as string,
      headers ?? (useServiceAccount ? ({ useServiceAccount: true } as any) : undefined)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getItemGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const cookie = req.headers.cookie || "";
    const headers = cookie ? { userCookie: cookie } : undefined;
    const fields = ["name", "item_group_name", "parent_item_group", "is_group", "image"];
    const result = await erpnextService.getResource("Item Group", {
      fields,
      limit_page_length: 100,
      order_by: "item_group_name asc",
    }, headers);
    res.json(result.data);
  } catch (error) {
    next(error);
  }
}
