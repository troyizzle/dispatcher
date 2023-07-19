import { createContext, useContext, useEffect, useState } from "react"
import { Octokit } from "octokit";
import Pusher from "pusher-js";
import { api } from "@/utils/api";

type OctokitContext = {
  octokit: Octokit | null
  pullRequests: {
    branchName: string
    sha: string,
    url: string
  }[]
  deployAction: (workflowId: number, ref: string, inputs?: { [key: string]: unknown }) => void
}
const OctokitContext = createContext({} as OctokitContext)

export function useOctokit() {
  return useContext(OctokitContext)
}

type OctoikitProviderProps = {
  authToken: string
  repo: string
  owner: string
  children: React.ReactNode
}

export default function OctokitProvider({ authToken, repo, owner, children }: OctoikitProviderProps) {
  const [pullRequests, setPullRequests] = useState<OctokitContext['pullRequests']>([])

  const octokit = new Octokit({ auth: authToken })
  const utils = api.useContext()

  useEffect(() => {
    if (pullRequests.length > 0) return

    octokit.rest.pulls.list({
      repo: repo,
      owner: owner,
      state: 'open'
    }).then(({ data }) => {
      setPullRequests(data.map((pr) => ({
        branchName: pr.head.ref,
        sha: pr.head.sha,
        url: pr.html_url
      })))
    }).catch((err) => {
      console.error(err)
    })

  }, [pullRequests])

  useEffect(() => {
    const pusher = new Pusher("49675545254bcb1e30ce", {
      cluster: "us2"
    })

    const channel = pusher.subscribe(repo)

    channel.bind('workflow-finished', async function(data: {
      repoId: string
    }) {
      await utils.repo.byId.invalidate({
        id: data.repoId
      })
    })

    channel.bind('environment-updated', async function(data: {
      repoIds: string[]
    }) {
      await Promise.all(data.repoIds.map((id) => utils.repo.byId.invalidate({
        id: id
      })))
    })

  }, [])

  function deployAction(workflowId: number, ref: string, inputs?: {
    [key: string]: unknown
  }) {
    if (!octokit) return

    octokit.rest.actions.createWorkflowDispatch({
      owner: owner,
      repo: repo,
      workflow_id: workflowId,
      ref: ref,
      inputs: inputs
    }).then((res) => {
      console.log(res)
    }).catch((err) => {
      console.log(err)
    })
  }

  return (
    <OctokitContext.Provider value={{
      octokit,
      pullRequests,
      deployAction
    }}>
      {children}
    </OctokitContext.Provider>
  )
}
