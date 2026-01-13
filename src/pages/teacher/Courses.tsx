import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTeacherCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/hooks/useCourses';
import { BookOpen, Plus, FileText, MoreVertical, Edit, Trash2, Loader2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const TeacherCourses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courses, isLoading } = useTeacherCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      toast.error(t('courses.enterCourseTitle'));
      return;
    }

    try {
      await createCourse.mutateAsync({
        title: newCourse.title,
        description: newCourse.description,
      });
      setNewCourse({ title: '', description: '' });
      setIsDialogOpen(false);
      toast.success(t('courses.courseCreated'));
    } catch (error) {
      toast.error(t('courses.failedToCreate'));
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse.mutateAsync(courseId);
      toast.success(t('courses.courseDeleted'));
    } catch (error) {
      toast.error(t('courses.failedToDelete'));
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      await updateCourse.mutateAsync({ id: courseId, status: 'published' });
      toast.success(t('courses.coursePublished'));
    } catch (error) {
      toast.error(t('courses.failedToPublish'));
    }
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
          <h1 className="text-3xl font-bold text-foreground">{t('courses.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('courses.manageYourCourses')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              {t('courses.newCourse')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('courses.createNewCourse')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('courses.courseTitle')}</Label>
                <Input
                  id="title"
                  placeholder={t('courses.courseTitlePlaceholder')}
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('courses.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('courses.descriptionPlaceholder')}
                  rows={4}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                />
              </div>
              <Button 
                onClick={handleCreateCourse} 
                className="w-full"
                disabled={createCourse.isPending}
              >
                {createCourse.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('courses.createCourse')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('courses.noCoursesYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('courses.createFirstCourse')}
            </p>
            <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              {t('courses.createCourse')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Card 
              key={course.id}
              className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up overflow-hidden cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
            >
              <div className="h-32 bg-gradient-hero flex items-center justify-center overflow-hidden">
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 text-primary-foreground/50" />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                      course.status === 'published' 
                        ? 'bg-secondary/10 text-secondary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {course.status === 'published' ? t('common.published') : t('common.draft')}
                    </span>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/teacher/courses/${course.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        {t('courses.viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/teacher/courses/${course.id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      {course.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublishCourse(course.id)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          {t('courses.publish')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description || t('common.noDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {t('common.createdAt')} {new Date(course.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
