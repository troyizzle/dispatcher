import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { orgUserInviteNewSchema } from "@/validations/orgUserInvite";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const orgUserRouter = createTRPCRouter({
  byId: protectedProcedure.input(z.object({
    orgId: z.string()
  })).query(async ({ input, ctx }) => {
    const data = await ctx.prisma.orgUsers.findMany({
      where: {
        orgId: input.orgId
      },
      include: {
        user: true
      }
    })

    const currentUser = data.find((orgUser) => orgUser.userId === ctx.session.user.id)

    if (!currentUser || currentUser.role != "ADMIN") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to view this page"
      })
    }

    return data
  }),
  sendInvite: protectedProcedure.input(orgUserInviteNewSchema)
    .mutation(async ({ input, ctx }) => {
      const currentUser = await ctx.prisma.orgUsers.findFirst({
        where: {
          orgId: input.orgId,
          userId: ctx.session.user.id
        }
      })

      if (!currentUser || currentUser.role != "ADMIN") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view this page"
        })
      }

      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: input.email
        }
      })

      if (existingUser) {
        const existingOrgUser = await ctx.prisma.orgUsers.findFirst({
          where: {
            orgId: input.orgId,
            userId: existingUser.id
          }
        })

        if (existingOrgUser) return
      }

      const invite = await ctx.prisma.orgUserInvite.upsert({
        where: {
          orgId_email: {
            orgId: input.orgId,
            email: input.email
          }
        },
        update: {},
        create: {
          orgId: input.orgId,
          email: input.email,
          role: input.role
        }
      })

      return invite
    }),
})

