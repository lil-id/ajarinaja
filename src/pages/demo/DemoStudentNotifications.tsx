import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Megaphone, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { demoAnnouncements } from '@/data/demoData';
import { format } from 'date-fns';

// Demo notifications
const demoNotifications = [
  {
    id: 'notif-1',
    type: 'grade',
    title: 'Exam Graded',
    message: 'Your Quiz 1 - Fractions has been graded. Score: 45/50',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'deadline',
    title: 'Assignment Due Soon',
    message: 'Homework 1 - Solving Equations is due in 2 days',
    read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'badge',
    title: 'New Badge Earned!',
    message: 'Congratulations! You earned the "Quick Learner" badge',
    read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    type: 'grade',
    title: 'Assignment Feedback',
    message: 'Your Essay - Math in Daily Life has received feedback from your teacher',
    read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Demo Student Notifications page.
 * 
 * Displays notifications and announcements for the student.
 * Features:
 * - Tabbed view (All vs Announcements)
 * - Unread count badge
 * - Visual indicators for different notification types (Grade, Deadline, Badge)
 * 
 * @returns {JSX.Element} The rendered Notifications page.
 */
export default function DemoStudentNotifications() {
  const [activeTab, setActiveTab] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deadline':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'badge':
        return <Award className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const unreadCount = demoNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with announcements and alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} unread</Badge>
            )}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            All
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {demoNotifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            demoNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover:shadow-lg transition-shadow ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-4">
          {demoAnnouncements.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No announcements</h3>
                <p className="text-muted-foreground text-center">
                  Course announcements from your teachers will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            demoAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="h-4 w-4 text-primary" />
                    <Badge variant="outline">{announcement.course_title}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
