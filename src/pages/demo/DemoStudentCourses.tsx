import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Users, FileText, Play, Lock } from 'lucide-react';
import { demoCourses, demoMaterials } from '@/data/demoData';
import { toast } from 'sonner';

export default function DemoStudentCourses() {
  const enrolledCourses = demoCourses.filter(c => c.status === 'published');

  const handleUnenroll = () => {
    toast.info('Unenroll is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">Your enrolled courses and progress</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {enrolledCourses.map((course, index) => {
          const courseMaterials = demoMaterials.filter(m => m.course_id === course.id);
          const progress = 30 + (index * 25); // Simulated progress
          
          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge variant="default">Enrolled</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {course.exam_count} exams
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {courseMaterials.length} materials
                  </div>
                </div>

                {/* Materials Preview */}
                {courseMaterials.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Recent Materials</p>
                    <div className="space-y-2">
                      {courseMaterials.slice(0, 2).map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="truncate">{material.title}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleUnenroll}>
                    <Lock className="h-4 w-4 mr-2" />
                    Unenroll
                  </Button>
                  <Button className="flex-1">
                    Continue Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
