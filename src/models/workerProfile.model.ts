import { prisma } from "../lib/prisma.js";

export const WorkerProfileModel = {
  findByUserId: (userId: string) =>
    prisma.worker_profile.findFirst({ where: { userId } }),

  findAvailable: () =>
    prisma.worker_profile.findMany({ where: { isAvailable: true } }),

  create: (data: { userId: string; skills: string; hourlyRate: number; isAvailable?: boolean }) =>
    prisma.worker_profile.create({ data }),

  setAvailability: (id: string, isAvailable: boolean) =>
    prisma.worker_profile.update({ where: { id }, data: { isAvailable } }),
};