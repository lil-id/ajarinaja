import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  type Notification,
} from '@/hooks/useNotifications';
import {
  Bell,
  GraduationCap,
  Megaphone,
  ClipboardCheck,
  Clock,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'grade':
      return <GraduationCap className="h-4 w-4 text-green-500" />;
    case 'announcement':
      return <Megaphone className="h-4 w-4 text-blue-500" />;
    case 'assignment':
      return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
    case 'deadline':
      return <Clock className="h-4 w-4 text-orange-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

/**
 * Props for the NotificationBell component.
 */
interface NotificationBellProps {
  basePath: '/student' | '/teacher' | '/parent';
}

/**
 * Notification bell component with unread count badge and dropdown list.
 * Displays recent notifications and allows navigation to full list.
 * 
 * @param {NotificationBellProps} props - Component props.
 * @returns {JSX.Element} The notification bell with popover.
 */
export const NotificationBell = ({ basePath }: NotificationBellProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();

  const recentNotifications = notifications?.slice(0, 5) || [];

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">{t('notificationBell.notifications')}</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} {t('notificationBell.new')}
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {t('notificationBell.loading')}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm line-clamp-2",
                      !notification.read && "font-medium"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('notificationBell.noNotificationsYet')}
              </p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => navigate(`${basePath}/notifications`)}
          >
            {t('notificationBell.viewAllNotifications')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
