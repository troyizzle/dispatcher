import ItemCard from "@/components/item-card";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { PlusIcon } from "@radix-ui/react-icons";
import { Loader } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const { data: sessionData } = useSession()

  const orgQuery = api.org.all.useQuery(undefined, {
    enabled: !!sessionData
  })

  if (!sessionData) {
    return (
      <Button onClick={() => void signIn()}>Sign in</Button>
    )
  }

  return (
    <>
      <Head>
        <title>Github Staging</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout user={sessionData.user}>
        <div className="flex w-full flex-col-reverse items-center justify-between gap-4 px-6 md:flex-row">
          <span className="text-3xl font-medium">Your Orgs</span>
          <Link href="/orgs/new"
            className="hidden items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 md:inline-flex"
          >
            <PlusIcon className="w-5 h-5 fill-white" />
            <span className="hidden lg:block">Create a new Org</span>
          </Link>
        </div>
        {orgQuery.isLoading && <div className="flex items-center justify-center">
          <Loader size={64} className="text-blue-500 animate-spin" />
        </div>}
        <ul className="flex  w-full flex-col items-center justify-center gap-2 overflow-y-auto p-6 md:grid md:grid-cols-2 md:gap-0 lg:grid-cols-3" role="list">
          {orgQuery.data && orgQuery.data.map((org) => (
            <li key={org.id} className="col-span-1 w-full max-w-sm">
              <ItemCard title={org.name} href={`/orgs/${org.id}`} />
            </li>
          ))}
        </ul>
      </Layout>
    </>
  );
}
