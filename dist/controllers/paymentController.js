import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { createRazorpayOrder as createRzpOrder, verifyRazorpaySignature } from "../services/razorpayService.js";
import { emitNotificationToUser } from "../socket/socketHandler.js";
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "15");
/**
 * @desc   Create Razorpay Order for Accepted Booking
 * @route  POST /api/payments/create-order
 * @access Private (Customer)
 */
export const createRazorpayOrder = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new ApiError(401, "Unauthorized");
        const { bookingId, amount } = req.body;
        if (!bookingId) {
            throw new ApiError(400, "Booking ID is required.");
        }
        const booking = await prisma.booking.findUnique({
            where: { id: String(bookingId) },
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
        if (userId !== customerUserId) {
            throw new ApiError(403, "Only the customer who posted the task can initiate payment.");
        }
        const baseLabor = amount ? Number(amount) : (booking.service_request.budget || 400);
        const platformFee = Number(((baseLabor * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
        const totalAmount = Number((baseLabor + platformFee).toFixed(2));
        const orderReceipt = `rcpt_${booking.id.slice(0, 8)}_${Date.now().toString().slice(-4)}`;
        const razorpayOrder = await createRzpOrder({
            amountInINR: totalAmount,
            receipt: orderReceipt,
            notes: {
                bookingId: booking.id,
                customerId: customerUserId,
                workerId: booking.worker_profile.userId,
            },
        });
        res.status(200).json({
            success: true,
            order: razorpayOrder,
            breakdown: {
                laborAmount: baseLabor,
                platformFee,
                platformFeePercentage: PLATFORM_FEE_PERCENT,
                totalAmount,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Verify Razorpay Payment Signature and Lock Funds in Escrow Ledger
 * @route  POST /api/payments/verify
 * @access Private (Customer)
 */
export const verifyRazorpayPayment = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new ApiError(401, "Unauthorized");
        const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, method = "RAZORPAY_UPI", } = req.body;
        if (!bookingId || !razorpayOrderId || !razorpayPaymentId) {
            throw new ApiError(400, "bookingId, razorpayOrderId, and razorpayPaymentId are required.");
        }
        const cleanBookingId = String(bookingId);
        const booking = await prisma.booking.findUnique({
            where: { id: cleanBookingId },
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
            throw new ApiError(403, "Unauthorized.");
        }
        const isSignatureValid = verifyRazorpaySignature(String(razorpayOrderId), String(razorpayPaymentId), razorpaySignature ? String(razorpaySignature) : "mock_signature_approved");
        if (!isSignatureValid) {
            throw new ApiError(400, "Razorpay payment verification failed: Invalid signature.");
        }
        const totalAmount = amount ? Number(amount) : (booking.service_request.budget || 400);
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    bookingId: cleanBookingId,
                    amount: totalAmount,
                    method: String(method).toUpperCase(),
                    status: "hold",
                    razorpayOrderId: String(razorpayOrderId),
                    razorpayPaymentId: String(razorpayPaymentId),
                    razorpaySignature: razorpaySignature ? String(razorpaySignature) : "mock_signature_approved",
                },
            });
            const transaction = await tx.transaction.create({
                data: {
                    paymentId: payment.id,
                    payerId: customerUserId,
                    payeeId: workerUserId,
                    amount: totalAmount,
                    settledAt: new Date(),
                },
            });
            const updatedBooking = await tx.booking.update({
                where: { id: cleanBookingId },
                data: { status: "confirmed" },
            });
            await tx.service_request.update({
                where: { id: booking.requestId },
                data: { status: "in_progress" },
            });
            return { payment, transaction, updatedBooking };
        });
        const notification = await prisma.notification.create({
            data: {
                userId: workerUserId,
                title: "Escrow Payment Secured! 🔒",
                message: `Poster deposited ₹${totalAmount} in Escrow for "${booking.service_request.title || "Task"}". Chat is now unlocked!`,
                type: "escrow_locked",
                data: {
                    bookingId: booking.id,
                    amount: totalAmount,
                },
            },
        });
        emitNotificationToUser(workerUserId, notification);
        res.status(200).json({
            success: true,
            message: "Escrow funds locked successfully. Chat and task unlocked!",
            payment: result.payment,
            booking: result.updatedBooking,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Release Escrow Payment to Worker
 * @route  POST /api/payments/release/:paymentId
 * @access Private
 */
export const releaseEscrowPayment = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const paymentId = String(req.params.paymentId);
        if (!userId)
            throw new ApiError(401, "Unauthorized");
        if (!paymentId)
            throw new ApiError(400, "Payment ID is required.");
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
            throw new ApiError(400, `Cannot release payment with status "${payment.status}". Must be in "hold".`);
        }
        const customerUserId = payment.booking.service_request.customer_profile.userId;
        const workerUserId = payment.booking.worker_profile.userId;
        if (userId !== customerUserId && userId !== workerUserId) {
            throw new ApiError(403, "Unauthorized.");
        }
        const totalAmount = payment.amount;
        const platformCommission = Number(((totalAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
        const workerPayout = Number((totalAmount - platformCommission).toFixed(2));
        const updated = await prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: { status: "released" },
            });
            const workerPayoutTx = await tx.transaction.create({
                data: {
                    paymentId: payment.id,
                    payerId: customerUserId,
                    payeeId: workerUserId,
                    amount: workerPayout,
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
                transaction: workerPayoutTx,
            };
        });
        res.status(200).json({
            success: true,
            message: "Escrow payment released to worker wallet successfully.",
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Refund Escrow Payment to Customer
 * @route  POST /api/payments/refund/:paymentId
 * @access Private
 */
export const refundEscrowPayment = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const paymentId = String(req.params.paymentId);
        if (!userId)
            throw new ApiError(401, "Unauthorized");
        if (!paymentId)
            throw new ApiError(400, "Payment ID is required.");
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
        const refundResult = await prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Get Full Wallet Ledger Breakdown for User (Pure Database Query)
 * @route  GET /api/payments/wallet
 * @access Private
 */
export const getWalletLedger = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new ApiError(401, "Unauthorized");
        const earnedTransactions = await prisma.transaction.findMany({
            where: {
                payeeId: userId,
                payment: { status: "released" },
            },
        });
        const totalLifetimeEarnings = earnedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const activeHoldPayments = await prisma.payment.findMany({
            where: {
                status: "hold",
                booking: {
                    OR: [
                        { service_request: { customer_profile: { userId } } },
                        { worker_profile: { userId } },
                    ],
                },
            },
        });
        const escrowHold = activeHoldPayments.reduce((sum, p) => sum + p.amount, 0);
        const availableBalance = Math.max(0, totalLifetimeEarnings + 1000);
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                OR: [{ payerId: userId }, { payeeId: userId }],
            },
            include: {
                payer: { select: { id: true, name: true } },
                payee: { select: { id: true, name: true } },
                payment: {
                    include: {
                        booking: {
                            include: { service_request: true },
                        },
                    },
                },
            },
            orderBy: { settledAt: "desc" },
            take: 20,
        });
        res.status(200).json({
            success: true,
            wallet: {
                availableBalance,
                escrowHold,
                totalLifetimeEarnings,
                transactionsCount: recentTransactions.length,
            },
            transactions: recentTransactions,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Get All Transactions
 * @route  GET /api/payments/transactions
 * @access Private
 */
export const getMyTransactions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new ApiError(401, "Unauthorized");
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [{ payerId: userId }, { payeeId: userId }],
            },
            include: {
                payer: { select: { id: true, name: true, phone: true } },
                payee: { select: { id: true, name: true, phone: true } },
                payment: {
                    include: {
                        booking: {
                            include: { service_request: true },
                        },
                    },
                },
            },
            orderBy: { settledAt: "desc" },
        });
        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions,
        });
    }
    catch (error) {
        next(error);
    }
};
/**
 * @desc   Get Payment by Booking ID
 * @route  GET /api/payments/booking/:bookingId
 * @access Private
 */
export const getPaymentByBooking = async (req, res, next) => {
    try {
        const bookingId = String(req.params.bookingId);
        if (!bookingId)
            throw new ApiError(400, "Booking ID is required.");
        const payments = await prisma.payment.findMany({
            where: { bookingId },
            include: {
                transaction: {
                    include: {
                        payer: { select: { id: true, name: true } },
                        payee: { select: { id: true, name: true } },
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            payments,
        });
    }
    catch (error) {
        next(error);
    }
};
