import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cookie = req.headers.cookie || "";

  if (!cookie) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await erpnextService.callMethod<{ message: string }>(
      "frappe.auth.get_logged_user",
      {},
      "GET",
      { userCookie: cookie }
    );

    const user = result?.message;

    if (!user || user === "Guest") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    (req as any).frappeUser = user;
    next();
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}
