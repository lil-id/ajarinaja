import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments, useEnroll } from '@/hooks/useEnrollments';
import { BookOpen, Loader2, Search, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ExploreCourses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const enroll = useEnroll();

  const isLoading = coursesLoading || enrollmentsLoading;

  // Filter only published courses
  const publishedCourses = courses.filter(c => c.status === 'active');
  
  // Filter by search query
  const filteredCourses = publishedCourses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const enrolledCourseIds = enrollments.map(e => e.course_id);

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll.mutateAsync(courseId);
      toast.success('Successfully enrolled in course!');
    } catch (error) {
      toast.error('Failed to enroll in course');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Explore Courses</h1>
          <p className="text-muted-foreground mt-1">
            Discover and enroll in new courses
          </p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{publishedCourses.length}</p>
              <p className="text-sm text-muted-foreground">Available Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Math.max(0, publishedCourses.length - enrollments.length)}</p>
              <p className="text-sm text-muted-foreground">New to Explore</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredCourses.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? 'Try a different search term' : 'No courses available at the moment'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            return (
              <Card 
                key={course.id}
                className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up overflow-hidden group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-40 bg-gradient-hero flex items-center justify-center overflow-hidden relative">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-primary-foreground/50" />
                  )}
                  {isEnrolled && (
                    <Badge className="absolute top-3 right-3 bg-green-500/90 hover:bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Enrolled
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {isEnrolled ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/student/courses/${course.id}`)}
                    >
                      View Course
                    </Button>
                  ) : (
                    <Button 
                      variant="hero" 
                      className="w-full"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enroll.isPending}
                    >
                      {enroll.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Enroll Now'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreCourses;
