import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { count, notifications, markRead, markAllRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
              {count > 99 ? '99+' : count}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead()} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`flex flex-col p-4 border-b last:border-0 ${notification.is_read ? 'opacity-60' : 'bg-muted/30'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm leading-tight">{notification.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2 mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {notification.message}
                </p>
                {!notification.is_read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-full text-xs mt-1"
                    onClick={() => markRead(notification.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
