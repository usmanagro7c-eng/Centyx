import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";
import {
  isAllowedDoctype,
  isAllowedMethod,
  sanitizeFields,
  sanitizePayload,
  sanitizeUserResponse,
  validateMethodParams,
} from "../utils/sanitize.js";

function doctypeFromPath(path: string): string | null {
  const match = path.match(/^\/resource\/(.+?)(?:\/.+)?$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function methodFromPath(path: string): string | null {
  const match = path.match(/^\/method\/(.+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

const PUBLIC_METHODS = new Set([
  "login",
  "logout",
  "frappe.auth.get_logged_user",
]);

export async function handleGenericProxy(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const urlPath = `/api${req.path}`;
  const method = req.method.toUpperCase();
  const cookie = req.headers.cookie || "";

  const doctype = doctypeFromPath(req.path);
  const methodName = methodFromPath(req.path);

  // --- Auth gate ---
  let currentUser: string | null = null;
  const isPublicMethod = methodName !== null && PUBLIC_METHODS.has(methodName);

  if (!isPublicMethod) {
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
      currentUser = result?.message ?? null;
      if (!currentUser || currentUser === "Guest") {
        return res.status(401).json({ error: "Not authenticated" });
      }
    } catch {
      return res.status(401).json({ error: "Not authenticated" });
    }
  }

  // --- Allowlists ---
  if (doctype) {
    if (!isAllowedDoctype(doctype)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // User self-access enforcement
    if (doctype === "User" && req.path.includes("/resource/User/")) {
      const name = req.path.replace(/^\/resource\/User\//, "").split("?")[0];
      let decoded = name;
      try {
        decoded = decodeURIComponent(name);
      } catch {
        // keep raw
      }
      if (currentUser && decoded !== currentUser) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
  }

  if (methodName) {
    if (!isAllowedMethod(methodName)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const validation = validateMethodParams(methodName, req.body);
    if (!validation.ok) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  // --- Sanitize outbound query fields ---
  if (doctype && req.query && typeof req.query.fields === "string") {
    try {
      const parsed = JSON.parse(req.query.fields);
      const sanitized = sanitizeFields(doctype, parsed);
      req.query.fields = JSON.stringify(sanitized);
    } catch {
      req.query.fields = JSON.stringify(sanitizeFields(doctype, []));
    }
  }

  // --- Sanitize outbound body ---
  let body = req.body;
  if (doctype && body && ["POST", "PUT", "PATCH"].includes(method)) {
    body = sanitizePayload(doctype, body);
  }

  // Preserve original content type for form-encoded requests (e.g. Frappe login).
  const originalContentType = String(req.headers["content-type"] || "");
  const isFormEncoded = originalContentType.includes("application/x-www-form-urlencoded");
  if (isFormEncoded && body && typeof body === "object") {
    body = new URLSearchParams(body as Record<string, string>).toString();
  }

  const forwardHeaders: Record<string, string> = {};
  if (cookie) {
    forwardHeaders["userCookie"] = cookie;
  }
  if (isFormEncoded) {
    forwardHeaders["Content-Type"] = "application/x-www-form-urlencoded";
  }

  try {
    const response = await erpnextService.proxyRequest(
      method,
      urlPath,
      body,
      req.query,
      forwardHeaders
    );

    // Forward set-cookie if ERPNext sent any login cookies
    if (response.headers["set-cookie"]) {
      res.setHeader("set-cookie", response.headers["set-cookie"]);
    }

    let data = response.data;

    // Sanitize User responses
    if (doctype === "User") {
      data = sanitizeUserResponse(data, currentUser);
      if (data === null) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    res.status(response.status).json(data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    // Do not leak upstream bodies.
    return res.status(status).json({ error: "Request failed" });
  }
}
