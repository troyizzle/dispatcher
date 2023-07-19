import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { orgUserInviteReplySchema } from "@/validations/orgUserInvite";
import { TRPCError } from "@trpc/server";

export const orgUserInviteRouter = createTRPCRouter({
  replyToInvite: protectedProcedure.input(orgUserInviteReplySchema)
  .mutation(async ({ input, ctx }) => {
    const invite = await ctx.prisma.orgUserInvite.findFirst({
      where: {
        id: input.id,
      }
    })

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invite not found"
      })
    }

    if (invite.accepted) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invite already accepted"
      })
    }

    if (invite.email !== ctx.session.user.email) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to view this page"
      })
    }

    if (input.accepted) {
      await ctx.prisma.orgUsers.create({
        data: {
          orgId: invite.orgId,
          userId: ctx.session.user.id,
          role: invite.role
        }
      })
    }

    await ctx.prisma.orgUserInvite.update({
      where: {
        id: input.id
      },
      data: {
        accepted: input.accepted
      }
    })

    return true
  })
})

