import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Course } from '@/hooks/useCourses';
import { useCourseMaterials, extractYouTubeId, getYouTubeThumbnail } from '@/hooks/useCourseMaterials';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, User, FileText, Video, File, Loader2, Users, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface CoursePreviewModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isEnrolled: boolean;
  onEnroll: (courseId: string) => void;
  onUnenroll: (courseId: string) => void;
  isEnrolling?: boolean;
  isUnenrolling?: boolean;
}

interface TeacherProfile {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

function useTeacherProfile(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      
      // Use public_profiles view which is accessible to all authenticated users
      const { data, error } = await supabase
        .from('public_profiles')
        .select('user_id, name, avatar_url')
        .eq('user_id', teacherId)
        .single();
      
      if (error) throw error;
      return data as TeacherProfile;
    },
    enabled: !!teacherId,
  });
}

function useCourseEnrollmentCount(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-enrollment-count', courseId],
    queryFn: async () => {
      if (!courseId) return 0;
      
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!courseId,
  });
}

const CoursePreviewModal = ({
  course,
  isOpen,
  onClose,
  isEnrolled,
  onEnroll,
  onUnenroll,
  isEnrolling = false,
  isUnenrolling = false,
}: CoursePreviewModalProps) => {
  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile(course?.teacher_id);
  const { materials, isLoading: materialsLoading } = useCourseMaterials(course?.id);
  const { data: enrollmentCount = 0 } = useCourseEnrollmentCount(course?.id);

  if (!course) return null;

  const getMaterialIcon = (material: typeof materials[0]) => {
    if (material.video_url) return <Video className="w-4 h-4 text-red-500" />;
    if (material.file_type?.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (material.file_type?.includes('video')) return <Video className="w-4 h-4 text-purple-500" />;
    if (material.file_type?.includes('image')) return <FileText className="w-4 h-4 text-green-500" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const getYouTubeThumbnailUrl = (videoUrl: string | null) => {
    if (!videoUrl) return null;
    const videoId = extractYouTubeId(videoUrl);
    return videoId ? getYouTubeThumbnail(videoId) : null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          {/* Course Thumbnail */}
          <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg bg-gradient-hero">
            {course.thumbnail_url ? (
              <img 
                src={course.thumbnail_url} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-primary-foreground/30" />
              </div>
            )}
            {isEnrolled && (
              <Badge className="absolute top-3 right-3 bg-green-500/90 hover:bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Enrolled
              </Badge>
            )}
          </div>
          
          <DialogTitle className="text-xl">{course.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {course.description || 'No description available'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0 grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instructor">Instructor</TabsTrigger>
            <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Students Enrolled</p>
                    <p className="font-semibold">{enrollmentCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Learning Materials</p>
                    <p className="font-semibold">{materials.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 col-span-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold">{format(new Date(course.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instructor" className="mt-0">
              {teacherLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : teacher ? (
                <div className="flex flex-col items-center py-6 space-y-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={teacher.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{teacher.name}</h3>
                    <Badge variant="secondary" className="mt-2">
                      <User className="w-3 h-3 mr-1" />
                      Course Instructor
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Instructor information not available
                </div>
              )}
            </TabsContent>

            <TabsContent value="materials" className="mt-0">
              {materialsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No materials available yet</p>
                  <p className="text-sm text-muted-foreground">Materials will be added by the instructor</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.slice(0, 5).map((material) => {
                    const thumbnail = getYouTubeThumbnailUrl(material.video_url);
                    return (
                      <div 
                        key={material.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        {thumbnail ? (
                          <img 
                            src={thumbnail} 
                            alt={material.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            {getMaterialIcon(material)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{material.title}</p>
                          {material.description && (
                            <p className="text-sm text-muted-foreground truncate">{material.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {materials.length > 5 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      +{materials.length - 5} more materials
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Action Buttons */}
        <div className="shrink-0 flex gap-3 pt-4 border-t mt-4">
          {isEnrolled ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1" disabled={isUnenrolling}>
                    {isUnenrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Unenroll
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unenroll from this course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to unenroll from "{course.title}"? You will lose access to course materials and your progress may be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onUnenroll(course.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Unenroll
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1"
                onClick={() => onEnroll(course.id)}
                disabled={isEnrolling}
              >
                {isEnrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enroll Now'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreviewModal;
