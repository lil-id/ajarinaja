import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useCourse } from '@/hooks/useCourses';
import { useCourseMaterials, extractYouTubeId, getYouTubeThumbnail } from '@/hooks/useCourseMaterials';
import { useExams } from '@/hooks/useExams';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useEnrollments, useUnenroll } from '@/hooks/useEnrollments';
import { MaterialViewer } from '@/components/MaterialViewer';
import {
  FileText,
  Video,
  Play,
  Download,
  Eye,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  BookOpen,
  Megaphone,
  AlertCircle,
  Loader2,
  File,
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

/**
 * Student Course Detail page.
 *
 * Shows detailed information about a specific course.
 * Features:
 * - Course progress tracking
 * - Tabs for Materials, Exams, and Announcements
 * - Material viewing and downloading
 * - Exam taking entry point
 * - Unenrollment functionality
 *
 * @returns {JSX.Element} The rendered Course Detail page.
 */
const StudentCourseDetail = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading: courseLoading } = useCourse(courseId!);
  const { materials, isLoading: materialsLoading } = useCourseMaterials(courseId);
  const { exams, isLoading: examsLoading } = useExams(courseId);
  const { announcements, isLoading: announcementsLoading } = useAnnouncements(courseId);
  const { mutateAsync: unenroll, isPending: isUnenrolling } = useUnenroll();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<typeof materials[0] | null>(null);

  const isLoading = courseLoading || materialsLoading || examsLoading || announcementsLoading;

  // Calculate progress
  const progress = useMemo(() => {
    if (!materials || !exams) return 0;
    const totalItems = materials.length + exams.length;
    if (totalItems === 0) return 0;
    // For now, simple mock progress based on items existing
    // In a real app, we'd track viewed/completed status
    return 0;
  }, [materials, exams]);

  const handleUnenroll = async () => {
    if (!courseId) return;
    try {
      await unenroll(courseId);
      toast.success(t('courseDetailPage.unenrollSuccess'));
      navigate('/student/explore');
    } catch (error) {
      toast.error(t('courseDetailPage.unenrollFailed'));
    }
  };

  const handleViewMaterial = (material: typeof materials[0]) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        toast.error(t('toast.failedToDownloadMaterial'));
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('toast.failedToDownloadMaterial'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('courseDetailPage.courseNotFound')}</h2>
        <Button onClick={() => navigate('/student/courses')}>
          {t('courseDetailPage.backToCourses')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Back Button */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="mt-1"
          onClick={() => navigate('/student/courses')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {course.description}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {course.category || t('calendar.types.other')}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {exams.length} {t('courseDetailPage.examsTab')}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {materials.length} {t('courseDetailPage.materialsTab')}
                </span>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                  {t('courses.unenroll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('courseDetailPage.unenrollSuccess')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('courseDetailPage.unenrollConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnenroll}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t('common.continue')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="materials">{t('courseDetailPage.materialsTab')}</TabsTrigger>
              <TabsTrigger value="exams">{t('courseDetailPage.examsTab')}</TabsTrigger>
              <TabsTrigger value="announcements">{t('courseDetailPage.announcementsTab')}</TabsTrigger>
            </TabsList>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-4 mt-4">
              {materials.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">{t('courseDetailPage.noMaterialsAvailable')}</p>
                  </CardContent>
                </Card>
              ) : (
                materials.map((material) => {
                  const isVideo = !!material.video_url;
                  const videoId = isVideo ? extractYouTubeId(material.video_url!) : null;

                  return (
                    <Card key={material.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        {isVideo && videoId ? (
                          <div
                            className="sm:w-48 h-32 bg-black relative group cursor-pointer"
                            onClick={() => handleViewMaterial(material)}
                          >
                            <img
                              src={getYouTubeThumbnail(videoId)}
                              alt={material.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 transition-opacity shadow-lg" />
                            </div>
                          </div>
                        ) : (
                          <div className="sm:w-24 bg-muted flex items-center justify-center p-6">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-lg line-clamp-1">{material.title}</h3>
                              {isVideo && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('studentMaterials.video')}
                                </Badge>
                              )}
                            </div>
                            {material.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {material.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(material.created_at), 'MMM d, yyyy')}
                            </span>
                            <div className="flex gap-2">
                              {isVideo ? (
                                <Button size="sm" onClick={() => handleViewMaterial(material)}>
                                  <Play className="w-4 h-4 mr-1" />
                                  {t('studentMaterials.watch')}
                                </Button>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleViewMaterial(material)}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    {t('studentMaterials.view')}
                                  </Button>
                                  {material.file_path && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDownload(material.file_path!, material.file_name || 'download')}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Exams Tab */}
            <TabsContent value="exams" className="space-y-4 mt-4">
              {exams.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center text-center">
                    <Award className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">{t('courseDetailPage.noExamsAvailable')}</p>
                  </CardContent>
                </Card>
              ) : (
                exams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{exam.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {t('time.dueIn', { time: format(new Date(exam.end_date || exam.created_at), 'MMM d, HH:mm') })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {exam.duration}m
                            </span>
                            <Badge variant="outline">{exam.total_points} pts</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {exam.description}
                          </p>
                        </div>
                        <Button onClick={() => navigate(`/student/exam/${exam.id}`)}>
                          {t('courseDetailPage.takeExam')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-4 mt-4">
              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center text-center">
                    <Megaphone className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">{t('courseDetailPage.noAnnouncementsAvailable')}</p>
                  </CardContent>
                </Card>
              ) : (
                announcements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('courseDetailPage.instructor')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {course.teacher?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-foreground">
                    {course.teacher?.name || t('studentMaterials.unknownTeacher')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {course.teacher?.email || t('common.noEmail')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('courseDetailPage.yourProgress')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{t('courseDetailPage.completed')}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg text-center">
                  <BookOpen className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <div className="text-xl font-bold">{materials.length}</div>
                  <div className="text-xs text-muted-foreground">{t('courseDetailPage.materialsTab')}</div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <Award className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold">{exams.length}</div>
                  <div className="text-xs text-muted-foreground">{t('courseDetailPage.examsTab')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MaterialViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        material={selectedMaterial}
      />
    </div>
  );
};

export default StudentCourseDetail;
