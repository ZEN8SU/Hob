import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error | ApiError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error("[ERROR]", err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[])?.join(", ") || "field";
        res.status(409).json({
          success: false,
          message: `A record with this ${target} already exists.`,
          code: err.code,
        });
        return;
      }
      case "P2025": {
        res.status(404).json({
          success: false,
          message: "The requested record was not found.",
          code: err.code,
        });
        return;
      }
      case "P2003": {
        res.status(400).json({
          success: false,
          message: "Foreign key constraint failed.",
          code: err.code,
        });
        return;
      }
      default:
        res.status(400).json({
          success: false,
          message: `Database error: ${err.message}`,
          code: err.code,
        });
        return;
    }
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      message: "Invalid token. Please authenticate again.",
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      message: "Token expired. Please log in again.",
    });
    return;
  }

  // Fallback 500
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

