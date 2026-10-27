import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

export async function getGiftCards(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const search = (req.query.search as string) || "";
    const userCookie = req.headers.cookie || "";
    const headers = userCookie ? { userCookie } : undefined;

    const filters: any[] = [];
    if (search) filters.push(["card_number", "like", `%${search}%`]);

    const fields = [
      "name",
      "card_number",
      "customer",
      "customer_name",
      "balance",
      "initial_amount",
      "expiry_date",
      "status",
      "creation",
    ];

    try {
      const result = await erpnextService.getResource("Gift Card", {
        fields,
        filters,
        limit_page_length: limit,
        limit_start: (page - 1) * limit,
        order_by: "creation desc",
      }, headers);
      res.json({ data: result.data });
    } catch (err: any) {
      if (err.response?.status === 404) {
        res.json({ data: [] });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
}
