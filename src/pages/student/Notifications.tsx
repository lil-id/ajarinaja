import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
} from '@/hooks/useNotifications';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import {
  Bell,
  CheckCheck,
  GraduationCap,
  Megaphone,
  ClipboardCheck,
  Clock,
  Info,
  Calendar,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * Helper to get the icon for a notification type.
 * @param {Notification['type']} type - The notification type
 * @returns {JSX.Element} The icon component
 */
const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'grade':
      return <GraduationCap className="h-5 w-5 text-green-500" />;
    case 'announcement':
      return <Megaphone className="h-5 w-5 text-blue-500" />;
    case 'assignment':
      return <ClipboardCheck className="h-5 w-5 text-purple-500" />;
    case 'deadline':
      return <Clock className="h-5 w-5 text-orange-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

const getNotificationBadgeVariant = (type: Notification['type']) => {
  switch (type) {
    case 'grade':
      return 'default';
    case 'announcement':
      return 'secondary';
    case 'assignment':
      return 'outline';
    case 'deadline':
      return 'destructive';
    default:
      return 'outline';
  }
};

const NotificationItem = ({
  notification,
  onMarkRead,
  onClick
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (link: string | null) => void;
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    onClick(notification.link);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors border",
        notification.read
          ? "bg-background hover:bg-muted/50 border-border"
          : "bg-primary/5 hover:bg-primary/10 border-primary/20"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn(
            "text-sm truncate",
            !notification.read && "font-semibold"
          )}>
            {notification.title}
          </h4>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
            {notification.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};

const NotificationSkeleton = () => (
  <div className="flex items-start gap-4 p-4 rounded-lg border">
    <Skeleton className="h-5 w-5 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);

/**
 * Student Notifications page.
 * 
 * Central hub for notifications and announcements.
 * Features:
 * - Notification feed (grades, assignments, deadlines)
 * - Announcement feed from enrolled courses
 * - Mark as read functionality
 * 
 * @returns {JSX.Element} The rendered Notifications page.
 */
const StudentNotifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Announcements data
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleNotificationClick = (link: string | null) => {
    if (link) {
      navigate(link);
    }
  };

  // Announcements logic
  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const myAnnouncements = announcements.filter(a => enrolledCourseIds.includes(a.course_id));

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || t('studentMaterials.unknownCourse');
  };

  const isAnnouncementsLoading = enrollmentsLoading || coursesLoading || announcementsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('studentNotifications.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('studentNotifications.subtitle')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {t('studentNotifications.markAllRead')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {t('studentNotifications.notificationsTab')}
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            {t('studentNotifications.announcementsTab')}
            {myAnnouncements.length > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5">
                {myAnnouncements.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {t('studentNotifications.allNotifications')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {notificationsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <NotificationSkeleton key={i} />
                    ))}
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={(id) => markRead.mutate(id)}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      {t('studentNotifications.noNotificationsTitle')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('studentNotifications.noNotificationsDesc')}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          {isAnnouncementsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
          ) : myAnnouncements.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Megaphone className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('studentNotifications.noAnnouncementsTitle')}</h3>
                <p className="text-muted-foreground text-center">
                  {enrolledCourseIds.length === 0
                    ? t('studentNotifications.enrollToSee')
                    : t('studentNotifications.noTeacherPosts')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myAnnouncements.map((announcement, index) => (
                <Card
                  key={announcement.id}
                  className="border-0 shadow-card animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div>
                      <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                        {getCourseTitle(announcement.course_id)}
                      </span>
                      <CardTitle className="mt-2">{announcement.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(announcement.created_at), 'PPp')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentNotifications;
