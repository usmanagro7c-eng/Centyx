import { Request, Response, NextFunction } from "express";
import { erpnextService } from "../services/erpnext.service.js";

function getDocName(response: any): string | null {
  if (!response) return null;
  if (typeof response === "string") return response;
  if (response.name && typeof response.name === "string") return response.name;
  if (response.message && typeof response.message === "object") {
    const name = getDocName(response.message);
    if (name) return name;
  }
  if (response.data && typeof response.data === "object") {
    const name = getDocName(response.data);
    if (name) return name;
  }
  return null;
}

function logErpnextDebug(stage: string, method: string, doctype: string, name: string | null, payload?: any) {
  const sanitizedPayload = payload && typeof payload === "object"
    ? JSON.parse(JSON.stringify(payload, (key, value) => {
        if (typeof value === "string" && /(cookie|token|authorization|sid|api[_-]?key|api[_-]?secret)/i.test(key)) {
          return "[REDACTED]";
        }
        return value;
      }))
    : payload;

  console.log("[DELIVER]", {
    stage,
    method,
    doctype,
    documentName: name ?? null,
    payload: sanitizedPayload ?? null,
  });
}

async function assertErpnextDocType(doctype: string, headers?: Record<string, string>) {
  try {
    const result = await erpnextService.getResource(doctype, { limit_page_length: 1 }, headers);
    return !!result;
  } catch (error: any) {
    console.error("[DELIVER] DocType validation failed", {
      doctype,
      status: error?.response?.status,
      message: error?.response?.data?.message ?? error?.message,
      details: error?.response?.data,
    });
    throw error;
  }
}

function normalizeOrderItems(order: any) {
  return (order.items || []).map((item: any) => {
    const orderedQty = Number(item.qty ?? item.ordered_qty ?? 0);
    const deliveredQty = Number(item.delivered_qty ?? item.delivered ?? 0);
    const remainingQty = Math.max(0, orderedQty - deliveredQty);

    return {
      item_code: item.item_code,
      item_name: item.item_name || item.name,
      qty: remainingQty,
      rate: Number(item.rate || 0),
      uom: item.uom || item.stock_uom || "Nos",
      warehouse: item.warehouse,
      against_sales_order: order.name,
      so_detail: item.name,
      sales_order: order.name,
      delivery_note: order.delivery_note || null,
      dn_detail: item.dn_detail || item.name,
    };
  }).filter((item: any) => item.item_code && item.qty > 0);
}

async function findExistingDeliveryNoteForOrder(order: any, headers?: Record<string, string>) {
  const deliveryNoteName = order?.delivery_note;
  if (!deliveryNoteName) {
    return null;
  }

  logErpnextDebug("delivery_note_lookup", "GET", "Delivery Note", deliveryNoteName, { name: deliveryNoteName });
  const doc = await erpnextService.getResourceByName("Delivery Note", deliveryNoteName, headers);
  return doc?.data ?? null;
}

async function findExistingSalesInvoiceForOrder(order: any, headers?: Record<string, string>) {
  const invoiceName = order?.sales_invoice;
  if (!invoiceName) {
    return null;
  }

  logErpnextDebug("sales_invoice_lookup", "GET", "Sales Invoice", invoiceName, { name: invoiceName });
  const doc = await erpnextService.getResourceByName("Sales Invoice", invoiceName, headers);
  return doc?.data ?? null;
}

function getErpnextMessage(data: any): any {
  if (!data) return data;
  if (data.message && typeof data.message === "object") return data.message;
  if (data.data && typeof data.data === "object") return data.data;
  return data;
}

