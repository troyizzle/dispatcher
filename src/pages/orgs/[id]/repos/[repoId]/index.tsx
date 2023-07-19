import ItemCard from "@/components/item-card"
import OctokitProvider, { useOctokit } from "@/context/octokit-context"
import { api } from "@/utils/api"
import { PlusIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { useRouter } from "next/router"
import { FormEvent, useState } from "react"
import { Form, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Environment, WorkflowInput } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import type { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { type User, getServerSession } from "next-auth"
import { authOptions } from "@/server/auth"
import { prisma } from "@/server/db"
import Layout from "@/components/layout"

type EnvFormProps = {
  env: Environment
  inputs: WorkflowInput[]
  workflowId: number
}

function EnvForm({ env, inputs, workflowId }: EnvFormProps) {
  const [branchOpen, setBranchOpen] = useState(false)
  const [deployBranchOpen, setDeployBranchOpen] = useState(false)
  const { deployAction, pullRequests } = useOctokit()
  const utils = api.useContext()

  const availableBranches = [{ branchName: 'main', sha: '' }, ...pullRequests]

  const envDispatchSchema = z.object({
    ref: z.string(),
    "env-action": z.string({
      required_error: "Environment is required"
    }),
    branch: z.string({
      required_error: "Branch is required"
    }),
    "data-action": z.string({
      required_error: "Data is required"
    }),
    "run-reflect": z.boolean().default(false),
    url: z.string({
      required_error: "URL is required"
    })
  })

  const { mutate } = api.environment.setDeploying.useMutation({
    onSuccess: async () => {
      await utils.repo.byId.invalidate()

      toast({
        title: "Deploying",
        description: "Your environment is being deployed"
      })
    },
    onError: (err) => {
      console.error(err)
    },
  })

  const form = useForm<z.infer<typeof envDispatchSchema>>({
    resolver: zodResolver(envDispatchSchema),
    defaultValues: {
      ref: 'main',
      "env-action": env.slug,
      branch: inputs.find((input) => input.description === 'Branch')?.defaultValue ?? '',
      "data-action": 'none',
      url: ""
    }
  })

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    await form.handleSubmit(onSubmit)(event);
  };

  function onSubmit(data: z.infer<typeof envDispatchSchema>) {
    const { ref, url, ...rest } = data

    try {
      mutate({ id: env.id, url: url })
      deployAction(workflowId, ref, rest)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        void handleFormSubmit(event);
      }
      }>
        <FormField
          control={form.control}
          name="ref"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workflow Branch</FormLabel>
              <FormDescription>Use workflow from</FormDescription>
              <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={branchOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? availableBranches.find((pr) => pr.branchName === field.value)?.branchName
                      : "Select branch..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <div className="flex items-center">
                      <CommandInput placeholder="Search branches..." />
                    </div>
                    <CommandEmpty>No branches found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea
                        className="h-72">
                        {availableBranches.map((pr) => (
                          <CommandItem
                            value={pr.branchName}
                            key={pr.branchName}
                            onSelect={(currentValue) => {
                              field.onChange(currentValue)
                              setBranchOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === pr.branchName ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {pr.branchName}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />

        <Input type="hidden" {...form.register('env-action')} />
        <Input type="hidden" {...form.register('data-action')} />
        <Input type="hidden" {...form.register('url')} />

        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <FormDescription>Deploy Branch</FormDescription>
              <Popover open={deployBranchOpen} onOpenChange={setDeployBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={deployBranchOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? pullRequests.find((pr) => pr.branchName === field.value)?.branchName
                      : "Select branch..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <div className="flex items-center">
                      <CommandInput placeholder="Search branches..." />
                    </div>
                    <CommandEmpty>No branches found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea
                        className="h-72">
                        {pullRequests.map((pr) => (
                          <CommandItem
                            value={pr.branchName}
                            key={pr.branchName}
                            onSelect={(currentValue) => {
                              field.onChange(currentValue)
                              setDeployBranchOpen(false)

                              form.setValue('url', pullRequests.find((pr) => pr.branchName === currentValue)?.url ?? '')
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === pr.branchName ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {pr.branchName}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            disabled={!form.formState.isValid || form.formState.isSubmitting || env.status == "DEPLOYING"}
            type="submit">Deploy</Button>
        </div>
      </form>
    </Form >
  )
}

// TODO: Make this configurable
function JiraLink({ url }: { url: string }) {
  const jiraId = url.match(/(?<=PD-)\d+/g)

  if (!jiraId) {
    return null
  }

  return (
    <Link
      className="text-blue-300"
      target="_blank"
      rel="noopener noreferrer"
      href={`https://wellbe.atlassian.net/browse/PD-${jiraId[0]}`}>
      Jira
    </Link>
  )
}

type EnvCardProps = {
  env: Environment
  inputs: WorkflowInput[]
  workflowId: number
}

function EnvCard({ env, inputs, workflowId }: EnvCardProps) {
  const badgeText = env.status
  const { currentBranch, currentUrl } = env

  let badge: JSX.Element | null = null

  switch (env.status) {
    case "DEPLOYING":
      badge = <Badge variant="outline" className="bg-blue-500">
        <span className="mr-2">
          <LoaderIcon className="animate-spin h-4 w-4" />
        </span>{badgeText}
      </Badge>
      break
    case "DEPLOYED":
      badge = <Badge variant="outline" className="bg-green-500">{badgeText}</Badge>
      break
    case "OUT_OF_SYNC":
      badge = <Badge
        variant="outline" className="bg-yellow-500">
        {badgeText}
      </Badge>
      break
    case "FAILED":
      badge = <Badge variant="outline" className="bg-red-500">{badgeText}</Badge>
      break
  }

  return (
    <ItemCard title={env.slug} className="min-h-[500px]" secondary={badge}>
      {currentBranch && (
        <div>
          {currentUrl && (
            <div>
              <p>
                Github PR: <Link
                  className="text-blue-300"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={currentUrl}>{currentBranch}</Link>
              </p>

              <p>Jira Story: <JiraLink url={currentUrl} /></p>
              <p>Hash: {env.currentHash ? env.currentHash.slice(0, 6) : ''} </p>
            </div>
          )}
        </div>
      )}
      <EnvForm env={env} inputs={inputs} workflowId={workflowId} />
    </ItemCard>

  )
}

type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Page({ user }: PageProps) {
  const router = useRouter()
  const id = router.query.id as string
  const repoId = router.query.repoId as string

  const repoQuery = api.repo.byId.useQuery({ id: repoId }, {
    enabled: !!repoId,
  })

  return (
    <Layout user={user}>
      <div className="flex grow flex-col">
        <div className="flex w-full flex-col-reverse items-center justify-between gap-4 px-6 md:flex-row">
          <span className="text-3xl font-medium">Envs</span>
          <Link href={`/orgs/${id}/repos/${repoId}/envs/new`}
            className="hidden items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 md:inline-flex"
          >
            <PlusIcon className="w-5 h-5 fill-white" />
            <span className="hidden lg:block">Create a new Env</span>
          </Link>
        </div>
      </div>
      {repoQuery.isLoading && <div className="flex-grow flex items-center justify-center">
        <LoaderIcon className="text-blue-500" />
      </div>}
      {repoQuery.data &&
        <OctokitProvider
          authToken={repoQuery.data.authToken}
          repo={repoQuery.data.name}
          owner={repoQuery.data.owner}
        >
          <ul className="flex  w-full flex-col items-center justify-center gap-2 overflow-y-auto p-6 md:grid md:grid-cols-2 md:gap-0 lg:grid-cols-3" role="list">
            {repoQuery.data.Environment.map((env) => (
              <li key={env.id} className="col-span-1 w-full max-w-sm">
                <EnvCard env={env} inputs={repoQuery.data.workflowInputs} workflowId={repoQuery.data.workflowId} />
              </li>
            ))}
          </ul>
        </OctokitProvider>
      }
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<{ user: User }> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/?errorMessage=session',
        permanent: false,
      },
    }
  }

  const data = await prisma.orgUsers.findUnique({
    where: {
      orgId_userId: {
        orgId: context.params?.id as string,
        userId: session.user.id
      }
    }
  })

  if (!data) {
    return {
      redirect: {
        destination: '/?errorMessage=notAdmin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: session.user
    },
  }
}
