import { Router } from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  createServiceRequest,
  getAllServiceRequests,
  getMyServiceRequests,
} from "../controllers/serviceController.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

// Service Catalog
router.post("/", authenticateJWT, createService);
router.get("/", getAllServices);
router.get("/requests/feed", getAllServiceRequests);
router.get("/requests/my", authenticateJWT, getMyServiceRequests);
router.post("/requests", authenticateJWT, createServiceRequest);
router.get("/:id", getServiceById);

export default router;

