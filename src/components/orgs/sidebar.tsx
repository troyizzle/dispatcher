import { cn } from "@/lib/utils"
import { HomeIcon, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"

export function OrgSideBar() {
  const router = useRouter()
  const id = router.query.id as string

  const links = [
    {
      label: 'Overview',
      href: `/orgs/${id}`,
      icon: <HomeIcon className="w-5 h-5" />
    },
    {
      label: 'Users',
      href: `/orgs/${id}/users`,
      icon: <User className="w-5 h-5" />
    }
  ]
  return (
    <>
      {links.map(({ label, href, icon }) => (
        <Link
          key={label}
          href={href}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900",
            router.asPath === href ? "bg-gray-100 text-gray-900" : "text-gray-600"
          )}
        >
          {icon}
          <span>{label}</span>
        </Link>
      ))}
    </>
  )
}

