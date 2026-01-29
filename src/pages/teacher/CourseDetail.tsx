import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeacherCourses, useUpdateCourse, useDeleteCourse, useUploadCourseThumbnail } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import {
  useCourseMaterials,
  useUploadMaterial,
  useAddVideoMaterial,
  useDeleteMaterial,
  extractYouTubeId,
  getYouTubeThumbnail
} from '@/hooks/useCourseMaterials';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments';
import {
  useCourseEnrollments,
  useAllStudents,
  useTeacherEnrollStudent,
  useTeacherUnenrollStudent,
  useTeacherUnenrollAllStudents
} from '@/hooks/useEnrollments';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Users,
  Megaphone,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
  Upload,
  UserPlus,
  UserMinus,
  Image,
  UsersRound,
  Plus,
  ClipboardList,
  Youtube,
  Link,
  File,
  Clock,
  Award,
  Calendar
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MaterialViewer } from '@/components/MaterialViewer';
import { format } from 'date-fns';

/**
 * Helper to format file size.
 */
const formatFileSize = (bytes: number | null) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Teacher Course Detail page.
 * 
 * Comprehensive management view for a single course.
 * Features:
 * - Course metadata editing (Title, Description, Thumbnail)
 * - Publishing control
 * - Student management (Enroll/Unenroll)
 * - Exam management with inline create
 * - Assignment management with inline create
 * - Material management with inline upload
 * - Announcement management with inline create
 * 
 * @returns {JSX.Element} The rendered Course Detail page.
 */
