import { prisma } from "../lib/prisma.js";

export const TransactionModel = {
  create: (data: { paymentId: string; payerId: string; payeeId: string; amount: number }) =>
    prisma.transaction.create({ data }),

  findByUser: (userId: string) =>
    prisma.transaction.findMany({
      where: { OR: [{ payerId: userId }, { payeeId: userId }] },
    }),
};