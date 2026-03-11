import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCourses, Course } from '@/hooks/useCourses';
import { useEnroll, useUnenroll } from '@/hooks/useEnrollments';
import { useEffectiveCourseIds } from '@/hooks/useEffectiveCourseIds';
import { useAllCourseSchedules } from '@/hooks/useAllCourseSchedules';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Loader2,
  Search,
  Users,
  CheckCircle2,
  Eye,
  Filter,
  ArrowUpDown,
  Clock,
  FileText,
  BarChart3,
  Award,
  GraduationCap,
  ChevronRight,
  Lock,
  Video,
  File,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { extractYouTubeId, getYouTubeThumbnail, useCourseMaterials } from '@/hooks/useCourseMaterials';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// --- Subject Helper Logic (Copied from PublicCourses) ---
const getSubject = (course: Course): string => {
  // Try to determine subject from title since we don't have a distinct subject field in the DB yet
  // or if we do, rely on title keywords for now as a fallback
  const lowerTitle = course.title.toLowerCase();
  if (lowerTitle.includes("math") || lowerTitle.includes("algebra") || lowerTitle.includes("calculus") || lowerTitle.includes("matematika")) return "mathematics";
  if (lowerTitle.includes("physics") || lowerTitle.includes("fisika")) return "physics";
  if (lowerTitle.includes("chemistry") || lowerTitle.includes("kimia")) return "chemistry";
  if (lowerTitle.includes("biology") || lowerTitle.includes("biologi")) return "biology";
  if (lowerTitle.includes("history") || lowerTitle.includes("sejarah")) return "history";
  if (lowerTitle.includes("english") || lowerTitle.includes("inggris") || lowerTitle.includes("literature")) return "english";
  if (lowerTitle.includes("indonesian") || lowerTitle.includes("bahasa")) return "indonesian";
  if (lowerTitle.includes("computer") || lowerTitle.includes("programming") || lowerTitle.includes("komputer") || lowerTitle.includes("coding")) return "computer-science";
  return "other";
};

const getSubjectDisplayName = (subject: string, t: (key: string) => string): string => {
  const key = `exploreCourses.subjects.${subject}`;
  const translated = t(key);
  // If translation returns the key (meaning missing), fallback to capitalized subject
  return translated !== key ? translated : subject.charAt(0).toUpperCase() + subject.slice(1);
};

// --- Helper Hooks (Copied/Adapted from CoursePreviewModal) ---

// Helper removed as teacher data is now included in course object

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

// --- Detail Panel Component ---

