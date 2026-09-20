import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { ApiError } from "./errorHandler.js";

export interface AuthenticatedUser {
  id: string;
  phone: string;
  email: string;
  name: string;
  age: number | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Access denied. No Bearer token provided.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Access denied. Malformed authorization header.");
    }

    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_hyperlocal_2025";
    const decoded = jwt.verify(token, secret) as { id: string; phone: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        age: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

