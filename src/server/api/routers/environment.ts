import { z } from "zod"

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const environmentRouter = createTRPCRouter({
  setDeploying: protectedProcedure.input(z.object({
    id: z.string(),
    url: z.string()
  })).mutation(async ({ input, ctx }) => {
    const environment = await ctx.prisma.environment.findUnique({
      where: {
        id: input.id
      },
      include: {
        repo: {
          include: {
            Org: {
              include: {
                OrgUsers: true
              }
            }
          }
        }
      }
    })

    if (!environment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Environment not found"
      })
    }

    const orgUser = environment.repo.Org.OrgUsers.find(orgUser => orgUser.userId === ctx.session.user.id)

    if (!orgUser) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to view this page"
      })
    }

    return ctx.prisma.environment.update({
      where: {
        id: input.id
      },
      data: {
        status: "DEPLOYING",
        currentUrl: input.url
      }
    })
  }),
  update: protectedProcedure.input(
    z.object({
      id: z.string(),
      status: z.string()
    })
  ).mutation(({ input, ctx }) => {
    // TODO: Set an API Key or something in the github action
    return ctx.prisma.environment.update({
      where: {
        id: input.id
      },
      data: {
        status: input.status
      }
    })
  }),
})
