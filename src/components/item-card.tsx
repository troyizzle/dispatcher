import { cn } from "@/lib/utils"
import Link from "next/link"

type ItemCardProps = {
  title: string
  href?: string
  children?: React.ReactNode
  secondary?: React.ReactNode
  className?: string
}

export default function ItemCard({ title, href, children, secondary, className }: ItemCardProps) {
  return (
    <div
      className={cn("relative m-2 flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow ", className)}>
      {href && <Link href={href} className="absolute left-0 top-0 z-0 h-full w-full"></Link>}
      <div className="flex h-2/5 items-center justify-center px-4  py-5 font-bold text-card-foreground sm:p-6" >
      </div>
      <div className="flex grow flex-col space-y-4 bg-card px-4 py-4 sm:px-6">
        <div className="flex h-full flex-row justify-between">
          <div className="flex flex-col justify-between gap-4">
            <div className="flex w-48 flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="pointer-events-none block truncate text-xl font-medium">{title}</p>
                {secondary}
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
