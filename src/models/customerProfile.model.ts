import { prisma } from "../lib/prisma.js";

export const CustomerProfileModel = {
  findByUserId: (userId: string) =>
    prisma.customer_profile.findUnique({ where: { userId } }),

  create: (data: { userId: string; address: string }) =>
    prisma.customer_profile.create({ data }),

  update: (id: string, data: Partial<{ address: string; avgRating: number }>) =>
    prisma.customer_profile.update({ where: { id }, data }),
};