import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams, useUpdateExam, useDeleteExam } from '@/hooks/useExams';
import { FileText, Plus, Clock, Award, MoreVertical, Edit, Trash2, Loader2, ClipboardCheck, Search, Filter, Archive, ArchiveRestore } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { sendCourseNotification, getEnrolledStudents } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Teacher Exams Management page.
 * 
 * Dashboard for managing exams across courses.
 * Features:
 * - List of exams (Published/Draft/Archived)
 * - Create new exam via dedicated form page
 * - Publish/Archive/Delete actions
 * - Filtering and search
 * 
 * @returns {JSX.Element} The rendered Exams page.
 */
const TeacherExams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { courses } = useTeacherCourses();
  const { exams, isLoading } = useExams();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  // Filter exams to only show those for teacher's courses
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [activeTab, setActiveTab] = useState('published');

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam.mutateAsync(examId);
      toast.success(t('exams.examDeleted'));
    } catch (error) {
      toast.error(t('exams.failedToDelete'));
    }
  };

  const handlePublishExam = async (examId: string) => {
    try {
      const exam = teacherExams.find(e => e.id === examId);
      await updateExam.mutateAsync({ id: examId, status: 'published' });

      // Send notification to enrolled students
      if (exam) {
        const recipients = await getEnrolledStudents(supabase, exam.course_id);
        if (recipients.length > 0) {
          const course = courses.find(c => c.id === exam.course_id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .single();

          await sendCourseNotification({
            recipients,
            courseName: course?.title || 'Course',
            teacherName: profile?.name || 'Teacher',
            contentType: 'exam',
            contentTitle: exam.title,
            duration: exam.duration,
            description: exam.description || undefined,
          });
        }
      }

      toast.success(t('exams.examPublished'));
    } catch (error) {
      toast.error(t('exams.failedToPublish'));
    }
  };

  const handleArchiveExam = async (examId: string, archive: boolean) => {
    try {
      await updateExam.mutateAsync({ id: examId, archived: archive } as any);
      toast.success(archive ? t('exams.examArchived') : t('exams.examRestored'));
    } catch {
      toast.error(t('exams.failedToUpdate'));
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'Unknown Course';
  };

  const openExam = (id: string, status: string) => {
    if (status === 'published') {
      navigate(`/teacher/exams/${id}/grade`);
      return;
    }
    navigate(`/teacher/exams/${id}/edit`);
  };

  const handleCreateExam = () => {
    const courseId = searchParams.get('courseId');
    navigate(courseId ? `/teacher/exams/new?courseId=${courseId}` : '/teacher/exams/new');
  };

  // Filter exams based on search, course, and tab
  const filteredExams = teacherExams.filter(exam => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = exam.title.toLowerCase().includes(query);
      const matchesCourse = getCourseTitle(exam.course_id).toLowerCase().includes(query);
      if (!matchesTitle && !matchesCourse) return false;
    }

    // Course filter
    if (filterCourse !== 'all' && exam.course_id !== filterCourse) return false;

    // Tab filter
    const isArchived = (exam as any).archived === true;
    if (activeTab === 'archived') return isArchived;
    if (isArchived) return false;

    if (activeTab === 'published') return exam.status === 'published';
    if (activeTab === 'draft') return exam.status === 'draft';

    return true;
  });

  // Count items for tabs
  const counts = {
    published: teacherExams.filter(e => !((e as any).archived) && e.status === 'published').length,
    draft: teacherExams.filter(e => !((e as any).archived) && e.status === 'draft').length,
    archived: teacherExams.filter(e => (e as any).archived === true).length,
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
          <h1 className="text-3xl font-bold text-foreground">{t('exams.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('exams.manageExams')}
          </p>
        </div>
        <Button variant="hero" disabled={courses.length === 0} onClick={handleCreateExam}>
          <Plus className="w-4 h-4" />
          {t('exams.newExam')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('exams.filterByCourse')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allCourses')}</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="published">
            {t('common.published')} ({counts.published})
          </TabsTrigger>
          <TabsTrigger value="draft">
            {t('common.draft')} ({counts.draft})
          </TabsTrigger>
          <TabsTrigger value="archived">
            {t('common.archived')} ({counts.archived})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredExams.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-16 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('exams.noExams')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? t('common.noResultsFound')
                    : activeTab === 'archived'
                      ? t('exams.noArchivedExams')
                      : t('exams.noExamsDescription')
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => (
                <Card
                  key={exam.id}
                  className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
                  onClick={() => openExam(exam.id, exam.status)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                          {exam.title}
                        </CardTitle>
                        <CardDescription className="truncate mt-1">
                          {getCourseTitle(exam.course_id)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/teacher/exams/${exam.id}/edit`);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          {exam.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handlePublishExam(exam.id);
                            }}>
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              {t('common.publish')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {(exam as any).archived ? (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveExam(exam.id, false);
                            }}>
                              <ArchiveRestore className="w-4 h-4 mr-2" />
                              {t('common.restore')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveExam(exam.id, true);
                            }}>
                              <Archive className="w-4 h-4 mr-2" />
                              {t('common.archive')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExam(exam.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.duration} {t('common.minutes')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {exam.total_points} {t('common.pts')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={exam.status === 'published' ? 'default' : 'secondary'}
                      >
                        {exam.status === 'published' ? t('common.published') : t('common.draft')}
                      </Badge>
                      {exam.kkm && (
                        <span className="text-xs text-muted-foreground">
                          KKM: {exam.kkm}%
                        </span>
                      )}
                    </div>
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

export default TeacherExams;
