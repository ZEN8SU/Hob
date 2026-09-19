import { prisma } from "../lib/prisma.js";

export const ServiceRequestModel = {
  findById: (id: string) =>
    prisma.service_request.findUnique({
      where: { id },
      include: { booking: true, service: true },
    }),

  findByCustomerId: (customerId: string) =>
    prisma.service_request.findMany({ where: { customerId } }),

  create: (data: { customerId: string; serviceId?: string; scheduledFor: Date }) =>
    prisma.service_request.create({ data: { ...data, status: "pending" } }),

  updateStatus: (id: string, status: string) =>
    prisma.service_request.update({ where: { id }, data: { status } }),
};