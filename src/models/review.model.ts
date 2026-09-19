import { prisma } from "../lib/prisma.js";

export const ReviewModel = {
  create: (data: { bookingId: string; reviewerId: string; revieweeId: string; rating: number; comment?: string }) =>
    prisma.review.create({ data }),

  findByRevieweeId: (revieweeId: string) =>
    prisma.review.findMany({ where: { revieweeId } }),
};