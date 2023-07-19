import { z } from "zod";

export const workflowInputNewSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
})
