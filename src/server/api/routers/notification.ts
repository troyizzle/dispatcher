import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export type NotificationWithInvites = {
  id: string
  type: string
  inviteId?: string
  orgId?: string
  orgName?: string
  accepted?: boolean
}

export const notificationRouter = createTRPCRouter({
  markAsRead: protectedProcedure.input(z.object({
    id: z.string()
  })).mutation(async ({ input, ctx }) => {
    const notification = await ctx.prisma.notification.findUnique({
      where: {
        id: input.id
      }
    })

    if (!notification) {
      return
    }

    if (notification.userId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to view this page"
      })
    }

    return await ctx.prisma.notification.update({
      where: {
        id: input.id
      },
      data: {
        read: true
      }
    })
  }),
  allUser: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.$queryRaw<NotificationWithInvites[]>(
      Prisma.sql`SELECT "Notification".id,
        "Notification".type,
        invite.accepted as "accepted",
        invite.id as "inviteId",
        org.name as "orgName"
      FROM "Notification"
        LEFT JOIN "OrgUserInvite" invite ON invite."id" = data->>'inviteId'
        LEFT JOIN "Org" org ON invite."orgId" = org."id"
      WHERE "userId" = ${ctx.session.user.id}
        AND "read" = false
      ORDER BY "createdAt" DESC
      LIMIT 10
      `
    )
  })
})
