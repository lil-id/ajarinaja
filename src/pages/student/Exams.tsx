import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCourses, mockEnrollments, mockExams, mockSubmissions } from '@/data/mockData';
import { FileText, Clock, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentExams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const enrollments = mockEnrollments.filter(e => e.studentId === user?.id);
  const enrolledCourseIds = enrollments.map(e => e.courseId);
  
  const availableExams = mockExams.filter(
    e => e.status === 'published' && enrolledCourseIds.includes(e.courseId)
  );
  
  const completedExamIds = mockSubmissions
    .filter(s => s.studentId === user?.id)
    .map(s => s.examId);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Exams</h1>
        <p className="text-muted-foreground mt-1">
          View and take your course exams
        </p>
      </div>

      {availableExams.length === 0 ? (
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
        <div className="space-y-4">
          {availableExams.map((exam, index) => {
            const course = mockCourses.find(c => c.id === exam.courseId);
            const isCompleted = completedExamIds.includes(exam.id);
            const submission = mockSubmissions.find(
              s => s.examId === exam.id && s.studentId === user?.id
            );

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
                      <div>
                        <h3 className="font-semibold text-foreground">{exam.title}</h3>
                        <p className="text-sm text-muted-foreground">{course?.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {exam.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {exam.questions.length} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {exam.totalPoints} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {isCompleted && submission && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="text-lg font-bold text-secondary">
                            {submission.score}/{exam.totalPoints}
                          </p>
                        </div>
                      )}
                      <Button 
                        variant={isCompleted ? 'outline' : 'default'}
                        onClick={() => navigate(`/student/exam/${exam.id}`)}
                      >
                        {isCompleted ? 'Review' : 'Take Exam'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
