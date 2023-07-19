import { EnumRole } from "@prisma/client"
import { z } from "zod"

export const orgUserInviteNewSchema = z.object({
  email: z.string().email(),
  orgId: z.string(),
  role: z.enum(
    [EnumRole.ADMIN, EnumRole.MEMBER]
  )
})

export type OrgUserInputNewInput = z.infer<typeof orgUserInviteNewSchema>

export const orgUserInviteReplySchema = z.object({
  id: z.string(),
  accepted: z.boolean()
})

export type OrgUserInviteReplyInput = z.infer<typeof orgUserInviteReplySchema>