async function createSalesInvoiceFromDeliveryNote(order: any, deliveryNoteName: string, headers?: Record<string, string>) {
  const exactDeliveryNote = await erpnextService.getResourceByName<any>("Delivery Note", deliveryNoteName, headers);
  const deliveryNoteItems = exactDeliveryNote?.data?.items ?? [];

  if (!deliveryNoteItems.length) {
    throw new Error(`Created Delivery Note ${deliveryNoteName} has no items to map into a Sales Invoice.`);
  }

  console.log("[DELIVER] STEP 6 - Exact Delivery Note fetched");
  console.log("[DELIVER] Created Delivery Note name:", deliveryNoteName);
  console.log("[DELIVER] Exact Delivery Note items:", JSON.stringify(deliveryNoteItems, null, 2));

  const invoiceItems = (order.items || []).map((salesOrderItem: any) => {
    const matchingDnItem = deliveryNoteItems.find((dnItem: any) =>
      String(dnItem.so_detail ?? "") === String(salesOrderItem.name ?? "")
    );

    if (!matchingDnItem) {
      throw new Error(
        `Created Delivery Note ${deliveryNoteName} has no item matching Sales Order Item ${salesOrderItem.name}`
      );
    }

    console.log("[DELIVER] STEP 7 - Delivery Note item mapping");
    console.log("[DELIVER] SO item name -> DN item name:", {
      salesOrderItemName: salesOrderItem.name,
      dnItemName: matchingDnItem.name,
      so_detail: salesOrderItem.name,
      dn_detail: matchingDnItem.name,
    });

    return {
      item_code: matchingDnItem.item_code ?? salesOrderItem.item_code,
      item_name: matchingDnItem.item_name ?? salesOrderItem.item_name ?? salesOrderItem.name,
      qty: Number(matchingDnItem.qty ?? salesOrderItem.qty ?? 0),
      rate: Number(matchingDnItem.rate ?? salesOrderItem.rate ?? 0),
      uom: matchingDnItem.uom ?? salesOrderItem.uom ?? salesOrderItem.stock_uom ?? "Nos",
      warehouse: matchingDnItem.warehouse ?? salesOrderItem.warehouse ?? null,
      against_sales_order: order.name,
      so_detail: salesOrderItem.name,
      sales_order: order.name,
      delivery_note: deliveryNoteName,
      dn_detail: matchingDnItem.name,
    };
  }).filter((item: any) => item.item_code && Number(item.qty) > 0);

  console.log("[DELIVER] Matched Invoice Items:", JSON.stringify(invoiceItems, null, 2));

  if (!invoiceItems.length) {
    throw new Error(`Created Delivery Note ${deliveryNoteName} has no valid items to invoice for Sales Order ${order.name}.`);
  }

  const invoicePayload = {
    customer: order.customer,
    customer_name: order.customer_name,
    company: order.company,
    posting_date: new Date().toISOString().slice(0, 10),
    items: invoiceItems,
    sales_order: order.name,
    delivery_note: deliveryNoteName,
  };

  console.log("[DELIVER] STEP 8 - Sales Invoice payload");
  console.log("[DELIVER] Final Sales Invoice payload:", JSON.stringify(invoicePayload, null, 2));

  const createdInvoice = await erpnextService.createResource("Sales Invoice", invoicePayload, headers);
  const createdInvoiceData = createdInvoice?.data ?? createdInvoice;

  if (!createdInvoiceData || typeof createdInvoiceData !== "object") {
    throw new Error("ERPNext Sales Invoice creation did not return a valid document.");
  }

  console.log("[DELIVER] STEP 9 - Sales Invoice created");
  console.log("[DELIVER] Created Sales Invoice:", JSON.stringify(createdInvoiceData, null, 2));

  const submittedInvoiceResponse = await erpnextService.callMethod(
    "frappe.client.submit",
    { doc: createdInvoiceData },
    "POST",
    headers
  );

  return getErpnextMessage(submittedInvoiceResponse) ?? createdInvoiceData;
}


