import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

export async function getProductBin(req: Request, res: Response, next: NextFunction) {
  try {
    const itemCode = Array.isArray(req.params.itemCode) ? req.params.itemCode[0] : req.params.itemCode;
    const warehouse = req.query.warehouse as string | undefined;
    const cookie = req.headers.cookie || "";
    const headers = cookie ? { userCookie: cookie } : undefined;

    const filters: any[] = [["item_code", "=", itemCode]];
    if (warehouse) filters.push(["warehouse", "=", warehouse]);

    const fields = ["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "ordered_qty", "projected_qty"];

    const result = await erpnextService.getResource("Bin", {
      fields,
      filters,
      limit_page_length: 50,
    }, headers);

    res.json(result.data);
  } catch (error) {
    next(error);
  }
}

export async function getAllBins(req: Request, res: Response, next: NextFunction) {
  try {
    const cookie = req.headers.cookie || "";
    const headers = cookie ? { userCookie: cookie } : undefined;
    const useServiceAccount = !cookie;

    let authenticated = false;
    if (cookie) {
      try {
        const r = await erpnextService.callMethod<{ message: string }>("frappe.auth.get_logged_user", {}, "GET", headers);
        authenticated = !!r?.message && r.message !== "Guest";
      } catch {
        authenticated = false;
      }
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 1000, 1), 5000);

    const fields = authenticated
      ? ["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "ordered_qty", "projected_qty"]
      : ["item_code", "actual_qty", "reserved_qty"];

    const result = await erpnextService.getResource("Bin", {
      fields,
      limit_page_length: limit,
    }, undefined, { useServiceAccount: true });

    if (!authenticated) {
      const map = new Map<string, { item_code: string; actual_qty: number; reserved_qty: number }>();
      for (const bin of result.data || []) {
        const current = map.get(bin.item_code) ?? { item_code: bin.item_code, actual_qty: 0, reserved_qty: 0 };
        current.actual_qty += Number(bin.actual_qty) || 0;
        current.reserved_qty += Number(bin.reserved_qty) || 0;
        map.set(bin.item_code, current);
      }
      return res.json([...map.values()]);
    }

    res.json(result.data);
  } catch (error) {
    next(error);
  }
}
