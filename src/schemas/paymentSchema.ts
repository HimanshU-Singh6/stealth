import { z } from "zod";

export const paymentSchema = z.object({
  leaseId: z.string(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  paidAt: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
});