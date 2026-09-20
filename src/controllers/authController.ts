import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

const DEFAULT_DEV_OTP = "123456";

/**
 * @desc   Request OTP for Phone Login/Signup
 * @route  POST /api/auth/send-otp
 * @access Public
 */
export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      throw new ApiError(400, "Please provide a valid phone number (at least 10 digits).");
    }

    const cleanPhone = phone.trim();

    // Simulated SMS Gateway in Development
    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone}. (For dev testing, use OTP: ${DEFAULT_DEV_OTP})`,
      devOtp: DEFAULT_DEV_OTP,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Verify OTP, Register/Login User, and Issue JWT
 * @route  POST /api/auth/verify-otp
 * @access Public
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, otp, name, email, age } = req.body;

    if (!phone || !otp) {
      throw new ApiError(400, "Phone number and OTP are required.");
    }

    if (otp !== DEFAULT_DEV_OTP) {
      throw new ApiError(400, "Invalid OTP. Use dev OTP: 123456");
    }

    const cleanPhone = phone.trim();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: {
        customer_profile: true,
        worker_profile: true,
      },
    });

    if (!user) {
      // Auto-register new user
      const defaultName = name?.trim() || `User_${cleanPhone.slice(-4)}`;
      const defaultEmail = email?.trim() || `${cleanPhone}@hyperlocal.in`;
      const parsedAge = age ? Number(age) : 18;

      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: defaultName,
          email: defaultEmail,
          age: parsedAge,
        },
        include: {
          customer_profile: true,
          worker_profile: true,
        },
      });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_hyperlocal_2025";
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
      },
      secret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Authentication successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        createdAt: user.createdAt,
        customerProfile: user.customer_profile,
        workerProfiles: user.worker_profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get Current Logged-in User Profile & Identities
 * @route  GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customer_profile: true,
        worker_profile: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        createdAt: user.createdAt,
        customerProfile: user.customer_profile,
        workerProfiles: user.worker_profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