const CourseDetailPanel = ({
  course,
  isEnrolled,
  onEnroll,
  isEnrolling,
  onUnenroll,
  isUnenrolling,
  onClose
}: {
  course: Course;
  isEnrolled: boolean;
  onEnroll: (id: string) => void;
  isEnrolling: boolean;
  onUnenroll: (id: string) => void;
  isUnenrolling: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { materials, isLoading: materialsLoading } = useCourseMaterials(course.id);
  const { data: enrollmentCount = 0 } = useCourseEnrollmentCount(course.id);

  const getMaterialIcon = (material: typeof materials[0]) => {
    if (material.video_url) return <Video className="w-4 h-4 text-red-500" />;
    if (material.file_type?.includes('pdf')) return <FileText className="w-4 h-4 text-orange-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const subject = getSubject(course);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden border-0 shadow-lg relative group/panel">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-white/50 hover:bg-white/70 text-white rounded-full opacity-0 group-hover/panel:opacity-100 transition-opacity"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="relative h-48">
          <div className="absolute inset-0 bg-gradient-hero" />
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge variant="secondary" className="mb-2">
              {getSubjectDisplayName(subject, t)}
            </Badge>
            <h2 className="text-2xl font-bold text-foreground line-clamp-2">
              {course.title}
            </h2>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-muted-foreground mb-6">
            {course.description || t('courses.noDescriptionAvailable')}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl font-bold">{enrollmentCount}</div>
              <div className="text-xs text-muted-foreground">{t('students.totalStudents')}</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-xl font-bold">{materials.length}</div>
              <div className="text-xs text-muted-foreground">{t('materials.title')}</div>
            </div>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl mb-6">
            <Avatar className="w-12 h-12">
              <AvatarImage src={course.teacher?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {course.teacher?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{course.teacher?.name || t('courses.unknownInstructor')}</div>
              <div className="text-sm text-muted-foreground">
                {course.teacher?.email || t('common.noEmail')}
              </div>
            </div>
          </div>

          {/* Enrollment CTA */}
          <div className={`p-4 border rounded-xl ${isEnrolled ? 'bg-green-500/10 border-green-500/20' : 'bg-primary/5 border-primary/20'}`}>
            <div className="flex items-start gap-3">
              {isEnrolled ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <Lock className="w-5 h-5 text-primary mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">
                  {isEnrolled ? t('exploreCourses.yourEnrolledCourses') : t('exploreCourses.enrollNow')}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {isEnrolled
                    ? t('exploreCourses.enrollSuccess')
                    : t('exploreCourses.availableToEnroll')}
                </p>

                {isEnrolled ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isUnenrolling} className="w-full sm:w-auto">
                        {isUnenrolling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                        {t('courses.unenroll')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('courses.unenrollConfirm')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('courses.unenrollDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onUnenroll(course.id)}>
                          {t('courses.unenroll')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => onEnroll(course.id)}
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {t('exploreCourses.enrollNow')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-500" />
            {t('materials.courseMaterials')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materialsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : materials.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">{t('materials.noMaterials')}</p>
          ) : (
            <div className="space-y-3">
              {materials.slice(0, 5).map((material) => (
                <div key={material.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded bg-background flex items-center justify-center shadow-sm">
                    {getMaterialIcon(material)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{material.title}</p>
                  </div>
                  {material.video_url && <Badge variant="outline" className="text-[10px]">Video</Badge>}
                </div>
              ))}
              {materials.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  {t('common.andMore', { count: materials.length - 5 })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main ExploreCourses Component ---

const ExploreCourses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { courses, isLoading: coursesLoading } = useCourses();
  const { effectiveCourseIds, enrolledClassIds, isLoading: effectiveCoursesLoading } = useEffectiveCourseIds();
  const { data: schedules = [], isLoading: schedulesLoading } = useAllCourseSchedules();
  const enroll = useEnroll();
  const unenroll = useUnenroll();

  const isLoading = coursesLoading || effectiveCoursesLoading || schedulesLoading;

  const enrolledCourseIds = effectiveCourseIds;

  // A global course has no class_schedules. A restricted course has 1+ class_schedules.
  // A course is available to the student if it's global OR if they are in one of the scheduled classes.
  const publishedCourses = useMemo(() => {
    return courses.filter(c => {
      if (c.status !== 'published') return false;

      const courseSchedules = schedules.filter(s => s.course_id === c.id);
      const isGlobal = courseSchedules.length === 0;

      if (isGlobal) return true;

      // If restricted, check if student is in any of those classes
      return courseSchedules.some(s => enrolledClassIds.includes(s.class_id));
    });
  }, [courses, schedules, enrolledClassIds]);

  const filteredCourses = useMemo(() => {
    let result = [...publishedCourses];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter(c => getSubject(c) === subjectFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [publishedCourses, searchQuery, subjectFilter, sortBy]);

  const selectedCourse = useMemo(() =>
    selectedCourseId ? publishedCourses.find(c => c.id === selectedCourseId) : null,
    [selectedCourseId, publishedCourses]);

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll.mutateAsync(courseId);
      toast.success(t('exploreCourses.enrollSuccess'));
    } catch (error) {
      // toast handled by mutation usually, or here
      console.error(error);
      toast.error(t('exploreCourses.enrollFailed'));
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenroll.mutateAsync(courseId);
      toast.success(t('exploreCourses.unenrollSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(t('exploreCourses.unenrollFailed'));
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
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">{t('exploreCourses.title')}</h1>
        <p className="text-muted-foreground">{t('exploreCourses.subtitle')}</p>
      </div>

      {/* Search and Filters */}
      <div className="border-0">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('nav.searchCourses')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <div className="flex gap-3">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[160px] h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('exploreCourses.subjects.all')}</SelectItem>
                <SelectItem value="mathematics">{t('exploreCourses.subjects.mathematics')}</SelectItem>
                <SelectItem value="physics">{t('exploreCourses.subjects.physics')}</SelectItem>
                <SelectItem value="chemistry">{t('exploreCourses.subjects.chemistry')}</SelectItem>
                <SelectItem value="biology">{t('exploreCourses.subjects.biology')}</SelectItem>
                <SelectItem value="history">{t('exploreCourses.subjects.history')}</SelectItem>
                <SelectItem value="english">{t('exploreCourses.subjects.english')}</SelectItem>
                <SelectItem value="indonesian">{t('exploreCourses.subjects.indonesian')}</SelectItem>
                <SelectItem value="computer-science">{t('exploreCourses.subjects.computerScience')}</SelectItem>
                <SelectItem value="other">{t('exploreCourses.subjects.other')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-12">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('exploreCourses.sortOptions.newest')}</SelectItem>
                <SelectItem value="oldest">{t('exploreCourses.sortOptions.oldest')}</SelectItem>
                <SelectItem value="alphabetical">{t('exploreCourses.sortOptions.alphabetical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-3">
            {t('nav.showingResults', { count: filteredCourses.length, query: searchQuery })}
          </p>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className={`space-y-4 ${selectedCourse ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {filteredCourses.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-card">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('exploreCourses.noCoursesFound')}</h3>
              <p className="text-muted-foreground">
                {t('exploreCourses.tryDifferentSearch')}
              </p>
            </Card>
          ) : (
            <div className={`grid gap-6 ${selectedCourse ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredCourses.map((course) => {
                const isSelected = selectedCourseId === course.id;
                const isCourseEnrolled = enrolledCourseIds.includes(course.id);

                return (
                  <Card
                    key={course.id}
                    className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-card overflow-hidden ${isSelected ? 'ring-2 ring-primary shadow-xl' : ''
                      }`}
                    onClick={() => setSelectedCourseId(isSelected ? null : course.id)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-hero" />
                      {course.thumbnail_url && (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}

                      {isCourseEnrolled && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('courses.enrolled')}
                          </Badge>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm">
                          {getSubjectDisplayName(getSubject(course), t)}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                        {course.description || t('courses.noDescriptionAvailable')}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Clock className="w-3 h-3" />
                        {new Date(course.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourseId(isSelected ? null : course.id);
                          }}
                        >
                          {isSelected ? t('common.view') : t('exploreCourses.viewDetails')}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCourse && (
          <div className="lg:col-span-2 relative">
            <div className="sticky top-6">
              <CourseDetailPanel
                course={selectedCourse}
                isEnrolled={enrolledCourseIds.includes(selectedCourse.id)}
                onEnroll={handleEnroll}
                isEnrolling={enroll.isPending}
                onUnenroll={handleUnenroll}
                isUnenrolling={unenroll.isPending}
                onClose={() => setSelectedCourseId(null)}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ExploreCourses;
