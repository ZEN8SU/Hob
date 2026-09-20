import { Response, NextFunction } from "express";
import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "15");

/**
 * @desc   Create / Assign Booking for a Service Request
 * @route  POST /api/bookings
 * @access Private
 */
export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { requestId, workerId } = req.body;

    if (!requestId || !workerId) {
      throw new ApiError(400, "requestId and workerId are required.");
    }

    const serviceRequest = await prisma.service_request.findUnique({
      where: { id: requestId },
      include: { customer_profile: true },
    });

    if (!serviceRequest) {
      throw new ApiError(404, "Service request not found.");
    }

    const workerProfile = await prisma.worker_profile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });

    if (!workerProfile) {
      throw new ApiError(404, "Worker profile not found.");
    }

    // Verify caller is either the Customer or the Worker
    const isCustomer = serviceRequest.customer_profile.userId === userId;
    const isWorker = workerProfile.userId === userId;

    if (!isCustomer && !isWorker) {
      throw new ApiError(403, "You are not authorized to initiate this booking.");
    }

    // Prevent duplicate active bookings for the same request and worker
    const existingActiveBooking = await prisma.booking.findFirst({
      where: {
        requestId,
        workerId,
        status: { notIn: ["cancelled"] },
      },
    });

    if (existingActiveBooking) {
      throw new ApiError(400, "An active booking already exists for this task and worker.");
    }

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          requestId,
          workerId,
          status: "confirmed",
        },
        include: {
          service_request: {
            include: {
              customer_profile: {
                include: {
                  user: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
              service: true,
            },
          },
          worker_profile: {
            include: {
              user: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      prisma.service_request.update({
        where: { id: requestId },
        data: { status: "assigned" },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully.",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update Booking State Machine (PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED / CANCELLED)
 * @route  PATCH /api/bookings/:id/status
 * @access Private
 */
export const updateBookingStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status, durationMinutes, customLaborAmount } = req.body;

    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!id) throw new ApiError(400, "Booking ID is required.");

    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      throw new ApiError(
        400,
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    const targetStatus = status.toLowerCase();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service_request: {
          include: {
            customer_profile: true,
            service: true,
          },
        },
        worker_profile: true,
        fee: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    const customerUserId = booking.service_request.customer_profile.userId;
    const workerUserId = booking.worker_profile.userId;

    if (userId !== customerUserId && userId !== workerUserId) {
      throw new ApiError(403, "You do not have permission to update this booking.");
    }

    const currentStatus = booking.status.toLowerCase();

    if (currentStatus === "completed" || currentStatus === "cancelled") {
      throw new ApiError(400, `Cannot update booking that is already ${currentStatus}.`);
    }

    // State Transition Logic
    let updateData: any = { status: targetStatus };

    if (targetStatus === "in_progress") {
      updateData.startedAt = booking.startedAt || new Date();
      // Set worker as busy
      await prisma.worker_profile.update({
        where: { id: booking.workerId },
        data: { isAvailable: false },
      });
    } else if (targetStatus === "completed") {
      updateData.completedAt = new Date();

      // Free worker up
      await prisma.worker_profile.update({
        where: { id: booking.workerId },
        data: { isAvailable: true },
      });

      // Update Service Request status
      await prisma.service_request.update({
        where: { id: booking.requestId },
        data: { status: "completed" },
      });

      // Calculate and record Fee breakdown if not already created
      if (booking.fee.length === 0) {
        const minutes = durationMinutes ? Number(durationMinutes) : 60;
        const hours = minutes / 60;

        let labor = customLaborAmount ? Number(customLaborAmount) : 0;
        if (!labor) {
          if (booking.service_request.service?.baseRate) {
            labor = booking.service_request.service.baseRate;
          } else {
            labor = (booking.worker_profile.hourlyRate || 200) * hours;
          }
        }

        const platformCommission = Number(((labor * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
        const total = Number((labor + platformCommission).toFixed(2));

        await prisma.fee.create({
          data: {
            bookingId: booking.id,
            durationMinutes: minutes,
            laborAmount: labor,
            platformFee: platformCommission,
            totalAmount: total,
          },
        });
      }
    } else if (targetStatus === "cancelled") {
      // Free worker up
      await prisma.worker_profile.update({
        where: { id: booking.workerId },
        data: { isAvailable: true },
      });

      await prisma.service_request.update({
        where: { id: booking.requestId },
        data: { status: "cancelled" },
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        service_request: {
          include: {
            customer_profile: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
        worker_profile: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        fee: true,
        payment: true,
        review: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${targetStatus}.`,
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Booking Details by ID
 * @route  GET /api/bookings/:id
 * @access Private
 */
export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!id) throw new ApiError(400, "Booking ID is required.");

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service_request: {
          include: {
            customer_profile: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
            service: true,
          },
        },
        worker_profile: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        fee: true,
        payment: {
          include: {
            transaction: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get All Bookings for Authenticated User (As Customer or As Worker)
 * @route  GET /api/bookings
 * @access Private
 */
export const getUserBookings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { role } = req.query; // "customer" | "worker" | "all"

    const customerProfile = await prisma.customer_profile.findUnique({
      where: { userId },
    });

    const workerProfiles = await prisma.worker_profile.findMany({
      where: { userId },
    });

    const workerProfileIds = workerProfiles.map((w: { id: string }) => w.id);

    let whereClause: any = {};

    if (role === "customer" && customerProfile) {
      whereClause = {
        service_request: {
          customerId: customerProfile.id,
        },
      };
    } else if (role === "worker" && workerProfileIds.length > 0) {
      whereClause = {
        workerId: { in: workerProfileIds },
      };
    } else {
      whereClause = {
        OR: [
          ...(customerProfile ? [{ service_request: { customerId: customerProfile.id } }] : []),
          ...(workerProfileIds.length > 0 ? [{ workerId: { in: workerProfileIds } }] : []),
        ],
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        service_request: {
          include: {
            customer_profile: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
            service: true,
          },
        },
        worker_profile: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        fee: true,
        payment: true,
        review: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

