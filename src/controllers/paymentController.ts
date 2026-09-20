import { Response, NextFunction } from "express";
import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "15");

/**
 * @desc   Create Escrow Payment (Hold Funds for Confirmed Booking)
 * @route  POST /api/payments/escrow
 * @access Private (Customer)
 */
export const createEscrowPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { bookingId, amount, method } = req.body;

    if (!bookingId || amount === undefined) {
      throw new ApiError(400, "bookingId and amount are required.");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service_request: {
          include: { customer_profile: true },
        },
        worker_profile: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    const customerUserId = booking.service_request.customer_profile.userId;
    const workerUserId = booking.worker_profile.userId;

    if (userId !== customerUserId) {
      throw new ApiError(403, "Only the customer who posted the task can initiate escrow payment.");
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new ApiError(400, "A valid positive payment amount is required.");
    }

    const paymentMethod = (method || "UPI").toUpperCase();

    // Perform Escrow Creation & Ledger Transaction atomically
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Payment record in HOLD status
      const payment = await tx.payment.create({
        data: {
          bookingId,
          amount: numericAmount,
          method: paymentMethod,
          status: "hold", // Escrow Hold
        },
      });

      // 2. Record initial Escrow Inbound Transaction in Ledger
      const transaction = await tx.transaction.create({
        data: {
          paymentId: payment.id,
          payerId: customerUserId,
          payeeId: workerUserId,
          amount: numericAmount,
          settledAt: new Date(),
        },
      });

      return { payment, transaction };
    });

    res.status(201).json({
      success: true,
      message: "Escrow funds locked successfully. Worker can now begin task.",
      payment: result.payment,
      ledgerTransaction: result.transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Release Escrow Payment to Worker Ledger (85% Worker Payout, 15% Platform Fee)
 * @route  POST /api/payments/release/:paymentId
 * @access Private
 */
export const releaseEscrowPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!paymentId) throw new ApiError(400, "Payment ID is required.");

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            service_request: {
              include: { customer_profile: true },
            },
            worker_profile: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, "Payment record not found.");
    }

    if (payment.status !== "hold") {
      throw new ApiError(
        400,
        `Cannot release payment with status "${payment.status}". Payment must be in "hold" status.`
      );
    }

    const customerUserId = payment.booking.service_request.customer_profile.userId;
    const workerUserId = payment.booking.worker_profile.userId;

    if (userId !== customerUserId && userId !== workerUserId) {
      throw new ApiError(403, "You are not authorized to release this escrow payment.");
    }

    const totalAmount = payment.amount;
    const platformCommission = Number(((totalAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
    const workerPayout = Number((totalAmount - platformCommission).toFixed(2));

    // Atomically release escrow & write ledger splits
    const updated = await prisma.$transaction(async (tx: any) => {
      // 1. Update Payment status to released
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: "released" },
      });

      // 2. Record 85% Worker Settlement Transaction
      const workerPayoutTx = await tx.transaction.create({
        data: {
          paymentId: payment.id,
          payerId: customerUserId,
          payeeId: workerUserId,
          amount: workerPayout,
          settledAt: new Date(),
        },
      });

      // 3. Record 15% Platform Commission Transaction
      const platformFeeTx = await tx.transaction.create({
        data: {
          paymentId: payment.id,
          payerId: customerUserId,
          payeeId: customerUserId, // platform ledger representation
          amount: platformCommission,
          settledAt: new Date(),
        },
      });

      return {
        payment: updatedPayment,
        payoutBreakdown: {
          totalAmount,
          workerPayout,
          workerPayoutPercentage: 100 - PLATFORM_FEE_PERCENT,
          platformCommission,
          platformCommissionPercentage: PLATFORM_FEE_PERCENT,
        },
        transactions: [workerPayoutTx, platformFeeTx],
      };
    });

    res.status(200).json({
      success: true,
      message: "Escrow payment successfully released to Worker.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Refund Escrow Payment to Customer
 * @route  POST /api/payments/refund/:paymentId
 * @access Private
 */
export const refundEscrowPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { paymentId } = req.params;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!paymentId) throw new ApiError(400, "Payment ID is required.");

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            service_request: {
              include: { customer_profile: true },
            },
            worker_profile: true,
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, "Payment record not found.");
    }

    if (payment.status !== "hold") {
      throw new ApiError(400, `Cannot refund payment with status "${payment.status}".`);
    }

    const customerUserId = payment.booking.service_request.customer_profile.userId;

    const refundResult = await prisma.$transaction(async (tx: any) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: "refunded" },
      });

      const refundTx = await tx.transaction.create({
        data: {
          paymentId: payment.id,
          payerId: payment.booking.worker_profile.userId,
          payeeId: customerUserId,
          amount: payment.amount,
          settledAt: new Date(),
        },
      });

      return { updatedPayment, refundTx };
    });

    res.status(200).json({
      success: true,
      message: "Escrow funds refunded back to customer successfully.",
      data: refundResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Payment & Ledger Details for a Booking
 * @route  GET /api/payments/booking/:bookingId
 * @access Private
 */
export const getPaymentByBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) throw new ApiError(400, "Booking ID is required.");

    const payments = await prisma.payment.findMany({
      where: { bookingId },
      include: {
        transaction: {
          include: {
            payer: { select: { id: true, name: true, phone: true } },
            payee: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Ledger Transactions for Current User
 * @route  GET /api/payments/transactions
 * @access Private
 */
export const getMyTransactions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ payerId: userId }, { payeeId: userId }],
      },
      include: {
        payer: { select: { id: true, name: true, phone: true } },
        payee: { select: { id: true, name: true, phone: true } },
        payment: {
          include: {
            booking: true,
          },
        },
      },
      orderBy: {
        settledAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

