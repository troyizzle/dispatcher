import { createTRPCRouter } from "@/server/api/trpc";
import { environmentRouter } from "./routers/environment";
import { repoRouter } from "./routers/repo";
import { orgRouter } from "./routers/org";
import { orgUserRouter } from "./routers/orgUser";
import { notificationRouter } from "./routers/notification";
import { orgUserInviteRouter } from "./routers/orgUserInvite";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  environment: environmentRouter,
  notification: notificationRouter,
  org: orgRouter,
  orgUser: orgUserRouter,
  orgUserInvite: orgUserInviteRouter,
  repo: repoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
