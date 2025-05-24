import { z } from "zod";

export const leaseSchema = z.object({
  userId: z.string(),
  vehicleId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  autoRenew: z.boolean().optional(),
  documentUrl: z.string().url().optional(),
});