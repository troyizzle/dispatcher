import type { NextApiResponse } from "next";
import { z } from "zod";

export const workflowSchema = z.object({
  branch: z.string(),
  githash: z.string(),
  env: z.string(),
  status: z.string()
})

export type WorkflowInput = z.infer<typeof workflowSchema>

export type NextApiRequestWorkflow = NextApiResponse & {
  body: WorkflowInput
}

