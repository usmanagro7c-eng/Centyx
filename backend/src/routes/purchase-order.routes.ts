import { Router } from "express";
import { getPurchaseOrders, createPurchaseOrder } from "../controllers/purchase-order.controller.js";

const router = Router();

router.get("/purchase-orders", getPurchaseOrders);
router.post("/purchase-orders", createPurchaseOrder);

export default router;
