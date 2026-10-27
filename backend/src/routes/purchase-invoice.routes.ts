import { Router } from "express";

import {
  getPurchaseInvoices,
  getPurchaseInvoice,
  createPurchaseInvoice,
  amendPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
} from "../controllers/purchase-invoice.controller.js";

const router = Router();

// ============================================================
// PURCHASE INVOICES
// ============================================================

// GET /api/purchase-invoices
router.get(
  "/purchase-invoices",
  getPurchaseInvoices,
);

// GET /api/purchase-invoices/:name
router.get(
  "/purchase-invoices/:name",
  getPurchaseInvoice,
);

// POST /api/purchase-invoices
router.post(
  "/purchase-invoices",
  createPurchaseInvoice,
);

// PUT /api/purchase-invoices/:name
router.put(
  "/purchase-invoices/:name",
  updatePurchaseInvoice,
);

// POST /api/purchase-invoices/:name/amend
router.post(
  "/purchase-invoices/:name/amend",
  amendPurchaseInvoice,
);

// DELETE /api/purchase-invoices/:name
router.delete(
  "/purchase-invoices/:name",
  deletePurchaseInvoice,
);

export default router;