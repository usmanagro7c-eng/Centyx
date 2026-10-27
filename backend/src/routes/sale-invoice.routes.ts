import { Router } from "express";

import {
  getSalesInvoices,
  getSalesInvoiceById,
  createSalesInvoice,
  updateSalesInvoice,
} from "../controllers/sale-invoice.controller.js";

const router = Router();

/**
 * GET /api/sales-invoices
 * Fetch Sales Invoices from ERPNext
 */
router.get("/sales-invoices", getSalesInvoices);

/**
 * POST /api/sales-invoices
 * Create Sales Invoice
 */
router.post("/sales-invoices", createSalesInvoice);

/**
 * GET /api/sales-invoices/:id
 * Fetch single Sales Invoice from ERPNext
 */
router.get("/sales-invoices/:id", getSalesInvoiceById);

/**
 * PUT /api/sales-invoices/:id
 * Update Sales Invoice
 */
router.put("/sales-invoices/:id", updateSalesInvoice);

export default router;