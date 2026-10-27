import { Router } from "express";
import { getCustomers } from "../controllers/customer.controller.js";

const customerRoutes = Router();

customerRoutes.get("/customers", getCustomers);

export default customerRoutes;