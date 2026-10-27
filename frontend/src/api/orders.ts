import { api } from "./client";

export const SALES_ORDER_FIELDS = [
  "name",
  "customer",
  "customer_name",
  "transaction_date",
  "delivery_date",
  "status",
  "docstatus",
  "total",
  "grand_total",
  "currency",
  "items",
  "creation",
  "modified",
  "owner",
  "company",
  "shipping_address_name",
  "contact_email",
  "contact_mobile",
];

export interface FrappeSalesOrder {
  name: string;
  customer?: string;
  customer_name?: string;
  transaction_date?: string;
  delivery_date?: string;
  status?: string;
  workflow_state?: string | null;
  docstatus?: number;
  total?: number;
  grand_total?: number;
  currency?: string;
  items?: any[];
  creation?: string;
  modified?: string;
  owner?: string;
  company?: string;
  shipping_address_name?: string;
  billing_address_name?: string;
  contact_email?: string;
  contact_mobile?: string;
  delivery_note?: string | null;
  sales_invoice?: string | null;
  [key: string]: any;
}

const isMinimalSalesOrder = (order: any): order is { name: string } =>
  order &&
  typeof order === "object" &&
  Object.keys(order).length === 1 &&
  typeof order.name === "string";

const normalizeERPNextResponse = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  if (payload.message && typeof payload.message === "object") {
    return payload.message;
  }
  return payload;
};

export async function getSalesOrderById(orderName: string): Promise<FrappeSalesOrder> {
  const response = await api.get(`/resource/Sales Order/${encodeURIComponent(orderName)}`, {
    params: {
      fields: JSON.stringify(SALES_ORDER_FIELDS),
    },
  });
  const order = normalizeERPNextResponse(response.data);
  return order as FrappeSalesOrder;
}

export async function getOrders(status?: string) {
  const params: Record<string, string | number> = {
    fields: JSON.stringify(SALES_ORDER_FIELDS),
    limit_page_length: 5000,
    order_by: "creation desc",
  };
  if (status) {
    params.filters = JSON.stringify(status === "Draft"
      ? [["docstatus", "=", 0]]
      : [["status", "=", status]]);
  }

  const { data } = await api.get("/resource/Sales Order", {
    params,
  });

  const rawOrders = Array.isArray(data?.data) ? data.data : [];

  const matchesStatus = (order: any) => {
    if (!status) return true;
    const frappeStatus = String(order?.status ?? "").trim().toLowerCase();
    const workflowState = String(order?.workflow_state ?? "").trim().toLowerCase();
    if (frappeStatus === status.toLowerCase()) return true;
    if (workflowState === status.toLowerCase()) return true;
    return status.toLowerCase() === "draft" && Number(order?.docstatus) === 0;
  };

  if (!rawOrders.some(isMinimalSalesOrder)) {
    return rawOrders.filter(matchesStatus);
  }

  const detailedOrders = await Promise.all(
    rawOrders.map(async (order: any) => {
      const name = order?.name;
      if (!name) return order;
      try {
        const response = await api.get(`/resource/Sales Order/${encodeURIComponent(name)}`, {
          params: {
            fields: JSON.stringify(SALES_ORDER_FIELDS),
          },
        });
        const detailData = normalizeERPNextResponse(response.data);
        return detailData && typeof detailData === "object" && Object.keys(detailData).length > 1
          ? detailData
          : order;
      } catch (error) {
        console.error(`Failed to fetch Sales Order detail for ${name}:`, error);
        return order;
      }
    })
  );

  return detailedOrders.filter(matchesStatus);
}

export async function submitSalesOrder(orderName: string) {
  const payload = await getSalesOrderById(orderName);
  const response = await api.post("/method/frappe.client.submit", {
    doc: payload,
  });
  return response.data?.message ?? response.data?.data ?? response.data;
}

export async function setSalesOrderFieldValue(orderName: string, fieldname: string, value: string | number | boolean) {
  const response = await api.post("/method/frappe.client.set_value", {
    doctype: "Sales Order",
    name: orderName,
    fieldname,
    value,
  });
  return response.data?.message ?? response.data?.data ?? response.data;
}

export async function updateSalesOrderStatus(orderName: string, status: string) {
  const current = await getSalesOrderById(orderName);
  const docstatus = Number(current?.docstatus ?? 0);
  const currentStatus = String(current?.status ?? "").trim();

  if (docstatus > 0 && currentStatus && currentStatus !== "Draft") {
    throw new Error(
      `ERPNext forbids changing Sales Order status after submission from ${currentStatus} to ${status}.`
    );
  }

  return setSalesOrderFieldValue(orderName, "status", status);
}

export async function applySalesOrderWorkflowAction(orderName: string, action: string, order?: FrappeSalesOrder) {
  const payload = order ?? (await getSalesOrderById(orderName));
  const response = await api.post("/method/frappe.model.workflow.apply_workflow", {
    doc: payload,
    action,
  });
  return response.data?.message ?? response.data?.data ?? response.data;
}

export async function approveSalesOrder(orderName: string) {
  return applySalesOrderWorkflowAction(orderName, "Approve");
}

export async function rejectSalesOrder(orderName: string) {
  return applySalesOrderWorkflowAction(orderName, "Reject");
}

export async function cancelSalesOrder(orderName: string) {
  try {
    return await setSalesOrderFieldValue(orderName, "status", "Cancelled");
  } catch (error) {
    const response = await api.post("/method/frappe.client.cancel", {
      doctype: "Sales Order",
      name: orderName,
    });
    return response.data?.message ?? response.data?.data ?? response.data;
  }
}

export interface SalesOrderDeliveryResponse {
  success?: boolean;
  delivery_note?: string | null;
  sales_invoice?: string | null;
  already_delivered?: boolean;
  invoice_created?: boolean;
  message?: string;
}

export async function deliverSalesOrder(orderName: string): Promise<SalesOrderDeliveryResponse> {
  const response = await api.post(`/orders/${encodeURIComponent(orderName)}/deliver`);
  const payload = response.data?.data ?? response.data?.message ?? response.data;
  return payload as SalesOrderDeliveryResponse;
}