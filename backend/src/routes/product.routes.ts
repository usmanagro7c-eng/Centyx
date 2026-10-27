import { Router } from "express";
import { getProducts, getProductById, getItemGroups } from "../controllers/product.controller.js";

const router = Router();

router.get("/products", getProducts);
router.get("/products/item-groups", getItemGroups);
router.get("/products/:itemCode", getProductById);

export default router;
