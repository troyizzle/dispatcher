import Navbar from "@/components/navbar";
import { useSession } from "next-auth/react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import { toast } from "@/components/ui/use-toast";
import { useState, type FormEvent, type ReactNode, useEffect } from "react";
import { type RepoNewInput, repoNewSchema } from "@/validations/repo";
import { Octokit } from "octokit";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, LoaderIcon, PlusCircleIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import yaml from "js-yaml"
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { User, getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import Layout from "@/components/layout";

function NewRepoForm() {
  const [octokit, setOctokit] = useState<Octokit | null>(null)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repos, setRepos] = useState<{ name: string, owner: string }[]>([])
  const [workflows, setWorkflows] = useState<{ id: number, name: string, path: string }[]>([])
  const [repoOpen, setRepoOpen] = useState(false)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [repoPage, setRepoPage] = useState(1)
  const [isMoreRepos, setIsMoreRepos] = useState(false)
  const [workflowDispatchStatus, setWorkflowDispatchStatus] = useState<ReactNode | null>(null)
  const router = useRouter()

  const form = useForm<RepoNewInput>({
    resolver: zodResolver(repoNewSchema),
    defaultValues: {
      authToken: "",
      orgId: router.query.id as string,
      name: "",
      owner: "",
      workflowId: 0,
      workflowPath: "",
      workflowName: "",
      Environment: [],
      workflowInputs: []
    }
  })

  const watch = form.watch

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const authTokenValue = value.authToken
      if (!authTokenValue || authTokenValue == "") return

      if (authTokenValue) {
        fetchRepos(authTokenValue).catch(e => {
          console.error("error", e)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  const { fields } = useFieldArray({
    control: form.control,
    name: "workflowInputs"
  })

  const { fields: envFields } = useFieldArray({
    control: form.control,
    name: "Environment"
  })

  const context = api.useContext()

  const { mutate } = api.repo.create.useMutation({
    onSuccess: async ({ orgId }) => {
      await context.org.byId.invalidate()

      await router.push(`/orgs/${orgId}`)
      toast({
        title: "Repo created",
        description: "Your repo has been created",
      })
    },
    onError: (error) => {
      console.error(error)

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  })

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    await form.handleSubmit(onSubmit)(event);
  };

  function onSubmit(data: RepoNewInput) {
    mutate(data)
  }

  async function fetchRepos(authToken: string) {
    try {
      setLoadingRepos(true)
      const octoClient = new Octokit({ auth: authToken })
      setOctokit(octoClient)

      const data = await octoClient.rest.repos.listForAuthenticatedUser({
        page: repoPage
      })
      const mappedData = data.data.map((data) => {
        return {
          name: data.name,
          owner: data.owner.login
        }
      })

      if (mappedData.length === 30) {
        setIsMoreRepos(true)
      }

      setRepos(mappedData)
    } catch (e) {
      console.error(e)

      toast({
        title: "Error fetching repos, are you sure thats the correct auth token?",
        variant: "destructive"
      })
    } finally {
      setLoadingRepos(false)
    }
  }

  const REPO_PER_PAGE_COUNT = 30

  function loadMoreRepos() {
    if (!octokit || loadingRepos || !isMoreRepos) return

    try {
      setLoadingRepos(true)
      octokit.rest.repos.listForAuthenticatedUser({
        page: repoPage + 1
      }).then((data) => {
        const response = data.data.map((data) => {
          return {
            name: data.name,
            owner: data.owner.login
          }
        })

        if (response.length === 0) {
          setIsMoreRepos(false)
          return
        }

        if (response.length == REPO_PER_PAGE_COUNT) {
          setIsMoreRepos(true)
        }

        setRepos(prevRepos => [...prevRepos, ...response])
        setRepoPage(prevPage => prevPage + 1)
      }).catch((e) => {
        console.error(e)
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingRepos(false)
    }
  }

  function fetchWorkflows() {
    if (!octokit) return

    try {
      octokit.rest.actions.listRepoWorkflows({
        owner: form.getValues("owner"),
        repo: form.getValues("name"),
      }).then((data) => {
        console.log(data)
        setWorkflows(data.data.workflows.map((workflow) => {
          return {
            id: workflow.id,
            name: workflow.name,
            path: workflow.path
          }
        }))
      }).catch((e) => {
        console.error(e)
      })
    } catch (e) {
      toast({
        title: "Error fetching workflows, are you sure thats the correct auth token?",
        variant: "destructive"
      })
      console.log(e)
    }
  }

  type WorkflowDispatchInput = {
    on: {
      workflow_dispatch?: {
        inputs: {
          [key: string]: {
            description: string,
            type: string,
            default?: string,
            options?: string[],
            required: boolean
          }
        }
      }
    }
  }

  function fetchAndParseWorkflow() {
    if (!octokit) return
    if (workflowDispatchStatus != null) return;
    if (form.getValues("workflowInputs")?.[0]) return

    setWorkflowDispatchStatus(<div>Loading</div>)

    octokit.rest.repos.getContent({
      owner: form.getValues("owner"),
      repo: form.getValues("name"),
      path: form.getValues("workflowPath")
    }).then(({ data }) => {
      // TODO: Check out why this isn't on the octokit type
      const overrideData = data as { content: string }
      setWorkflowDispatchStatus(<div>Found that workflowPath</div>)
      const content = atob(overrideData.content)
      const doc = yaml.load(content) as WorkflowDispatchInput

      if (doc.on.workflow_dispatch) {
        console.log(Object.entries(doc.on.workflow_dispatch.inputs))
        const parsedInputs = Object.entries(doc.on.workflow_dispatch.inputs).map(([key, value]) => ({
          name: key,
          description: value.description,
          type: value.type,
          required: value.required,
          defaultValue: value.default ?? "",
          options: value.options ?? []
        }))

        form.setValue("workflowInputs", parsedInputs, {
          shouldValidate: true
        })

        // TODO: Probably a way to determine this
        const envInput = parsedInputs.find((input) => input.description == "Environment")
        if (envInput) {
          form.setValue("Environment", envInput.options.map((option) => ({
            slug: option,
            status: 'active'
          })))
        }

        setWorkflowDispatchStatus(null)
      } else {
        setWorkflowDispatchStatus(<div>No workflow dispatch found</div>)
      }
    }).catch(e => {
      console.error(e)

      toast({
        title: "Error fetching workflow, are you sure thats the correct auth token?",
        variant: "destructive"
      })
    })
  }

  const showRepoName = repos.length > 0 || loadingRepos

  return (
    <Form {...form}>
      <form onSubmit={(event) => {
        event.preventDefault();
        void handleFormSubmit(event);
      }}
        className="space-y-8">
        <Input type="hidden" {...form.register("orgId")} />

        <FormField
          control={form.control}
          name="authToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auth Token</FormLabel>
              <FormDescription>Enter the auth token for your repo. This should have access to the repos and as well have access to write and read to actions</FormDescription>
              <FormControl>
                <Input
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem
              className={cn(showRepoName ? "" : "hidden")}>
              <FormLabel>Name</FormLabel>
              <FormDescription>Great, now choose the repo you would like to set up</FormDescription>
              {loadingRepos ? (<Skeleton className="w-full h-8" />) : (
                <Popover open={repoOpen} onOpenChange={setRepoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={repoOpen}
                      className="w-full justify-between"
                    >
                      {field.value
                        ? repos.find((repo) => repo.name === field.value)?.name
                        : "Select Repo..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <div className="flex items-center">
                        <CommandInput placeholder="Search repos..." />
                        {isMoreRepos && (
                          loadingRepos ? (
                            <LoaderIcon className="ml-2 h-6 w-6 fill-white-300 text-green-300" />
                          ) : (<PlusCircleIcon
                            onClick={() => loadMoreRepos()}
                            role="button"
                            className="ml-2 h-6 w-6 fill-white-300 text-green-300" />
                          )
                        )
                        }
                      </div>
                      <CommandEmpty>No repos found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea
                          className="h-72">
                          {repos.map((repo) => (
                            <CommandItem
                              value={`${repo.owner}/${repo.name}`}
                              key={repo.name}
                              onSelect={(currentValue) => {
                                const [owner, name] = currentValue.split("/")
                                if (owner && name) {
                                  form.setValue("owner", owner)
                                  form.setValue("name", name)
                                  fetchWorkflows()
                                }
                                setRepoOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === repo.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {repo.name}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              < FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormLabel>Owner</FormLabel>
              <FormDescription>Enter the owner of the Repo</FormDescription>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workflowName"
          render={({ field }) => (
            <FormItem
              className={cn(workflows.length > 0 ? "" : "hidden")}>
              <FormLabel>Workflow Name</FormLabel>
              <FormDescription>This is the workflow that will be available to use on the envs, it should have some sort of dispatch manager options.</FormDescription>
              <Popover open={workflowOpen} onOpenChange={setWorkflowOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={workflowOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? workflows.find((workflow) => workflow.name.toLowerCase() === field.value)?.name
                      : "Select Workflow..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search repos..." />
                    <CommandEmpty>No Workflows Found</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea
                        className="h-72">
                        {workflows.map((workflow) => (
                          <CommandItem
                            value={`${workflow.name}&${workflow.id}&${workflow.path}`}
                            key={workflow.id}
                            onSelect={(currentValue) => {
                              const [name, id, path] = currentValue.split("&")
                              if (name && id && path) {
                                form.setValue("workflowName", name, {
                                  shouldValidate: true
                                })
                                form.setValue("workflowId", +id, {
                                  shouldValidate: true
                                })
                                form.setValue("workflowPath", path, {
                                  shouldValidate: true
                                })
                                fetchAndParseWorkflow()
                              }
                              setWorkflowOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === workflow.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {workflow.name}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              < FormMessage />
            </FormItem>

          )}
        />

        {workflowDispatchStatus && (
          <div>{workflowDispatchStatus}</div>
        )}

        {fields.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {['Name', 'Description', 'Type', 'Required', 'Default', 'Options'].map((header, index) => (
                  <TableHead key={index}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`workflowInputs.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <Input readOnly={true} {...field} />
                        </FormItem>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`workflowInputs.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <Input readOnly={true} {...field} />
                        </FormItem>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`workflowInputs.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <Input readOnly={true} {...field} />
                        </FormItem>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`workflowInputs.${index}.required`}
                      render={({ field }) => (
                        <FormItem>
                          <Checkbox
                            checked={field.value}
                            disabled={true}
                          />
                        </FormItem>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    {field.defaultValue ? (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`workflowInputs.${index}.defaultValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default</FormLabel>
                            <Input readOnly={true} {...field} />
                          </FormItem>
                        )}
                      />
                    ) :
                      <div></div>
                    }
                  </TableCell>

                  <TableCell>
                    {field.options && field.options.length > 0 && (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`workflowInputs.${index}.options`}
                        render={() => (
                          <FormItem>
                            {field.options?.map((option, optionIndex) => (
                              <FormField
                                key={option}
                                control={form.control}
                                name={`workflowInputs.${index}.options.${optionIndex}`}
                                render={() => (
                                  <FormItem
                                    key={option}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={true}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    <FormLabel className="font-normal">
                                      {option}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </FormItem>
                        )}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table >

        )}

        {envFields.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {['Slug'].map((header, index) => (
                  <TableHead key={index}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {envFields.map((_field, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`Environment.${index}.slug`}
                      render={({ field }) => (
                        <FormItem>
                          <Input readOnly={true} {...field} />
                        </FormItem>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <FormField
                      key={index}
                      control={form.control}
                      name={`Environment.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <Input readOnly={true} {...field} />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table >

        )}

        <div className="flex justify-end">
          <Button
            disabled={form.formState.isSubmitting || !form.formState.isValid}
            variant="default"
            type="submit">
            Create Repo
          </Button>
        </div>
      </form>
    </Form >
  )
}


type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Page({ user }: PageProps) {
  return (
    <Layout user={user}>
      <h2 className="text-2xl font-bold tracking-ti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ght">Lets create your Repo</h2>
      <p className="text-muted-foreground">
        This is where you will manage your repos.
      </p>
      <Separator className="my-6" />

      <NewRepoForm />

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

  if (!data || data.role != 'ADMIN') {
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
