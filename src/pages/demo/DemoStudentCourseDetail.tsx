import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, BookOpen, FileText, Play, Users, Award, Clock, File, Video, ExternalLink, Lock } from 'lucide-react';
import { demoCourses, demoMaterials, demoExams, demoAssignments, demoAnnouncements } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Demo Student Course Detail page.
 * 
 * Displays comprehensive information about a specific course, including:
 * - Course stats (materials, exams, assignments count)
 * - Tabs for Materials, Exams, Assignments, and Announcements
 * - Previews for materials (video/PDF)
 * - simulated interactions for exams (locked/demo mode)
 * 
 * @returns {JSX.Element} The rendered Course Detail page.
 */
export default function DemoStudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('materials');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const course = demoCourses.find(c => c.id === courseId);
  const materials = demoMaterials.filter(m => m.course_id === courseId);
  const exams = demoExams.filter(e => e.course_id === courseId && e.status === 'published');
  const assignments = demoAssignments.filter(a => a.course_id === courseId && a.status === 'published');
  const announcements = demoAnnouncements.filter(a => a.course_id === courseId);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Course not found</p>
        <Button variant="outline" onClick={() => navigate('/demo/student/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  /**
   * Opens the material viewer dialog for a selected material.
   * @param {any} material - The material object to view.
   */
  const handleViewMaterial = (material: any) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
  };

  /**
   * Simulated handler for taking an exam.
   * Shows a toast notification explaining that this feature is disabled in demo mode.
   */
  const handleTakeExam = () => {
    toast.info('Exam taking is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const progress = 55; // Simulated progress

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/demo/student/courses')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('materials')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materials.length}</p>
                <p className="text-sm text-muted-foreground">Materials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('exams')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-sm text-muted-foreground">Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('assignments')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4 mt-4">
          {materials.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
                <p className="text-muted-foreground text-center">
                  Course materials will appear here when available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {materials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewMaterial(material)}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {material.video_url ? (
                        <Video className="h-6 w-6 text-primary" />
                      ) : (
                        <File className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{material.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{material.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(material.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Play className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exams" className="space-y-4 mt-4">
          {exams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No exams available</h3>
                <p className="text-muted-foreground text-center">
                  Published exams will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <Badge>{exam.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{exam.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {exam.duration} min
                      </Badge>
                      <Badge variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        {exam.total_points} pts
                      </Badge>
                    </div>
                    <Button className="w-full" onClick={handleTakeExam}>
                      <Lock className="h-4 w-4 mr-2" />
                      Take Exam (Demo)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 mt-4">
          {assignments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments</h3>
                <p className="text-muted-foreground text-center">
                  Assignments will appear here when available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Badge variant="outline">{assignment.assignment_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        {assignment.max_points} pts
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Due {format(new Date(assignment.due_date), 'MMM d')}
                      </Badge>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/demo/student/assignments')}>
                      View Assignment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-4">
          {announcements.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No announcements</h3>
                <p className="text-muted-foreground text-center">
                  Course announcements will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Material Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">{selectedMaterial?.description}</p>

            {selectedMaterial?.video_url ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Video Player Preview</p>
                  <Button variant="outline" onClick={() => window.open(selectedMaterial.video_url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Video
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <File className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">{selectedMaterial?.file_name}</p>
                  <p className="text-sm text-muted-foreground mb-4">PDF Viewer Preview</p>
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">File download disabled in demo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