export async function deliverSalesOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderName = Array.isArray(req.params.orderName)
      ? req.params.orderName[0]
      : req.params.orderName;
    const requestId = crypto.randomUUID();
    const userCookie = req.headers.cookie || "";
    const headers = userCookie ? { userCookie } : undefined;

    console.log(`[DELIVER ${requestId}] START order=${orderName}`);
    console.log(`[DELIVER ${requestId}] Sales Order loaded:`, orderName);
    const salesOrder = await erpnextService.getResourceByName<any>("Sales Order", orderName, headers);
    const order = salesOrder.data;

    if (!order || Number(order.docstatus) !== 1) {
      return res.status(400).json({
        error: "Sales Order must be submitted before delivery.",
      });
    }

    if (Number(order.per_delivered) >= 100) {
      return res.status(409).json({
        error: "Sales Order has already been fully delivered.",
      });
    }

    console.log("[DELIVER] STEP 1 - Sales Order fetched");
    console.log("[DELIVER] Sales Order payload:", JSON.stringify(order, null, 2));

    await assertErpnextDocType("Sales Order", headers);
    await assertErpnextDocType("Delivery Note", headers);
    await assertErpnextDocType("Sales Invoice", headers);

    const orderItems = Array.isArray(order.items) ? order.items : [];
    const remainingItems = normalizeOrderItems(order);
    const existingInvoice = await findExistingSalesInvoiceForOrder(order, headers);
    const existingDeliveryNote = await findExistingDeliveryNoteForOrder(order, headers);

    console.log("[DELIVER] STEP 2 - Remaining items calculated");
    console.log("[DELIVER] All SO item names:", JSON.stringify(orderItems.map((item: any) => ({
      name: item.name,
      item_code: item.item_code,
      qty: item.qty,
      delivered_qty: item.delivered_qty ?? item.delivered ?? null,
      remaining_qty: Math.max(0, Number(item.qty ?? item.ordered_qty ?? 0) - Number(item.delivered_qty ?? item.delivered ?? 0)),
    })), null, 2));
    console.log("[DELIVER] Remaining items:", JSON.stringify(remainingItems, null, 2));

    if (!remainingItems.length) {
      if (existingInvoice) {
        return res.json({
          success: true,
          delivery_note: existingDeliveryNote?.name ?? null,
          sales_invoice: existingInvoice.name,
          already_delivered: true,
          invoice_created: false,
        });
      }

      return res.status(200).json({
        success: true,
        delivery_note: existingDeliveryNote?.name ?? null,
        sales_invoice: null,
        already_delivered: true,
        invoice_created: false,
        message: "Sales Order has no remaining items to deliver.",
      });
    }

    const deliveryNotePayload = {
      customer: order.customer,
      customer_name: order.customer_name,
      company: order.company,
      posting_date: new Date().toISOString().slice(0, 10),
      items: remainingItems.map((item: any) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        qty: item.qty,
        rate: item.rate,
        uom: item.uom,
        warehouse: item.warehouse,
        against_sales_order: order.name,
        so_detail: item.so_detail,
      })),
    };

    console.log("[DELIVER] STEP 3 - Delivery Note payload");
    console.log("[DELIVER] Delivery Note payload:", JSON.stringify(deliveryNotePayload, null, 2));

    logErpnextDebug("delivery_note_creation", "POST", "Delivery Note", order.name, deliveryNotePayload);
    const createdDeliveryNote = await erpnextService.createResource("Delivery Note", deliveryNotePayload, headers);
    console.log("[DELIVER] STEP 4 - Delivery Note created");
    console.log("[DELIVER] Created Delivery Note response:", JSON.stringify(createdDeliveryNote, null, 2));

    const createdDeliveryNoteName =
      createdDeliveryNote?.data?.name ??
      getDocName(createdDeliveryNote) ??
      null;

    if (!createdDeliveryNoteName) {
      throw new Error("Delivery Note was created but no name was returned");
    }

    console.log("[DELIVER] Exact created Delivery Note name:", createdDeliveryNoteName);

    logErpnextDebug("delivery_note_submission", "POST", "frappe.client.submit", createdDeliveryNoteName, { doc: createdDeliveryNote?.data ?? { name: createdDeliveryNoteName } });
    const submittedDeliveryNote = await erpnextService.callMethod("frappe.client.submit", { doc: createdDeliveryNote?.data ?? { name: createdDeliveryNoteName } }, "POST", headers);
    console.log("[DELIVER] STEP 5 - Delivery Note submitted");
    console.log("[DELIVER] Submitted Delivery Note response:", JSON.stringify(submittedDeliveryNote, null, 2));

    const exactDeliveryNote = await erpnextService.getResourceByName<any>("Delivery Note", createdDeliveryNoteName, headers);
    const exactDeliveryNoteItems = exactDeliveryNote?.data?.items ?? createdDeliveryNote?.data?.items ?? [];
    console.log("[DELIVER] STEP 6 - Exact Delivery Note fetched");
    console.log("[DELIVER] Exact Delivery Note name:", createdDeliveryNoteName);
    console.log("[DELIVER] Exact Delivery Note items:", JSON.stringify(exactDeliveryNoteItems, null, 2));

    if (existingInvoice) {
      return res.json({
        success: true,
        delivery_note: createdDeliveryNoteName,
        sales_invoice: existingInvoice.name,
        already_delivered: false,
        invoice_created: false,
      });
    }

    const createdInvoice = await createSalesInvoiceFromDeliveryNote(order, createdDeliveryNoteName, headers);
    const invoiceName = getDocName(createdInvoice) ?? createdInvoice?.name ?? null;

    return res.json({
      success: true,
      delivery_note: createdDeliveryNoteName,
      sales_invoice: invoiceName,
      already_delivered: false,
      invoice_created: true,
    });
  } catch (error: any) {
    console.error("[DELIVER] ERROR", {
      stage: error?.stage ?? "unknown",
      message: error?.message,
      details: error?.response?.data ?? error,
      stack: error?.stack,
    });
    next(error);
  }
}