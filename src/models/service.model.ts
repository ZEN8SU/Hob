import { prisma } from "../lib/prisma.js";

export const ServiceModel = {
  findAll: () => prisma.service.findMany(),

  findById: (id: string) => prisma.service.findUnique({ where: { id } }),

  findByWorkerId: (workerId: string) =>
    prisma.service.findMany({ where: { workerId } }),

  create: (data: { workerId: string; title: string; category: string; baseRate: number }) =>
    prisma.service.create({ data }),
};