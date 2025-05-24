import { z } from "zod";

export const vehicleSchema = z.object({
  make: z.string(),
  vehicleModel: z.string(),
  year: z.number().int().gte(1990),
  license: z.string().min(3),
  leasePrice: z.number().optional(),
  imageUrl: z.string().url().optional(),
});