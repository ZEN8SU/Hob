import { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  releaseEscrowPayment,
  refundEscrowPayment,
  getPaymentByBooking,
  getMyTransactions,
  getWalletLedger,
} from "../controllers/paymentController.js";
import { authenticateJWT } from "../middlewares/auth.js";

const router = Router();

router.use(authenticateJWT);

// Razorpay Order Creation & Verification
router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);

// Escrow Release & Refund
router.post("/release/:paymentId", releaseEscrowPayment);
router.post("/refund/:paymentId", refundEscrowPayment);

// Wallet Ledger & History
router.get("/wallet", getWalletLedger);
router.get("/transactions", getMyTransactions);
router.get("/booking/:bookingId", getPaymentByBooking);

export default router;
