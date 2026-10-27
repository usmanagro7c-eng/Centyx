import { Router } from "express";
import { deliverSalesOrder } from "../controllers/order.controller.js";

const router = Router();

router.post("/orders/:orderName/deliver", deliverSalesOrder);

export default router;