const TeacherCourseDetail = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const uploadThumbnail = useUploadCourseThumbnail();

  const course = courses.find(c => c.id === courseId);

  const { exams, isLoading: examsLoading } = useExams();
  const { materials, isLoading: materialsLoading } = useCourseMaterials();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments(courseId);
  const { enrollments, isLoading: enrollmentsLoading } = useCourseEnrollments(courseId || '');
  const { data: allStudents = [], isLoading: studentsLoading } = useAllStudents();
  const enrollStudent = useTeacherEnrollStudent();
  const unenrollStudent = useTeacherUnenrollStudent();
  const unenrollAllStudents = useTeacherUnenrollAllStudents();

  // Material hooks
  const uploadMaterial = useUploadMaterial();
  const addVideoMaterial = useAddVideoMaterial();
  const deleteMaterial = useDeleteMaterial();

  // Announcement hooks
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  // Assignment hooks
  const deleteAssignment = useDeleteAssignment();

  const courseExams = exams.filter(e => e.course_id === courseId);
  const courseMaterials = materials.filter(m => m.course_id === courseId);
  const courseAnnouncements = announcements.filter(a => a.course_id === courseId);
  const courseAssignments = assignments.filter(a => a.course_id === courseId);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentEmailSearch, setStudentEmailSearch] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState<typeof courseMaterials[0] | null>(null);
  const [activeTab, setActiveTab] = useState('students');

  // Material upload state
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [materialUploadType, setMaterialUploadType] = useState<'file' | 'video'>('file');
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', videoUrl: '' });
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);

  // Announcement state
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  // Get students not already enrolled and filter by search
  const enrolledStudentIds = new Set(enrollments.map(e => e.student_id));
  const availableStudents = allStudents.filter(s => !enrolledStudentIds.has(s.user_id));

  // Filter by email search
  const filteredStudents = studentEmailSearch.trim()
    ? availableStudents.filter(s =>
      s.email.toLowerCase().includes(studentEmailSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(studentEmailSearch.toLowerCase())
    )
    : availableStudents;

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
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('courses.courseNotFound')}</h2>
        <Button variant="outline" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('courses.backToCourses')}
        </Button>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditForm({ title: course.title, description: course.description || '' });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ title: '', description: '' });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error(t('courses.enterCourseTitle'));
      return;
    }
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        title: editForm.title,
        description: editForm.description
      });
      setIsEditing(false);
      toast.success(t('toast.courseUpdated'));
    } catch (error) {
      toast.error(t('toast.failedToUpdateCourse'));
    }
  };

  const handlePublish = async () => {
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        status: course.status === 'published' ? 'draft' : 'published'
      });
      toast.success(course.status === 'published' ? t('toast.courseUnpublished') : t('toast.coursePublished'));
    } catch (error) {
      toast.error(t('toast.failedToUpdateCourseStatus'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success(t('toast.courseDeleted'));
      navigate('/teacher/courses');
    } catch (error) {
      toast.error(t('toast.failedToDeleteCourse'));
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.selectImageFile'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('toast.imageMustBeLessThan'));
      return;
    }

    try {
      await uploadThumbnail.mutateAsync({ courseId: course.id, file });
      toast.success(t('toast.thumbnailUploaded'));
    } catch (error) {
      toast.error(t('toast.failedToUploadThumbnail'));
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) {
      toast.error(t('toast.pleaseSelectStudent'));
      return;
    }

    // Find the selected student's details
    const selectedStudent = allStudents.find(s => s.user_id === selectedStudentId);
    if (!selectedStudent) {
      toast.error(t('toast.studentNotFound'));
      return;
    }

    try {
      await enrollStudent.mutateAsync({
        studentId: selectedStudentId,
        courseId: course.id,
        studentEmail: selectedStudent.email,
        studentName: selectedStudent.name,
        courseName: course.title,
        teacherName: profile?.name || 'Your Instructor',
      });
      toast.success(t('toast.studentEnrolled'));
      setIsEnrollDialogOpen(false);
      setSelectedStudentId('');
      setStudentEmailSearch('');
    } catch (error) {
      toast.error(t('toast.failedToEnrollStudent'));
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string) => {
    try {
      await unenrollStudent.mutateAsync({ enrollmentId, courseId: course.id });
      toast.success(t('toast.studentUnenrolled'));
    } catch (error) {
      toast.error(t('toast.failedToUnenrollStudent'));
    }
  };

  const handleUnenrollAllStudents = async () => {
    try {
      await unenrollAllStudents.mutateAsync(course.id);
      toast.success(t('toast.allStudentsUnenrolled'));
    } catch (error) {
      toast.error(t('toast.failedToUnenrollStudent'));
    }
  };

  // Material upload handlers
  const handleMaterialFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedMaterialFile(file);
      if (!materialForm.title) {
        setMaterialForm({ ...materialForm, title: file.name.split('.')[0] });
      }
    }
  };

  const handleMaterialUpload = async () => {
    if (!materialForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (materialUploadType === 'file' && !selectedMaterialFile) {
      toast.error('Please select a file');
      return;
    }

    if (materialUploadType === 'video') {
      if (!materialForm.videoUrl.trim()) {
        toast.error('Please enter a YouTube URL');
        return;
      }
      const videoId = extractYouTubeId(materialForm.videoUrl);
      if (!videoId) {
        toast.error('Invalid YouTube URL');
        return;
      }
    }

    try {
      if (materialUploadType === 'file' && selectedMaterialFile) {
        await uploadMaterial.mutateAsync({
          courseId: course.id,
          title: materialForm.title,
          description: materialForm.description || undefined,
          file: selectedMaterialFile,
        });
      } else {
        await addVideoMaterial.mutateAsync({
          courseId: course.id,
          title: materialForm.title,
          description: materialForm.description || undefined,
          videoUrl: materialForm.videoUrl,
        });
      }
      setMaterialForm({ title: '', description: '', videoUrl: '' });
      setSelectedMaterialFile(null);
      setMaterialUploadType('file');
      setIsMaterialDialogOpen(false);
      toast.success(materialUploadType === 'file' ? t('toast.materialUploaded') : t('toast.videoAdded'));
    } catch (error) {
      toast.error(t('toast.failedToAddMaterial'));
    }
  };

  const handleDeleteMaterial = async (id: string, filePath: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMaterial.mutateAsync({ id, filePath });
      toast.success(t('toast.materialDeleted'));
    } catch (error) {
      toast.error(t('toast.failedToDeleteMaterial'));
    }
  };

  // Announcement handlers
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error(t('toast.fillRequiredFields'));
      return;
    }

    try {
      await createAnnouncement.mutateAsync({
        courseId: course.id,
        title: announcementForm.title,
        content: announcementForm.content,
      });
      setAnnouncementForm({ title: '', content: '' });
      setIsAnnouncementDialogOpen(false);
      toast.success(t('toast.announcementPosted'));
    } catch (error) {
      toast.error(t('toast.failedToPostAnnouncement'));
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncement.mutateAsync(id);
      toast.success(t('toast.announcementDeleted'));
    } catch (error) {
      toast.error(t('toast.failedToDeleteAnnouncement'));
    }
  };

  // Assignment handlers
  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success(t('toast.assignmentDeleted'));
    } catch (error) {
      toast.error(t('toast.failedToDeleteAssignment'));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => navigate('/teacher/courses')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('courses.backToCourses')}
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnail Section */}
          <div className="relative group">
            <div className="w-48 h-32 rounded-lg overflow-hidden bg-gradient-hero flex items-center justify-center">
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadThumbnail.isPending}
            >
              {uploadThumbnail.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Image className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Course Info */}
          <div className="flex-1 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {isEditing ? (
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">{t('courses.courseTitle')}</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">{t('courses.description')}</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="max-w-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} disabled={updateCourse.isPending}>
                    {updateCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('courses.saveChanges')}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                    {t('courses.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  {course.description || t('courses.noDescription')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('courses.created')} {new Date(course.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {!isEditing && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit className="w-4 h-4" />
                  {t('courses.edit')}
                </Button>
                <Button
                  variant={course.status === 'published' ? 'outline' : 'default'}
                  onClick={handlePublish}
                  disabled={updateCourse.isPending}
                >
                  {course.status === 'published' ? t('courses.unpublish') : t('courses.publish')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('courses.deleteCourse')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('courses.deleteCourseConfirm')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Clickable to navigate to tabs */}
      {/* <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('students')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
              <p className="text-sm text-muted-foreground">{t('courses.students')}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('exams')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseExams.length}</p>
              <p className="text-sm text-muted-foreground">{t('courses.exams')}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('assignments')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseAssignments.length}</p>
              <p className="text-sm text-muted-foreground">{t('courses.assignments')}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('materials')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseMaterials.length}</p>
              <p className="text-sm text-muted-foreground">{t('nav.materials')}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('announcements')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courseAnnouncements.length}</p>
              <p className="text-sm text-muted-foreground">{t('courses.announcements')}</p>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="students">{t('courses.students')} ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="exams">{t('courses.exams')} ({courseExams.length})</TabsTrigger>
          <TabsTrigger value="assignments">{t('courses.assignments')} ({courseAssignments.length})</TabsTrigger>
          <TabsTrigger value="materials">{t('nav.materials')} ({courseMaterials.length})</TabsTrigger>
          <TabsTrigger value="announcements">{t('courses.announcements')} ({courseAnnouncements.length})</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-end gap-2">
            {enrollments.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <UsersRound className="w-4 h-4" />
                    {t('courses.removeAll')} ({enrollments.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('courses.removeAllStudents')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('courses.removeAllStudentsConfirm', { count: enrollments.length })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleUnenrollAllStudents}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {unenrollAllStudents.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t('courses.removeAll')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <UserPlus className="w-4 h-4" />
                  {t('courses.enrollStudent')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('courses.enrollStudent')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="student-email-search">{t('courses.searchByEmailName')}</Label>
                        <Input
                          id="student-email-search"
                          placeholder={t('courses.enterEmailName')}
                          value={studentEmailSearch}
                          onChange={(e) => {
                            setStudentEmailSearch(e.target.value);
                            setSelectedStudentId('');
                          }}
                        />
                      </div>

                      {availableStudents.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          {t('courses.noStudentsAvailable')}
                        </p>
                      ) : filteredStudents.length === 0 && studentEmailSearch.trim() ? (
                        <p className="text-muted-foreground text-center py-4">
                          {t('courses.noStudentFound')}
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>{t('courses.selectStudent')}</Label>
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                              <SelectTrigger>
                                <SelectValue placeholder={t('courses.chooseStudent')} />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredStudents.map(student => (
                                  <SelectItem key={student.user_id} value={student.user_id}>
                                    <div className="flex flex-col items-start">
                                      <span>{student.name}</span>
                                      <span className="text-xs text-muted-foreground">{student.email}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={handleEnrollStudent}
                            className="w-full"
                            disabled={enrollStudent.isPending || !selectedStudentId}
                          >
                            {enrollStudent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {t('courses.enrollStudent')}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {enrollmentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : enrollments.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('courses.noStudentsEnrolled')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="border-0 shadow-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={enrollment.student.avatar_url || undefined} />
                        <AvatarFallback>
                          {enrollment.student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{enrollment.student.name}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('courses.removeStudent')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('courses.removeStudentConfirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnenrollStudent(enrollment.id)}>
                              {t('courses.remove')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="default" onClick={() => navigate(`/teacher/exams/new?courseId=${courseId}`)}>
              <Plus className="w-4 h-4" />
              {t('courses.createExam')}
            </Button>
          </div>

          {examsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseExams.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('courses.noExams')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseExams.map((exam) => (
                <Card key={exam.id} className="border-0 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <CardDescription>{exam.description || 'No description'}</CardDescription>
                      </div>
                      <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                        {t('common.active')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exam.duration} {t('courses.minutes')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {exam.total_points} {t('courses.pts')}
                      </span>
                      {exam.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {t('exams.due')}: {format(new Date(exam.end_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                        {t('courses.edit')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="default" onClick={() => navigate(`/teacher/assignments/new?courseId=${courseId}`)}>
              <Plus className="w-4 h-4" />
              {t('courses.createAssignment')}
            </Button>
          </div>

          {assignmentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseAssignments.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('courses.noAssignments')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseAssignments.map((assignment) => (
                <Card key={assignment.id} className="border-0 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description || 'No description'}</CardDescription>
                      </div>
                      <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {t('courses.dueDate')} {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {assignment.max_points} {t('courses.pts')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                        {t('courses.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}/submissions`)}
                      >
                        {t('courses.viewSubmissions')}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('courses.deleteAssignment')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('courses.deleteAssignmentConfirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)}>
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Upload className="w-4 h-4" />
                  {t('courses.uploadMaterial')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('courses.addMaterial')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Tabs value={materialUploadType} onValueChange={(v) => setMaterialUploadType(v as 'file' | 'video')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="file" className="gap-2">
                        <Upload className="w-4 h-4" />
                        {t('courses.uploadMaterial')}
                      </TabsTrigger>
                      <TabsTrigger value="video" className="gap-2">
                        <Youtube className="w-4 h-4" />
                        {t('courses.addVideo')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {materialUploadType === 'file' ? (
                    <div className="space-y-2">
                      <Label>{t('courses.selectFile')}</Label>
                      <input
                        ref={materialFileInputRef}
                        type="file"
                        onChange={handleMaterialFileSelect}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.jpg,.jpeg,.png,.gif"
                        className="hidden"
                      />
                      <div
                        onClick={() => materialFileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-secondary transition-colors"
                      >
                        {selectedMaterialFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <File className="w-5 h-5 text-secondary" />
                            <span className="text-sm font-medium">{selectedMaterialFile.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(selectedMaterialFile.size)})
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, DOC, PPT, Video, Images (max 50MB)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>{t('courses.videoUrl')}</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={materialForm.videoUrl}
                          onChange={(e) => setMaterialForm({ ...materialForm, videoUrl: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                      {materialForm.videoUrl && extractYouTubeId(materialForm.videoUrl) && (
                        <div className="mt-2 rounded-lg overflow-hidden border">
                          <img
                            src={getYouTubeThumbnail(extractYouTubeId(materialForm.videoUrl)!)}
                            alt="Video thumbnail"
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Supports youtube.com and youtu.be links
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('courses.materialTitle')}</Label>
                    <Input
                      placeholder={t('courses.enterTitle')}
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('courses.materialDescription')}</Label>
                    <Textarea
                      placeholder={t('courses.enterDescription')}
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  <Button
                    onClick={handleMaterialUpload}
                    className="w-full"
                    disabled={uploadMaterial.isPending || addVideoMaterial.isPending}
                  >
                    {(uploadMaterial.isPending || addVideoMaterial.isPending) && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {materialUploadType === 'file' ? t('courses.uploadMaterial') : t('courses.addVideo')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {materialsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseMaterials.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('materials.noMaterials')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseMaterials.map((material) => {
                const isVideo = !!material.video_url;
                const videoId = isVideo ? extractYouTubeId(material.video_url!) : null;

                return (
                  <Card
                    key={material.id}
                    className="border-0 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setViewingMaterial(material)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {isVideo && videoId ? (
                          <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={getYouTubeThumbnail(videoId)}
                              alt={material.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-secondary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{material.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {material.description || material.file_name || 'YouTube Video'}
                          </p>
                          {material.file_size && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(material.file_size)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteMaterial(material.id, material.file_path, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <MaterialViewer
            isOpen={!!viewingMaterial}
            onClose={() => setViewingMaterial(null)}
            material={viewingMaterial}
          />
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Plus className="w-4 h-4" />
                  {t('courses.postAnnouncement')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('courses.postAnnouncement')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('courses.announcementTitle')}</Label>
                    <Input
                      placeholder={t('courses.announcementTitle')}
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('courses.announcementContent')}</Label>
                    <Textarea
                      placeholder={t('courses.writeAnnouncement')}
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      rows={4}
                      maxLength={2000}
                    />
                  </div>
                  <Button
                    onClick={handleCreateAnnouncement}
                    className="w-full"
                    disabled={createAnnouncement.isPending}
                  >
                    {createAnnouncement.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('courses.postAnnouncement')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {announcementsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseAnnouncements.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('courses.noAnnouncements')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-0 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(announcement.created_at), 'PPp')}
                        </CardDescription>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('courses.deleteAnnouncement')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('courses.deleteAnnouncementConfirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAnnouncement(announcement.id)}>
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default TeacherCourseDetail;
