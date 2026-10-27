import { Request, Response, NextFunction } from "express";

export function requireAjaxHeader(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase())) {
    return next();
  }

  const requestedWith = String(req.headers["x-requested-with"] || "").toLowerCase();

  if (requestedWith !== "xmlhttprequest") {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
