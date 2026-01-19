import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourses } from '@/hooks/useCourses';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Megaphone, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const StudentAnnouncements = () => {
  const { t } = useTranslation();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements();

  const isLoading = enrollmentsLoading || coursesLoading || announcementsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  
  // Filter announcements for enrolled courses
  const myAnnouncements = announcements.filter(a => enrolledCourseIds.includes(a.course_id));

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || t('announcements.unknownCourse');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('studentAnnouncements.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('studentAnnouncements.subtitle')}
        </p>
      </div>

      {myAnnouncements.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('studentAnnouncements.noAnnouncementsYet')}</h3>
            <p className="text-muted-foreground text-center">
              {enrolledCourseIds.length === 0 
                ? t('studentAnnouncements.enrollToSee')
                : t('studentAnnouncements.noTeacherPosts')}
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
    </div>
  );
};

export default StudentAnnouncements;
