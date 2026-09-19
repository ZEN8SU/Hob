import { prisma } from "../lib/prisma.js";

export const BookingModel = {
  findById: (id: string) =>
    prisma.booking.findUnique({
      where: { id },
      include: { fee: true, payment: true, review: true },
    }),

  create: (data: { requestId: string; workerId: string; status?: string }) =>
    prisma.booking.create({ data }),

  updateStatus: (id: string, status: string) =>
    prisma.booking.update({ where: { id }, data: { status } }),

  markStarted: (id: string) =>
    prisma.booking.update({ where: { id }, data: { startedAt: new Date(), status: "in_progress" } }),

  markCompleted: (id: string) =>
    prisma.booking.update({ where: { id }, data: { completedAt: new Date(), status: "completed" } }),
};