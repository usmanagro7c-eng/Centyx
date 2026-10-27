import { Router } from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";

const analyticsRoutes = Router();
analyticsRoutes.get("/analytics", getAnalytics);

export default analyticsRoutes;