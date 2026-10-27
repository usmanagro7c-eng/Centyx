import { Router } from "express";
import { getMyStores, createMyStore } from "../controllers/stores.controller.js";

const storesRouter = Router();

/**
 * GET /api/my-stores
 * Fetch all stores (Website documents) belonging to the authenticated user.
 * Enforces user isolation at backend level.
 */
storesRouter.get("/my-stores", getMyStores);

/**
 * POST /api/my-stores
 * Create a new store (Website document) for the authenticated user.
 * Frappe automatically sets the owner to the current user.
 */
storesRouter.post("/my-stores", createMyStore);

export default storesRouter;
