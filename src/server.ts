import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security & Parsing Middlewares
app.use(cors() as any);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root & Health Endpoints
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Hyperlocal P2P Micro-Tasking Platform API is running.",
    version: "1.0.0",
    docs: "/health",
  });
});

app.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "degraded",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 and Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`?? Hyperlocal Micro-Task Server live on port ${PORT}`);
  console.log(`?? Base URL: http://localhost:${PORT}`);
  console.log(`?? Health Check: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down server gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed. Process terminated.");
    process.exit(0);
  });
});

export default app;

