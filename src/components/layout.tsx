import { type User } from "next-auth"
import Navbar from "./navbar"

type LayoutProps = {
  user: User
  sidebar?: React.ReactNode
  children: React.ReactNode
}

export default function Layout({ user, sidebar, children }: LayoutProps) {
  return (
    <div className="h-screen w-screen">
      <div className="flex flex-col h-full">
        <Navbar user={user} />

        <main className="flex-grow">
          <div className="mx-auto flex max-w-7xl grow flex-col sm:flex-row sm:py-6">
            {sidebar &&
              <div className="order-first w-full flex-none sm:w-[215px]">
                <div className="flex flex-row justify-between gap-x-4 gap-y-2 p-4 sm:flex-col sm:p-6">
                  {sidebar}
                </div>
              </div>
            }
            <div className="order-last min-h-screen w-screen p-4 pt-0 sm:w-full sm:p-6 sm:pt-6 md:order-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


