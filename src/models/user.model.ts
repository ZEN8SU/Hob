import { prisma } from "../lib/prisma.js";

export const UserModel = {
  findAll: () => prisma.user.findMany(),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  create: (data: { name: string; email: string; phone: string; age?: number }) =>
    prisma.user.create({ data }),

  update: (id: string, data: Partial<{ name: string; email: string; phone: string }>) =>
    prisma.user.update({ where: { id }, data }),
};