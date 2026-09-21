import { Router } from "express";
import { sendOtp, verifyOtp, getMe } from "../controllers/authController.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", authenticateJWT, getMe);

export default router;
