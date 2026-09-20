import { Router } from "express";
import {
  createEscrowPayment,
  releaseEscrowPayment,
  refundEscrowPayment,
  getPaymentByBooking,
  getMyTransactions,
} from "../controllers/paymentController.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateJWT);

router.post("/escrow", createEscrowPayment);
router.post("/release/:paymentId", releaseEscrowPayment);
router.post("/refund/:paymentId", refundEscrowPayment);
router.get("/booking/:bookingId", getPaymentByBooking);
router.get("/transactions", getMyTransactions);

export default router;

