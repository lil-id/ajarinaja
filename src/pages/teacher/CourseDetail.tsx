import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeacherCourses, useUpdateCourse, useDeleteCourse, useUploadCourseThumbnail } from '@/hooks/useCourses';
import { useExams } from '@/hooks/useExams';
import { useCourseMaterials } from '@/hooks/useCourseMaterials';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { 
  useCourseEnrollments, 
  useAllStudents, 
  useTeacherEnrollStudent, 
  useTeacherUnenrollStudent 
} from '@/hooks/useEnrollments';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Users, 
  Calendar,
  Megaphone,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
  Upload,
  UserPlus,
  UserMinus,
  Image
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

const TeacherCourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { courses, isLoading: coursesLoading } = useTeacherCourses();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const uploadThumbnail = useUploadCourseThumbnail();
  
  const course = courses.find(c => c.id === courseId);
  
  const { exams, isLoading: examsLoading } = useExams();
  const { materials, isLoading: materialsLoading } = useCourseMaterials();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { enrollments, isLoading: enrollmentsLoading } = useCourseEnrollments(courseId || '');
  const { data: allStudents = [], isLoading: studentsLoading } = useAllStudents();
  const enrollStudent = useTeacherEnrollStudent();
  const unenrollStudent = useTeacherUnenrollStudent();
  
  const courseExams = exams.filter(e => e.course_id === courseId);
  const courseMaterials = materials.filter(m => m.course_id === courseId);
  const courseAnnouncements = announcements.filter(a => a.course_id === courseId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Get students not already enrolled
  const enrolledStudentIds = new Set(enrollments.map(e => e.student_id));
  const availableStudents = allStudents.filter(s => !enrolledStudentIds.has(s.user_id));

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
        <Button variant="outline" onClick={() => navigate('/teacher/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
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
      toast.error('Please enter a course title');
      return;
    }
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        title: editForm.title,
        description: editForm.description
      });
      setIsEditing(false);
      toast.success('Course updated successfully!');
    } catch (error) {
      toast.error('Failed to update course');
    }
  };

  const handlePublish = async () => {
    try {
      await updateCourse.mutateAsync({ 
        id: course.id, 
        status: course.status === 'published' ? 'draft' : 'published' 
      });
      toast.success(course.status === 'published' ? 'Course unpublished' : 'Course published!');
    } catch (error) {
      toast.error('Failed to update course status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success('Course deleted');
      navigate('/teacher/courses');
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      await uploadThumbnail.mutateAsync({ courseId: course.id, file });
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    try {
      await enrollStudent.mutateAsync({ studentId: selectedStudentId, courseId: course.id });
      toast.success('Student enrolled successfully!');
      setIsEnrollDialogOpen(false);
      setSelectedStudentId('');
    } catch (error) {
      toast.error('Failed to enroll student');
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string) => {
    try {
      await unenrollStudent.mutateAsync({ enrollmentId, courseId: course.id });
      toast.success('Student unenrolled');
    } catch (error) {
      toast.error('Failed to unenroll student');
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
          Back to Courses
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
                  <Label htmlFor="edit-title">Course Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
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
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                    Cancel
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
                  {course.description || 'No description'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Created {new Date(course.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {!isEditing && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button 
                  variant={course.status === 'published' ? 'outline' : 'hero'}
                  onClick={handlePublish}
                  disabled={updateCourse.isPending}
                >
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Course</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this course? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
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
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="exams">Exams ({courseExams.length})</TabsTrigger>
          <TabsTrigger value="materials">Materials ({courseMaterials.length})</TabsTrigger>
          <TabsTrigger value="announcements">Announcements ({courseAnnouncements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <UserPlus className="w-4 h-4" />
                  Enroll Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No students available to enroll
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Select Student</Label>
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStudents.map(student => (
                              <SelectItem key={student.user_id} value={student.user_id}>
                                {student.name} ({student.email})
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
                        Enroll Student
                      </Button>
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
                <p className="text-muted-foreground">No students enrolled yet</p>
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
                            <AlertDialogTitle>Unenroll Student</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to unenroll {enrollment.student.name} from this course?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnenrollStudent(enrollment.id)}>
                              Unenroll
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

        <TabsContent value="exams" className="space-y-4">
          {examsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseExams.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No exams created for this course</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/teacher/exams')}
                >
                  Go to Exams
                </Button>
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
                        {exam.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{exam.duration} minutes</span>
                      <span>{exam.total_points} points</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          {materialsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : courseMaterials.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No materials uploaded for this course</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/teacher/materials')}
                >
                  Go to Materials
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseMaterials.map((material) => (
                <Card key={material.id} className="border-0 shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription>{material.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{material.file_name}</span>
                      <span>{(material.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                <Megaphone className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No announcements for this course</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/teacher/announcements')}
                >
                  Go to Announcements
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="border-0 shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <CardDescription>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{announcement.content}</p>
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
