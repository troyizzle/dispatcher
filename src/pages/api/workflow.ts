import { prisma } from '@/server/db'
import { pusher } from '@/server/pusher'
import { workflowSchema, type NextApiRequestWorkflow } from '@/types/next'
import type { NextApiResponse } from 'next'

export default async function handler(req: NextApiRequestWorkflow, res: NextApiResponse) {
  const result = workflowSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json(result.error)
  }

  const workflowData = req.body

  try {
    const env = await prisma.environment.update({
      where: {
        slug: workflowData.env
      },
      data: {
        status: workflowData.status,
        currentBranch: workflowData.branch,
        deployments: {
          create: {
            status: workflowData.status,
            branch: workflowData.branch,
            githash: workflowData.githash
          }
        }
      },
      include: {
        repo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (env) {
      await pusher.trigger(env.repo.name, 'workflow-finished', {
        repoId: env.repo.id,
      })
    }

    return res.status(200)
  } catch (e) {
    console.error(e)
    return res.status(500)
  }
}
