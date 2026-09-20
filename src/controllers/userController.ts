import { Response, NextFunction } from "express";
import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

/**
 * @desc   Create or Update Customer Profile (Task Poster Identity)
 * @route  POST /api/users/customer-profile
 * @access Private
 */
export const upsertCustomerProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { address } = req.body;
    if (!address || typeof address !== "string" || !address.trim()) {
      throw new ApiError(400, "Address is required for Customer Profile.");
    }

    const customerProfile = await prisma.customer_profile.upsert({
      where: { userId },
      update: { address: address.trim() },
      create: {
        userId,
        address: address.trim(),
        avgRating: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Customer profile saved successfully.",
      profile: customerProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create Worker Profile (Tasker / Earner Identity)
 * @route  POST /api/users/worker-profile
 * @access Private
 */
export const createWorkerProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { skills, hourlyRate, isAvailable } = req.body;

    if (!skills || typeof skills !== "string" || !skills.trim()) {
      throw new ApiError(400, "Skills description/tags are required.");
    }

    if (hourlyRate === undefined || isNaN(Number(hourlyRate)) || Number(hourlyRate) < 0) {
      throw new ApiError(400, "A valid positive hourlyRate is required.");
    }

    const workerProfile = await prisma.worker_profile.create({
      data: {
        userId,
        skills: skills.trim(),
        hourlyRate: Number(hourlyRate),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        avgRating: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Worker profile created successfully.",
      profile: workerProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update existing Worker Profile
 * @route  PUT /api/users/worker-profile/:id
 * @access Private
 */
export const updateWorkerProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!id) throw new ApiError(400, "Worker profile ID is required.");

    const existingProfile = await prisma.worker_profile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      throw new ApiError(404, "Worker profile not found.");
    }

    if (existingProfile.userId !== userId) {
      throw new ApiError(403, "Forbidden: You do not own this worker profile.");
    }

    const { skills, hourlyRate, isAvailable } = req.body;

    const updatedProfile = await prisma.worker_profile.update({
      where: { id },
      data: {
        ...(skills !== undefined ? { skills: String(skills).trim() } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate: Number(hourlyRate) } : {}),
        ...(isAvailable !== undefined ? { isAvailable: Boolean(isAvailable) } : {}),
      },
    });

    res.status(200).json({
      success: true,
      message: "Worker profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get All Profiles (Customer & Worker) for Current User
 * @route  GET /api/users/my-profiles
 * @access Private
 */
export const getMyProfiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer_profile: true,
        worker_profile: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!user) throw new ApiError(404, "User not found.");

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        customerProfile: user.customer_profile,
        workerProfiles: user.worker_profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Search & Browse Available Workers (Hyperlocal Discovery)
 * @route  GET /api/users/workers
 * @access Public / Private
 */
export const getAllWorkers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skill, availableOnly, minRating } = req.query;

    const where: any = {};

    if (availableOnly === "true" || availableOnly === undefined) {
      where.isAvailable = true;
    }

    if (skill && typeof skill === "string") {
      where.skills = {
        contains: skill,
        mode: "insensitive",
      };
    }

    if (minRating && !isNaN(Number(minRating))) {
      where.avgRating = {
        gte: Number(minRating),
      };
    }

    const workers = await prisma.worker_profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
        service: true,
      },
      orderBy: {
        avgRating: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Specific Worker Profile Details
 * @route  GET /api/users/workers/:id
 * @access Public / Private
 */
export const getWorkerById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Worker profile ID is required.");

    const worker = await prisma.worker_profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
        service: true,
        booking: {
          take: 5,
          orderBy: { startedAt: "desc" },
          include: {
            review: true,
          },
        },
      },
    });

    if (!worker) {
      throw new ApiError(404, "Worker profile not found.");
    }

    res.status(200).json({
      success: true,
      worker,
    });
  } catch (error) {
    next(error);
  }
};

