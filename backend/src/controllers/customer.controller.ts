import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

const ACCOUNT_FIELDS = [
  "user_id",
  "portal_user",
  "portal_user_id",
  "website_user",
  "customer_user",
];

function accountLink(record: Record<string, any>): string | undefined {
  for (const field of ACCOUNT_FIELDS) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function timestamp(value: unknown): number {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const userCookie = req.headers.cookie || "";
    const headers = userCookie ? { userCookie } : undefined;
    const [customerResponse, orderResponse] = await Promise.all([
      erpnextService.getResource<Record<string, any>>("Customer", {
        fields: [
          "name",
          "customer_name",
          "customer_type",
          "customer_group",
          "territory",
          "email_id",
          "mobile_no",
          "disabled",
          "creation",
          "modified",
        ],
        limit_page_length: 1000,
        order_by: "modified desc",
      }, headers),
      erpnextService.getResource<Record<string, any>>("Sales Order", {
        fields: [
          "name",
          "customer",
          "grand_total",
          "base_grand_total",
          "transaction_date",
          "creation",
        ],
        limit_page_length: 1000,
        order_by: "creation desc",
      }, headers),
    ]);

    const customerById = new Map(
      customerResponse.data.map((customer) => [customer.name, customer])
    );
    const aggregates = new Map<string, {
      ordersCount: number;
      totalSpent: number;
      lastOrderAt?: number;
      portal: boolean;
    }>();

    for (const order of orderResponse.data) {
      const customerId = typeof order.customer === "string" ? order.customer : "";
      if (!customerId || !customerById.has(customerId)) continue;
      const current = aggregates.get(customerId) ?? { ordersCount: 0, totalSpent: 0, portal: false };
      current.ordersCount += 1;
      current.totalSpent += Number(order.grand_total ?? order.base_grand_total ?? 0) || 0;
      current.lastOrderAt = Math.max(current.lastOrderAt ?? 0, timestamp(order.transaction_date ?? order.creation));
      current.portal = current.portal || Boolean(accountLink(order));
      aggregates.set(customerId, current);
    }

    const data = customerResponse.data
      .filter((customer) => aggregates.has(customer.name))
      .map((customer) => {
        const aggregate = aggregates.get(customer.name)!;
        const portalUser = accountLink(customer);
        const isPortal = Boolean(portalUser || aggregate.portal);
        return {
          id: customer.name,
          name: customer.customer_name || customer.name,
          email: customer.email_id || "",
          phone: customer.mobile_no || customer.phone || undefined,
          ordersCount: aggregate.ordersCount,
          totalSpent: aggregate.totalSpent,
          createdAt: timestamp(customer.creation),
          updatedAt: timestamp(customer.modified),
          lastOrderAt: aggregate.lastOrderAt,
          type: isPortal ? "portal" : "direct",
          status: customer.disabled ? "inactive" : "active",
          userId: portalUser,
        };
      });

    const type = req.query.type as string | undefined;
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const filtered = data.filter((customer) => {
      if (type === "portal" && customer.type !== "portal") return false;
      if (type === "direct" && customer.type !== "direct") return false;
      if (!search) return true;
      return [customer.name, customer.email, customer.phone, customer.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });

    res.json({ data: filtered, total_count: filtered.length });
  } catch (error) {
    next(error);
  }
}