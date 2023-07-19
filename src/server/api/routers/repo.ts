import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { repoNewSchema } from "@/validations/repo";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const repoRouter = createTRPCRouter({
  byId: protectedProcedure.input(z.object({
    id: z.string()
  })).query(async ({ input, ctx }) => {
    const data = await ctx.prisma.repo.findUnique({
      where: {
        id: input.id
      },
      include: {
        Environment: {
          orderBy: {
            slug: 'asc'
          }
        },
        workflowInputs: true,
        Org: {
          include: {
            OrgUsers: true
          }
        }
      }
    })

    if (!data?.Org.OrgUsers.find(orgUser => orgUser.userId === ctx.session.user.id)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    return data
  }),
  all: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.repo.findMany({
      where: {
        orgId: {
          in: await ctx.prisma.orgUsers.findMany({
            where: {
              userId: ctx.session.user.id
            },
            select: {
              orgId: true
            }
          }).then(orgs => orgs.map(org => org.orgId))
        }
      }
    })
  }),
  create: protectedProcedure.input(repoNewSchema)
    .mutation(async ({ input , ctx }) => {
      const { workflowInputs, Environment, ...data } = input

      const orgUser = await ctx.prisma.orgUsers.findFirst({
        where: {
          orgId: input.orgId,
          userId: ctx.session.user.id
        }
      })

      if (!orgUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to create repo in this org"
        })
      }

      return ctx.prisma.repo.create({
          data: {
            ...data,
            Environment: {
              createMany: {
                data: Environment ?? []
              }
            },
            workflowInputs: {
              createMany: {
                data: workflowInputs ?? []
              }
            }
          }
      })
    }),
})
