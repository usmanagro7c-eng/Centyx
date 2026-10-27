import { Router } from "express";
import productRoutes from "./product.routes.js";
import purchaseOrderRoutes from "./purchase-order.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import giftCardRoutes from "./gift-card.routes.js";
import storesRoutes from "./stores.routes.js";
import purchaseInvoiceRoutes from "./purchase-invoice.routes.js";
import saleInvoiceRoutes from "./sale-invoice.routes.js";
import orderRoutes from "./order.routes.js";
import customerRoutes from "./customer.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import { handleGenericProxy } from "../controllers/proxy.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAjaxHeader } from "../middlewares/csrf.middleware.js";

const apiRouter = Router();

// Public, read-only, field-limited endpoints.
apiRouter.use("/", productRoutes);
apiRouter.use("/", inventoryRoutes);

// CSRF protection for state-changing requests.
apiRouter.use(requireAjaxHeader);

// Authenticated routes — requireAuth scoped to each path prefix.
apiRouter.use("/purchase-orders", requireAuth);
apiRouter.use("/", purchaseOrderRoutes);

apiRouter.use("/gift-cards", requireAuth);
apiRouter.use("/", giftCardRoutes);

apiRouter.use("/my-stores", requireAuth);
apiRouter.use("/", storesRoutes);

apiRouter.use("/purchase-invoices", requireAuth);
apiRouter.use("/", purchaseInvoiceRoutes);

apiRouter.use("/sales-invoices", requireAuth);
apiRouter.use("/", saleInvoiceRoutes);

apiRouter.use("/orders", requireAuth);
apiRouter.use("/", orderRoutes);

apiRouter.use("/customers", requireAuth);
apiRouter.use("/", customerRoutes);

apiRouter.use("/analytics", requireAuth);
apiRouter.use("/", analyticsRoutes);

// Pass-through proxy routes to ERPNext REST API for resources & methods.
// Auth is enforced inside the handler for non-public methods.
apiRouter.all("/resource/*", handleGenericProxy);
apiRouter.all("/method/*", handleGenericProxy);

export default apiRouter;
