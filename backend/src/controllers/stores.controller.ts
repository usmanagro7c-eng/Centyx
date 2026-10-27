import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

/**
 * Get all stores belonging to the authenticated user.
 *
 * In Frappe, the actual doctype is Web Page, not Website, and the safe method
 * to identify the logged-in user is frappe.auth.get_logged_user.
 */
export async function getMyStores(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("=== Backend: getMyStores called ===");

    const userCookies = req.headers.cookie || "";
    console.log("=== Backend: Extracted cookies ===", { hasCookie: !!userCookies, cookieLength: userCookies.length });

    if (!userCookies) {
      console.error("=== Backend: No cookie found ===");
      return res.status(401).json({
        error: "Not authenticated",
        message: "No session cookie found. Please login first.",
      });
    }

    console.log("=== Backend: Calling frappe.auth.get_logged_user ===");
    const currentUserResponse = await erpnextService.callMethod<{ message: string }>(
      "frappe.auth.get_logged_user",
      {},
      "GET",
      { userCookie: userCookies }
    );

    const currentUser = currentUserResponse?.message;
    console.log("=== Backend: Got current user ===", { currentUser });

    if (!currentUser || currentUser === "Guest") {
      return res.status(401).json({
        error: "Not authenticated",
        message: "Could not determine current user. Please login first.",
      });
    }

    console.log("=== Backend: Querying web pages for owner ===", { currentUser });
    const result = await erpnextService.getResource(
      "Web Page",
      {
        fields: ["name", "title", "route", "owner", "creation", "modified", "published"],
        filters: [["owner", "=", currentUser]],
        limit_page_length: 999,
        order_by: "modified desc",
      },
      { userCookie: userCookies }
    );

    const normalizedData = (result.data || []).map((store: any) => ({
      ...store,
      slug: store.slug || store.route || store.name,
      route: store.route || store.slug || store.name,
      title: store.title || store.name,
    }));

    console.log("=== Backend: Got stores ===", { count: normalizedData.length, data: normalizedData });

    res.json({
      data: normalizedData,
      count: normalizedData.length,
    });
  } catch (error: any) {
    console.error("=== Backend: ERROR in getMyStores ===", {
      message: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
      stack: error.stack,
    });

    // If Frappe returns 401 or permission error, pass it through
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(error.response.status).json({
        error: "Authentication failed",
        message: "Your session may have expired. Please login again.",
        details: error.response.data,
      });
    }

    // If any other error, return 500 with detailed message
    res.status(500).json({
      error: "Failed to fetch stores",
      message: error.message || "Internal server error",
      details: error.response?.data,
    });
  }
}

/**
 * Create a new Web Page (store) for the authenticated user.
 * Uses the current Frappe session to make the record owner the authenticated user.
 */
export async function createMyStore(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, slug, route } = req.body;

    const userCookies = req.headers.cookie || "";

    if (!userCookies) {
      return res.status(401).json({
        error: "Not authenticated",
        message: "No session cookie found. Please login first.",
      });
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({
        error: "Validation error",
        message: "Store title is required and must be a non-empty string",
      });
    }

    const normalizedSlug = (slug || route || generateSlug(title)).trim();

    const result = await erpnextService.createResource(
      "Web Page",
      {
        title: title.trim(),
        slug: normalizedSlug,
        route: normalizedSlug,
      },
      { userCookie: userCookies }
    );

    const normalizedData = {
      ...result.data,
      slug: result.data?.slug || result.data?.route || normalizedSlug,
      route: result.data?.route || result.data?.slug || normalizedSlug,
      title: result.data?.title || title.trim(),
    };

    res.status(201).json({
      data: normalizedData,
      message: "Store created successfully",
    });
  } catch (error: any) {
    console.error("Error creating store:", {
      message: error.message,
      response: error.response?.data,
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(error.response.status).json({
        error: "Authentication failed",
        message: "Your session may have expired. Please login again.",
      });
    }

    res.status(500).json({
      error: "Failed to create store",
      message: error.message || "Internal server error",
      details: error.response?.data,
    });
  }
}

/**
 * Helper to generate URL slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
}
