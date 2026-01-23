import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { Megaphone, Plus, Trash2, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

/**
 * Teacher Announcements page.
 * 
 * Allows teachers to manage course announcements.
 * Features:
 * - Create new announcements for specific courses
 * - View history of posted announcements
 * - Delete announcements
 * 
 * @returns {JSX.Element} The rendered Announcements page.
 */
const TeacherAnnouncements = () => {
  const { t } = useTranslation();
  const { courses } = useTeacherCourses();
  const courseIds = courses.map(c => c.id);

  // Fetch all announcements for teacher's courses
  const { announcements, isLoading } = useAnnouncements();
  const teacherAnnouncements = announcements.filter(a => courseIds.includes(a.course_id));

  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ title: '', content: '' });

  const handleCreate = async () => {
    if (!selectedCourse || !form.title.trim() || !form.content.trim()) {
      toast.error(t('validation.fillRequiredFields'));
      return;
    }

    try {
      await createAnnouncement.mutateAsync({
        courseId: selectedCourse,
        title: form.title,
        content: form.content,
      });
      setForm({ title: '', content: '' });
      setSelectedCourse('');
      setIsDialogOpen(false);
      toast.success(t('courseDetail.postAnnouncementSuccess'));
    } catch (error) {
      toast.error(t('courseDetail.postAnnouncementFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement.mutateAsync(id);
      toast.success(t('courseDetail.deleteAnnouncementSuccess'));
    } catch (error) {
      toast.error(t('courseDetail.deleteAnnouncementFailed'));
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || t('materials.unknownCourse');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('nav.announcements')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('courseDetail.postAnnouncement')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" />
              {t('courseDetail.postAnnouncement')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('courseDetail.postAnnouncement')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('materials.selectCourse')}</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('materials.chooseCourse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('materials.titleLabel')}</Label>
                <Input
                  placeholder={t('materials.materialTitlePlaceholder')}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea
                  placeholder={t('calendar.eventDescriptionPlaceholder')}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  maxLength={2000}
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={createAnnouncement.isPending}
              >
                {createAnnouncement.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('courseDetail.postAnnouncement')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {t('materials.createCourseFirst')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      {courses.length > 0 && teacherAnnouncements.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('common.noData')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('courseDetail.postAnnouncement')}
            </p>
            <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('courseDetail.postAnnouncement')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teacherAnnouncements.map((announcement, index) => (
            <Card
              key={announcement.id}
              className="border-0 shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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

export default TeacherAnnouncements;
