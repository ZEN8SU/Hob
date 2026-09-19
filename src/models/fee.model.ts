import { prisma } from "../lib/prisma.js";

export const FeeModel = {
  findByBookingId: (bookingId: string) =>
    prisma.fee.findFirst({ where: { bookingId } }),

  create: (data: { bookingId: string; durationMinutes: number; laborAmount: number; platformFee: number; totalAmount: number }) =>
    prisma.fee.create({ data }),
};