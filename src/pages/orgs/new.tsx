import Navbar from "@/components/navbar";
import { type OrgNewInput, orgNewSchema } from "@/validations/org";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import { toast } from "@/components/ui/use-toast";
import { type FormEvent } from "react";

function NewOrgForm() {
  const router = useRouter()

  const form = useForm<OrgNewInput>({
    resolver: zodResolver(orgNewSchema),
    mode: "onChange"
  })

  const { mutate } = api.org.create.useMutation({
    onSuccess: async ({ id }) => {
      await router.push(`/orgs/${id}`)
      toast({
        title: "Org created",
        description: "Your org has been created",
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

  function onSubmit(data: OrgNewInput) {
    mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={(event) => {
        event.preventDefault();
        void handleFormSubmit(event);
      }}
      className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormDescription>Enter the name of your organization.</FormDescription>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            variant="default" disabled={!form.formState.isValid} type="submit">Create Org</Button>
        </div>
      </form>
    </Form>
  )
}

export default function Page() {
  const { data: sessionData } = useSession()
  if (!sessionData) {
    // redirect?
    return null
  }

  return <>
    <Navbar user={sessionData.user} />
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-6">
      <h2 className="text-2xl font-bold tracking-tight">Lets create your Org</h2>
      <p className="text-muted-foreground">
        Creating this Org you will be able to create repositories and invite other users to collaborate with you.
      </p>
      <Separator className="my-6" />

      <NewOrgForm />
    </div>
  </>
}
