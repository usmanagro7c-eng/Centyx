import { Router } from "express";
import { getAllBins, getProductBin } from "../controllers/inventory.controller.js";

const router = Router();

router.get("/inventory/bin/:itemCode", getProductBin);
router.get("/inventory/bins", getAllBins);

export default router;
