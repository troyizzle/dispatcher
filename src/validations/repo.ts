import { z } from "zod"
import { envNewSchema } from "./env"
import { workflowInputNewSchema } from "./workflowInput"

export const repoNewSchema = z.object({
  authToken: z.string({
    required_error: "Auth token is required",
  }),
  name: z.string({
    required_error: "Name is required",
  }).min(3, {
    message: "Name must be at least 3 characters",
  }).max(50, {
    message: "Name must be at most 50 characters",
  }),
  owner: z.string({
    required_error: "Owner is required",
  }).min(3, {
    message: "Owner must be at least 3 characters",
  }).max(50, {
    message: "Owner must be at most 50 characters",
  }),
  orgId: z.string({
    required_error: "Org ID is required",
  }),
  workflowName: z.string({
    required_error: "Workflow name is required",
  }),
  workflowId: z.number({
    required_error: "Workflow ID is required",
  }),
  workflowPath: z.string({
    required_error: "Workflow path is required",
  }),
  workflowInputs: z.array(workflowInputNewSchema).optional(),
  Environment: z.array(envNewSchema).optional(),
})

export type RepoNewInput = z.infer<typeof repoNewSchema>
