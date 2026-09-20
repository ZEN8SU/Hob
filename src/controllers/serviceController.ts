import { Response, NextFunction } from "express";
import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

/**
 * @desc   Create a Service Offering by Worker
 * @route  POST /api/services
 * @access Private (Worker)
 */
export const createService = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { title, category, baseRate, workerId } = req.body;

    if (!title || !category || baseRate === undefined) {
      throw new ApiError(400, "Title, category, and baseRate are required.");
    }

    // Determine target worker_profile
    let targetWorkerProfileId = workerId;

    if (!targetWorkerProfileId) {
      const workerProfile = await prisma.worker_profile.findFirst({
        where: { userId },
      });

      if (!workerProfile) {
        throw new ApiError(
          400,
          "No WorkerProfile found for your account. Please create a worker profile first."
        );
      }
      targetWorkerProfileId = workerProfile.id;
    } else {
      const workerProfile = await prisma.worker_profile.findUnique({
        where: { id: targetWorkerProfileId },
      });

      if (!workerProfile || workerProfile.userId !== userId) {
        throw new ApiError(403, "You do not own this worker profile.");
      }
    }

    const service = await prisma.service.create({
      data: {
        workerId: targetWorkerProfileId,
        title: title.trim(),
        category: category.trim(),
        baseRate: Number(baseRate),
      },
      include: {
        worker_profile: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Service listing created successfully.",
      service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get All Services (Catalog Search & Filter)
 * @route  GET /api/services
 * @access Public
 */
export const getAllServices = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, minRate, maxRate } = req.query;

    const where: any = {};

    if (category && typeof category === "string") {
      where.category = {
        contains: category,
        mode: "insensitive",
      };
    }

    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (minRate || maxRate) {
      where.baseRate = {};
      if (minRate) where.baseRate.gte = Number(minRate);
      if (maxRate) where.baseRate.lte = Number(maxRate);
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        worker_profile: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
      orderBy: {
        baseRate: "asc",
      },
    });

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Service by ID
 * @route  GET /api/services/:id
 * @access Public
 */
export const getServiceById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Service ID is required.");

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        worker_profile: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        service_request: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create a Service Request (Post a Micro-Job Need)
 * @route  POST /api/services/requests
 * @access Private (Customer)
 */
export const createServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { serviceId, scheduledFor, address } = req.body;

    if (!scheduledFor) {
      throw new ApiError(400, "scheduledFor (ISO DateTime) is required.");
    }

    // Ensure user has a customer_profile
    let customerProfile = await prisma.customer_profile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      if (!address || typeof address !== "string") {
        throw new ApiError(
          400,
          "No Customer Profile found. Please provide an `address` to create your customer profile."
        );
      }
      customerProfile = await prisma.customer_profile.create({
        data: {
          userId,
          address: address.trim(),
          avgRating: 0,
        },
      });
    }

    // If serviceId is provided, verify it exists
    if (serviceId) {
      const existingService = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!existingService) {
        throw new ApiError(404, "Target service not found.");
      }
    }

    const serviceRequest = await prisma.service_request.create({
      data: {
        customerId: customerProfile.id,
        serviceId: serviceId || null,
        scheduledFor: new Date(scheduledFor),
        status: "pending",
      },
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
    });

    res.status(201).json({
      success: true,
      message: "Micro-task request posted successfully.",
      request: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get All Service Requests (Browse Open Gigs / Tasks)
 * @route  GET /api/services/requests/feed
 * @access Public / Private
 */
export const getAllServiceRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status = "pending" } = req.query;

    const requests = await prisma.service_request.findMany({
      where: {
        ...(status ? { status: String(status) } : {}),
      },
      include: {
        customer_profile: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        service: true,
        booking: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Service Requests Posted By Authenticated User
 * @route  GET /api/services/requests/my
 * @access Private
 */
export const getMyServiceRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const customerProfile = await prisma.customer_profile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      res.status(200).json({
        success: true,
        count: 0,
        requests: [],
      });
      return;
    }

    const requests = await prisma.service_request.findMany({
      where: {
        customerId: customerProfile.id,
      },
      include: {
        service: true,
        booking: {
          include: {
            worker_profile: {
              include: {
                user: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

