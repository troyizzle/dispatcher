import { prisma } from '@/server/db'
import { pusher } from '@/server/pusher'
import type { WebhookEvent } from '@octokit/webhooks-types'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const webhookEvent = req.body as WebhookEvent

  if ("action" in webhookEvent  && webhookEvent.action === "synchronize") {
    if ("pull_request" in webhookEvent) {
      webhookEvent.pull_request.head.ref

      const envs = await prisma.environment.findMany({
        where: {
          currentBranch: webhookEvent.pull_request.head.ref,
          repo: {
            owner: webhookEvent.repository.owner.login,
            name: webhookEvent.repository.name
          }
        },
        include: {
          repo: {
            select: {
              id: true,
            }
          }
        }
      })

      if (envs.length > 0) {
        await prisma.environment.updateMany({
          where: {
            id: {
              in: envs.map((env) => env.id)
            }
          },
          data: {
            status: "OUT_OF_SYNC"
          }
        })

        await pusher.trigger(webhookEvent.repository.name, 'environment-updated', {
          repoIds: envs.map((env) => env.repo.id),
        })
      }
    }
  }

  return res.status(200)
}
