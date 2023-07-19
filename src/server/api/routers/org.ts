import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { orgNewSchema } from "@/validations/org";
import { EnumRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const orgRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.org.findMany({
      where: {
        OrgUsers: {
          some: {
            userId: ctx.session.user.id
          }
        }
      }
    })
  }),
  byId: protectedProcedure.input(z.object({
    id: z.string()
  })).query(async ({ input, ctx }) => {
    const data = await ctx.prisma.org.findUnique({
      where: {
        id: input.id
      },
      include: {
        repos: true,
        OrgUsers: true
      }
    })

    if (!data?.OrgUsers.find(orgUser => orgUser.userId === ctx.session.user.id)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    return data
  }),
  create: protectedProcedure.input(orgNewSchema)
    .mutation(({ input, ctx }) => {
      return ctx.prisma.org.create({
        data: {
          name: input.name,
          OrgUsers: {
            create: {
              userId: ctx.session.user.id,
              role: EnumRole.ADMIN
            }
          }
        }
      })
    })
})
