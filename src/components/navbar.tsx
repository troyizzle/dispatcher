import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarImage } from "./ui/avatar";
import type { User } from "next-auth";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import NotificationMenu from "./notification";
import { signOut } from "next-auth/react";

function ThemeToggler() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <>
        <div className="dark:hidden block">🌙</div>
        <div className="hidden dark:block">🌞</div>
      </>
    </Button>
  )
}

type NavbarProps = {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <>
      <div className="mx-auto w-full max-w-7xl items-center flex justify-between gap-x-6 p-6 lg:px-8">
        <div className="flex items-center gap-x-4">
          <Link href="/" className="flex flex-row items-baseline focus:outline-red-500">
            <h1 className="relative flex flex-row items-baseline text-2xl font-bold">
              <span className="tracking-tight hover:cursor-pointer">
                Github
                <span className="text-red-600">Dispatcher</span>
              </span>
            </h1>
          </Link>
        </div>
        <div className="flex gap-x-2">
          <NotificationMenu user={user} />
          <ThemeToggler />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar role="button">
                <AvatarImage src={user.image ?? ''} alt="user profile picture" />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.name ?? "Welcome"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Button variant="link" onClick={() => void signOut()}>Sign out</Button>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="h-px bg-border"></div>
    </>
  )
}
