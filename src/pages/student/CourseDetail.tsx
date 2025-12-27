import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useCourses } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useCourseMaterials } from '@/hooks/useCourseMaterials';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useCourseProgress, useMarkMaterialViewed } from '@/hooks/useProgress';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Megaphone,
  Loader2,
  Download,
  Clock,
  CheckCircle2,
  Circle,
  Trophy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const StudentCourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const { courses, isLoading: coursesLoading } = useCourses();
  const { exams, isLoading: examsLoading } = useExams();
  const { materials, isLoading: materialsLoading } = useCourseMaterials();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { enrollments } = useEnrollments();
  const markMaterialViewed = useMarkMaterialViewed();
  
  const course = courses.find(c => c.id === courseId);
  
  // Fetch teacher profile
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile', course?.teacher_id],
    queryFn: async () => {
      if (!course?.teacher_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', course.teacher_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!course?.teacher_id,
  });
  
  const courseExams = exams.filter(e => e.course_id === courseId && e.status === 'published');
  const courseMaterials = materials.filter(m => m.course_id === courseId);
  const courseAnnouncements = announcements.filter(a => a.course_id === courseId);
  const isEnrolled = enrollments.some(e => e.course_id === courseId);

  // Progress tracking
  const progress = useCourseProgress(
    courseId || '',
    courseExams.map(e => e.id),
    courseMaterials.map(m => m.id)
  );

  const handleDownloadMaterial = async (materialId: string, filePath: string, fileName: string) => {
    // Mark as viewed
    try {
      await markMaterialViewed.mutateAsync(materialId);
    } catch (error) {
      console.error('Failed to mark material as viewed:', error);
    }

    const { data, error } = await supabase.storage
      .from('course-materials')
      .download(filePath);
    
    if (error) {
      console.error('Download error:', error);
      toast.error('Failed to download material');
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
  };

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Course not found</h2>
        <Button variant="outline" onClick={() => navigate('/student/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          className="w-fit"
          onClick={() => navigate('/student/courses')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnail */}
          <div className="w-full lg:w-64 h-40 rounded-lg overflow-hidden bg-gradient-hero flex items-center justify-center flex-shrink-0">
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

          {/* Course Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
              {isEnrolled && (
                <Badge variant="default">Enrolled</Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl mb-4">
              {course.description || 'No description available'}
            </p>
            
            {/* Teacher Info */}
            {teacherProfile && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-fit">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={teacherProfile.avatar_url || ''} />
                  <AvatarFallback>
                    {teacherProfile.name?.charAt(0).toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{teacherProfile.name}</p>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="border-0 shadow-card bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Progress
            </CardTitle>
            <span className="text-2xl font-bold text-primary">{progress.overallProgress}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress.overallProgress} className="h-3" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-secondary" />
                <span className="text-sm text-foreground">Exams Completed</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {progress.completedExams}/{progress.totalExams}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">Materials Viewed</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {progress.viewedMaterials}/{progress.totalMaterials}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseExams.length}</p>
              <p className="text-sm text-muted-foreground">Exams</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseMaterials.length}</p>
              <p className="text-sm text-muted-foreground">Materials</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseAnnouncements.length}</p>
              <p className="text-sm text-muted-foreground">Announcements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Materials ({courseMaterials.length})</TabsTrigger>
          <TabsTrigger value="exams">Exams ({courseExams.length})</TabsTrigger>
          <TabsTrigger value="announcements">Announcements ({courseAnnouncements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {materialsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseMaterials.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No materials available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseMaterials.map((material) => {
                const isViewed = progress.isMaterialViewed(material.id);
                return (
                  <Card key={material.id} className="border-0 shadow-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isViewed ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                          {isViewed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{material.title}</h4>
                            {isViewed && (
                              <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">
                                Viewed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {material.description || material.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(material.file_size / 1024).toFixed(1)} KB • {format(new Date(material.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadMaterial(material.id, material.file_path, material.file_name)}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          {examsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseExams.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No exams available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseExams.map((exam) => {
                const isCompleted = progress.isExamCompleted(exam.id);
                return (
                  <Card key={exam.id} className="border-0 shadow-card">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-500/10' : 'bg-secondary/10'}`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-secondary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{exam.title}</h4>
                            {isCompleted && (
                              <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {exam.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exam.duration} min
                            </span>
                            <span>{exam.total_points} points</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant={isCompleted ? "outline" : "hero"}
                        size="sm"
                        onClick={() => navigate(isCompleted ? `/student/exam/${exam.id}/results` : `/student/exam/${exam.id}`)}
                      >
                        {isCompleted ? 'View Results' : 'Take Exam'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {announcementsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseAnnouncements.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-0 shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(announcement.created_at), 'MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
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

export default StudentCourseDetail;
