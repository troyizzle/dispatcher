import { z } from "zod"

export const orgNewSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }).min(3, {
    message: "Name must be at least 3 characters",
  }).max(50, {
    message: "Name must be at most 50 characters",
  }),
})

export type OrgNewInput = z.infer<typeof orgNewSchema>
