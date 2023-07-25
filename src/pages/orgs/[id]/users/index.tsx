import { columns } from "@/components/columns/orgs/users"
import DataTable from "@/components/data-table"
import Layout from "@/components/layout"
import { OrgSideBar } from "@/components/orgs/sidebar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {  getServerAuthSession } from "@/server/auth"
import { prisma } from "@/server/db"
import { api } from "@/utils/api"
import { type OrgUserInputNewInput, orgUserInviteNewSchema } from "@/validations/orgUserInvite"
import { zodResolver } from "@hookform/resolvers/zod"
import { EnumRole } from "@prisma/client"
import { Loader } from "lucide-react"
import type { GetServerSideProps, InferGetServerSidePropsType } from "next"
import { type User } from "next-auth"
import { useRouter } from "next/router"
import { type FormEvent } from "react"
import { useForm } from "react-hook-form"

type InviteUserFormProps = {
  orgId: string
}

function InviteUserForm({ orgId }: InviteUserFormProps) {
  const form = useForm<OrgUserInputNewInput>({
    resolver: zodResolver(orgUserInviteNewSchema),
    defaultValues: {
      orgId,
    }
  })

  const { mutate } = api.orgUser.sendInvite.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been invited",
      })
      form.reset()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
      })
    }
  })

  function onSubmit(data: OrgUserInputNewInput) {
    mutate(data)
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    await form.handleSubmit(onSubmit)(event)
  }

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={(event) => {
        event.preventDefault()
        void handleFormSubmit(event)
      }}
      >
        <Input type="hidden" {...form.register("orgId")} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={(value) => {
                // TODO: Fix this!
                if (value === "ADMIN") {
                  field.onChange(EnumRole.ADMIN)
                } else {
                  field.onChange(EnumRole.MEMBER)
                }
              }}
                defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={EnumRole.MEMBER}>Member</SelectItem>
                  <SelectItem value={EnumRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="default"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >Invite</Button>
        </div>
      </form>
    </Form>
  )
}

type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Page({ user }: PageProps) {
  const router = useRouter()
  const id = router.query.id as string

  const orgUserQuery = api.orgUser.byId.useQuery({ orgId: id }, {
    enabled: !!id,
  })

  if (orgUserQuery.error) {
    console.error(orgUserQuery.error)
  }

  return (
    <Layout user={user} sidebar={<OrgSideBar />}>
      {orgUserQuery.isLoading && <div className="flex items-center justify-center h-96">
        <Loader className="text-blue-500 animate-spin" />
      </div>}

      <Dialog>
        <div className="flex justify-end">
          <DialogTrigger asChild>
            <Button variant="secondary">Invite</Button>
          </DialogTrigger>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <InviteUserForm orgId={id} />
        </DialogContent>
      </Dialog>


      {orgUserQuery.data && <DataTable data={orgUserQuery.data} columns={columns} />}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<{ user: User }> = async (context) => {
  const session = await getServerAuthSession(context)

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
