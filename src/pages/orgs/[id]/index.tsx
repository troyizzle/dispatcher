import ItemCard from "@/components/item-card"
import Layout from "@/components/layout"
import { OrgSideBar } from "@/components/orgs/sidebar"
import { api } from "@/utils/api"
import { PlusIcon } from "@radix-ui/react-icons"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/router"

export default function Page() {
  const router = useRouter()
  const id = router.query.id as string
  const { data: sessionData } = useSession()

  const orgQuery = api.org.byId.useQuery({ id: id }, {
    enabled: !!id,
  })

  if (!sessionData) {
    // redirect?
    return null
  }

  return (
    <Layout user={sessionData.user} sidebar={<OrgSideBar />}>
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 px-6 md:flex-row">
        <span className="text-3xl font-medium">Orgs Repos</span>
        <Link href={`/orgs/${id}/repos/new`}
          className="hidden items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 md:inline-flex"
        >
          <PlusIcon className="w-5 h-5 fill-white" />
          <span className="hidden lg:block">Create a new Repo</span>
        </Link>
      </div>

      <ul className="flex  w-full flex-col items-center justify-center gap-2 overflow-y-auto p-6 md:grid md:grid-cols-2 md:gap-0 lg:grid-cols-3" role="list">
        {orgQuery.data && orgQuery.data.repos.map((repo) => (
          <li key={repo.id} className="col-span-1 w-full max-w-sm">
            <ItemCard title={repo.name} href={`/orgs/${id}/repos/${repo.id}`} />
          </li>
        ))}
      </ul>
    </Layout>
  )
}
