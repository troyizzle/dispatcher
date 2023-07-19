import type { User } from "next-auth"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu"
import { BellIcon, Loader, XIcon } from "lucide-react"
import { api } from "@/utils/api"
import { Button } from "./ui/button"
import type { NotificationWithInvites } from "@/server/api/routers/notification"
import { toast } from "./ui/use-toast"

type InviteItemProps = {
  inviteId: string
  orgName: string
  accepted?: boolean
}

function InviteItem({ inviteId, orgName, accepted }: InviteItemProps) {
  const utils = api.useContext()

  const { mutate: acceptInvite } = api.orgUserInvite.replyToInvite.useMutation({
    onSuccess: async () => {
      toast({
        title: 'Invite accepted',
        variant: 'default'
      })

      await utils.org.all.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return (
    <li className="flex items-center justify-between">
      <div>
        You have been invited to join the organization <span className="font-medium">{orgName}</span>

        {accepted != undefined ? (
          <div>You responsed: {JSON.stringify(accepted)}</div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => acceptInvite({ id: inviteId, accepted: true })}
              variant="outline" size="sm">Accept</Button>
            <Button
              onClick={() => acceptInvite({ id: inviteId, accepted: false })}
              variant="outline" size="sm">Decline</Button>
          </div>
        )}
      </div>
    </li>
  )
}

type NotificationItemProps = {
  notification: NotificationWithInvites
}

function NotificationItem({ notification }: NotificationItemProps) {
  let component: JSX.Element | null = null
  const utils = api.useContext()

  const { mutate: markAsRead } = api.notification.markAsRead.useMutation({
    onSuccess: async () => {
      toast({
        title: 'Notification marked as read',
        variant: 'default'
      })

      await utils.notification.allUser.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  switch (notification.type) {
    case 'ORG_USER_INVITE':
      if (notification.inviteId && notification.orgName) {
        component = <InviteItem inviteId={notification.inviteId} orgName={notification.orgName} accepted={notification.accepted} />
      }
      break
    default:
      component = null
  }

  if (!component) {
    return component
  }

  return <div>
    <div className="flex justify-end">
      <Button
        onClick={() => markAsRead({ id: notification.id })}
        variant="link" size="icon">
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
    {component}
  </div>
}

type NotificationMenuProps = {
  user: User
}

export default function NotificationMenu({ user }: NotificationMenuProps) {
  const notificationQuery = api.notification.allUser.useQuery()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <BellIcon className="w-4 h-4" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            {notificationQuery.isLoading && <div className="flex items-center justify-center h-16">
              <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            </div>}
            {notificationQuery.isSuccess && (
              notificationQuery.data.length == 0 ? (
                <div className="flex items-center justify-center h-16 w-[150px]">
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                <ul className="grid gap-3 p-6 w-[350px]">
                  {notificationQuery.data && notificationQuery.data.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </ul>
              ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
