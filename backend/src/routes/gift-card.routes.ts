import { Router } from "express";
import { getGiftCards } from "../controllers/gift-card.controller.js";

const router = Router();

router.get("/gift-cards", getGiftCards);

export default router;
