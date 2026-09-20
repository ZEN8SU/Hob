import { Router } from "express";
import {
  upsertCustomerProfile,
  createWorkerProfile,
  updateWorkerProfile,
  getMyProfiles,
  getAllWorkers,
  getWorkerById,
} from "../controllers/userController.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

// Profile management
router.post("/customer-profile", authenticateJWT, upsertCustomerProfile);
router.post("/worker-profile", authenticateJWT, createWorkerProfile);
router.put("/worker-profile/:id", authenticateJWT, updateWorkerProfile);
router.get("/my-profiles", authenticateJWT, getMyProfiles);

// Hyperlocal Worker discovery
router.get("/workers", getAllWorkers);
router.get("/workers/:id", getWorkerById);

export default router;

