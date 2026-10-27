import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

function dateOnly(value: unknown): string {
  return String(value ?? "").slice(0, 10);
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function amount(record: Record<string, any>): number {
  return Number(record.grand_total ?? record.base_grand_total ?? record.total ?? 0) || 0;
}

function isReturn(record: Record<string, any>): boolean {
  return Boolean(record.is_return) || Boolean(record.return_against);
}

function recordDate(record: Record<string, any>, fields: string[]): string {
  for (const field of fields) {
    const value = dateOnly(record[field]);
    if (value) return value;
  }
  return "";
}

function channelName(record: Record<string, any>): string {
  const source = String(record.source ?? record.utm_source ?? record.referral_source ?? record.sales_source ?? "").trim().toLowerCase();
  const medium = String(record.medium ?? record.utm_medium ?? "").trim().toLowerCase();
  if (!source && !medium) return "Unattributed";
  if (medium.includes("social") || ["facebook", "instagram", "tiktok", "linkedin", "twitter"].some((value) => source.includes(value))) return "Social";
  if (medium.includes("email") || source === "email") return "Email";
  if (medium.includes("paid") || medium.includes("cpc") || medium.includes("ppc")) return "Paid Search";
  if (medium.includes("organic") || source.includes("google") || source.includes("bing")) return "Organic Search";
  if (medium.includes("referral")) return "Referral";
  return source || "Other";
}

function rangeTotal(records: Record<string, any>[], from: string, to: string): number {
  return records
    .filter((record) => inRange(dateOnly(record.posting_date ?? record.transaction_date ?? record.creation), from, to))
    .reduce((total, record) => total + amount(record), 0);
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const from = String(req.query.from ?? "").slice(0, 10);
    const to = String(req.query.to ?? "").slice(0, 10);
    const previousFrom = String(req.query.previous_from ?? "").slice(0, 10);
    const previousTo = String(req.query.previous_to ?? "").slice(0, 10);

    if (!from || !to || !previousFrom || !previousTo) {
      return res.status(400).json({ error: "Analytics date range is required" });
    }

    const headers = req.headers.cookie ? { userCookie: req.headers.cookie } : undefined;
    const [invoices, orders, customers, items] = await Promise.all([
      safeResource<Record<string, any>>("Sales Invoice", {
        fields: ["name", "customer", "customer_name", "company", "posting_date", "creation", "status", "docstatus", "grand_total", "base_grand_total", "total", "is_return", "return_against", "outstanding_amount"],
        filters: [["docstatus", "=", 1], ["posting_date", ">=", previousFrom], ["posting_date", "<=", to]],
        limit_page_length: 2000,
        order_by: "posting_date asc, creation asc",
      }, headers),
      safeResource<Record<string, any>>("Sales Order", {
        fields: ["name", "customer", "customer_name", "company", "transaction_date", "creation", "status", "docstatus", "grand_total", "base_grand_total", "total"],
        filters: [["docstatus", "!=", 2], ["transaction_date", ">=", previousFrom], ["transaction_date", "<=", to]],
        limit_page_length: 2000,
        order_by: "transaction_date asc, creation asc",
      }, headers),
      safeResource<Record<string, any>>("Customer", {
        fields: ["name", "customer_name", "creation", "disabled"],
        filters: [["creation", ">=", `${previousFrom} 00:00:00`], ["creation", "<=", `${to} 23:59:59`]],
        limit_page_length: 2000,
        order_by: "creation asc",
      }, headers),
      safeResource<Record<string, any>>("Sales Invoice Item", {
        fields: ["parent", "item_code", "item_name", "qty", "amount", "creation"],
        limit_page_length: 2000,
      }, headers),
    ]);

    const currentInvoices = invoices.filter((record) => inRange(recordDate(record, ["posting_date", "transaction_date", "creation"]), from, to));
    const previousInvoices = invoices.filter((record) => inRange(dateOnly(record.posting_date ?? record.creation), previousFrom, previousTo));
    const allCurrentOrders = orders.filter((record) => inRange(recordDate(record, ["transaction_date", "posting_date", "creation"]), from, to));
    const currentOrders = allCurrentOrders.filter((record) => Number(record.docstatus) === 1);
    const previousOrders = orders.filter((record) => inRange(dateOnly(record.transaction_date ?? record.creation), previousFrom, previousTo));
    const currentCustomers = customers.filter((record) => inRange(dateOnly(record.creation), from, to));
    const previousCustomers = customers.filter((record) => inRange(dateOnly(record.creation), previousFrom, previousTo));
    const currentCustomerIds = new Set(currentInvoices.map((record) => String(record.customer ?? "")).filter(Boolean));
    const newCustomerIds = new Set(currentCustomers.map((record) => String(record.name ?? "")).filter(Boolean));
    const returningCustomers = [...currentCustomerIds].filter((customer) => !newCustomerIds.has(customer)).length;

    const revenue = currentInvoices.reduce((total, record) => total + (isReturn(record) ? -Math.abs(amount(record)) : amount(record)), 0);
    const previousRevenue = previousInvoices.reduce((total, record) => total + (isReturn(record) ? -Math.abs(amount(record)) : amount(record)), 0);
    const refundAmount = currentInvoices.filter(isReturn).reduce((total, record) => total + Math.abs(amount(record)), 0);
    const byDay = new Map<string, number>();
    const cursor = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    while (cursor <= end) {
      byDay.set(cursor.toISOString().slice(0, 10), 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    for (const invoice of currentInvoices) {
      const day = recordDate(invoice, ["posting_date", "transaction_date", "creation"]);
      byDay.set(day, (byDay.get(day) ?? 0) + (isReturn(invoice) ? -Math.abs(amount(invoice)) : amount(invoice)));
    }

    const channelTotals = new Map<string, number>();
    for (const invoice of currentInvoices) {
      const channel = channelName(invoice);
      channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + amount(invoice));
    }
    const channelTotal = [...channelTotals.values()].reduce((sum, value) => sum + value, 0);
    const channels = [...channelTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value, pct: channelTotal ? Math.round((value / channelTotal) * 100) : 0 }));

    const invoiceNames = new Set(currentInvoices.map((invoice) => invoice.name));
    const topProducts = new Map<string, { name: string; qty: number; orderNames: Set<string>; revenue: number }>();
    for (const item of items) {
      if (!invoiceNames.has(item.parent)) continue;
      const key = String(item.item_code ?? item.item_name ?? "Unknown");
      const current = topProducts.get(key) ?? { name: item.item_name || key, qty: 0, orderNames: new Set<string>(), revenue: 0 };
      current.qty += Number(item.qty) || 0;
      current.revenue += Number(item.amount) || 0;
      current.orderNames.add(String(item.parent));
      topProducts.set(key, current);
    }

    const growth = (current: number, previous: number) => previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / Math.abs(previous)) * 100;
    res.json({
      data: {
        revenue,
        previousRevenue,
        revenueGrowth: growth(revenue, previousRevenue),
        orders: currentOrders.length,
        previousOrders: previousOrders.length,
        ordersGrowth: growth(currentOrders.length, previousOrders.length),
        customers: currentCustomers.length,
        previousCustomers: previousCustomers.length,
        customersGrowth: growth(currentCustomers.length, previousCustomers.length),
        averageOrderValue: currentOrders.length ? revenue / currentOrders.length : 0,
        dailyRevenue: [...byDay.entries()].map(([date, value]) => ({ date, value })),
        channels,
        topProducts: [...topProducts.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((product) => ({ name: product.name, qty: product.qty, orders: product.orderNames.size, revenue: product.revenue })),
        invoiceCount: currentInvoices.length,
        orderCount: currentOrders.length,
        refundAmount,
        returnedOrders: currentInvoices.filter(isReturn).length,
        newCustomers: newCustomerIds.size,
        returningCustomers,
        totalCustomers: currentCustomerIds.size,
        repeatPurchaseRate: currentCustomerIds.size ? (returningCustomers / currentCustomerIds.size) * 100 : 0,
        orderStatusCounts: allCurrentOrders.reduce<Record<string, number>>((counts, order) => {
          const status = String(order.status ?? (Number(order.docstatus) === 0 ? "Draft" : "Unknown"));
          counts[status] = (counts[status] ?? 0) + 1;
          return counts;
        }, {}),
        payment: {
          available: currentInvoices.some((invoice) => invoice.mode_of_payment || invoice.outstanding_amount !== undefined),
          paid: currentInvoices.reduce((total, invoice) => total + Math.max(0, amount(invoice) - Number(invoice.outstanding_amount ?? 0)), 0),
          unpaid: currentInvoices.reduce((total, invoice) => total + Math.max(0, Number(invoice.outstanding_amount ?? 0)), 0),
          methods: [...currentInvoices.reduce<Map<string, number>>((methods, invoice) => {
            const method = String(invoice.mode_of_payment ?? "").trim();
            if (method) methods.set(method, (methods.get(method) ?? 0) + amount(invoice));
            return methods;
          }, new Map<string, number>())].map(([name, value]) => ({ name, value })),
        },
        trafficAttributionAvailable: currentInvoices.some((invoice) => invoice.source || invoice.channel || invoice.utm_source || invoice.referral_source || invoice.sales_source),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function safeResource<T>(
  doctype: string,
  params: Parameters<typeof erpnextService.getResource>[1],
  headers?: Record<string, string>
): Promise<T[]> {
  try {
    const result = await erpnextService.getResource<T>(doctype, params, headers);
    return result.data ?? [];
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      console.warn(`Analytics: skipping inaccessible ${doctype} dataset.`);
      return [];
    }
    throw error;
  }
}