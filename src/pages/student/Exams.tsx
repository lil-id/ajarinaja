import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useExams } from '@/hooks/useExams';
import { useSubmissions } from '@/hooks/useSubmissions';
import { FileText, Clock, Award, ArrowRight, CheckCircle, Loader2, Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const StudentExams = () => {
  const navigate = useNavigate();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const { exams, isLoading: examsLoading } = useExams();
  const { submissions, isLoading: submissionsLoading } = useSubmissions();

  const isLoading = coursesLoading || enrollmentsLoading || examsLoading || submissionsLoading;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  
  const now = new Date();
  
  // Filter exams: published, enrolled, and within schedule (if set)
  const availableExams = exams.filter(e => {
    if (e.status !== 'published') return false;
    if (!enrolledCourseIds.includes(e.course_id)) return false;
    
    // Check schedule if dates are set
    if (e.start_date && new Date(e.start_date) > now) return false;
    if (e.end_date && new Date(e.end_date) < now) return false;
    
    return true;
  });

  // Upcoming scheduled exams (not yet available)
  const upcomingExams = exams.filter(e => {
    if (e.status !== 'published') return false;
    if (!enrolledCourseIds.includes(e.course_id)) return false;
    if (e.start_date && new Date(e.start_date) > now) return true;
    return false;
  });
  
  const completedExamIds = submissions.map(s => s.exam_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Exams</h1>
        <p className="text-muted-foreground mt-1">
          View and take your course exams
        </p>
      </div>

      {/* Available Exams */}
      {availableExams.length === 0 && upcomingExams.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No exams available</h3>
            <p className="text-muted-foreground text-center">
              Enroll in courses to access their exams
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active exams */}
          {availableExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Available Now</h2>
              {availableExams.map((exam, index) => {
                const course = courses.find(c => c.id === exam.course_id);
                const isCompleted = completedExamIds.includes(exam.id);
                const submission = submissions.find(s => s.exam_id === exam.id);

                return (
                  <Card 
                    key={exam.id}
                    className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isCompleted ? 'bg-secondary/10' : 'bg-primary/10'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6 text-secondary" />
                            ) : (
                              <FileText className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{exam.title}</h3>
                            <p className="text-sm text-muted-foreground">{course?.title}</p>
                            {exam.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {exam.duration} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {exam.total_points} pts
                              </span>
                              {exam.end_date && (
                                <span className="flex items-center gap-1 text-destructive">
                                  <Calendar className="w-4 h-4" />
                                  Due: {format(new Date(exam.end_date), 'MMM d, h:mm a')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {isCompleted && submission && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Score</p>
                              <p className="text-lg font-bold text-secondary">
                                {submission.score ?? 'Pending'}/{exam.total_points}
                              </p>
                            </div>
                          )}
                          {isCompleted ? (
                            <Button 
                              variant="outline"
                              onClick={() => navigate(`/student/exam/${exam.id}/results`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Results
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => navigate(`/student/exam/${exam.id}`)}
                            >
                              Take Exam
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Upcoming exams */}
          {upcomingExams.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
              {upcomingExams.map((exam, index) => {
                const course = courses.find(c => c.id === exam.course_id);

                return (
                  <Card 
                    key={exam.id}
                    className="border-0 shadow-card opacity-75 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
                            <Calendar className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{exam.title}</h3>
                            <p className="text-sm text-muted-foreground">{course?.title}</p>
                            {exam.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {exam.duration} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {exam.total_points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Available from</p>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(exam.start_date!), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
