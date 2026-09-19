import { prisma } from "../lib/prisma.js";

export const PaymentModel = {
  findByBookingId: (bookingId: string) =>
    prisma.payment.findFirst({ where: { bookingId } }),

  create: (data: { bookingId: string; amount: number; method: string; status?: string }) =>
    prisma.payment.create({ data }),

  markCompleted: (id: string) =>
    prisma.payment.update({ where: { id }, data: { status: "completed" } }),
};