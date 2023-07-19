import { z } from "zod"

export const envNewSchema = z.object({
  slug: z.string({
    required_error: "Name is required",
  }).min(3, {
    message: "Name must be at least 3 characters",
  }).max(50, {
    message: "Name must be at most 50 characters",
  }),
  status: z.string({
    required_error: "Status is required",
  })
})

export type EnvNewInput = z.infer<typeof envNewSchema>
