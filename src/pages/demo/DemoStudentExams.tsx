import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Award, Play, Lock, CheckCircle, AlignLeft, Timer, AlertCircle } from 'lucide-react';
import { demoExams, demoQuestions } from '@/data/demoData';
import { toast } from 'sonner';
import FormulaText from '@/components/FormulaText';

export default function DemoStudentExams() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft] = useState(3600); // 60 minutes in seconds

  const publishedExams = demoExams.filter(e => e.status === 'published');
  const currentExamQuestions = demoQuestions.filter(q => q.exam_id === selectedExam);

  const handleStartExam = (examId: string) => {
    setSelectedExam(examId);
    setCurrentQuestion(0);
    setAnswers({});
    setIsExamOpen(true);
  };

  const handleSubmit = () => {
    toast.info('Submit is disabled in demo mode. This is a preview experience!', {
      action: {
        label: 'Contact Us',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const exam = demoExams.find(e => e.id === selectedExam);
  const question = currentExamQuestions[currentQuestion];
  const progress = currentExamQuestions.length > 0
    ? ((currentQuestion + 1) / currentExamQuestions.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Exams</h1>
        <p className="text-muted-foreground">Take exams to test your knowledge</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {publishedExams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <Badge variant="default">Ready</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{exam.course_title}</p>
              <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {exam.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {exam.total_points} pts
                </div>
                <span>KKM: {exam.kkm}%</span>
              </div>
              <Button className="w-full" onClick={() => handleStartExam(exam.id)}>
                <Play className="h-4 w-4 mr-2" />
                Start Exam
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam Taking Dialog */}
      <Dialog open={isExamOpen} onOpenChange={setIsExamOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{exam?.title}</DialogTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm bg-amber-500/10 px-3 py-1 rounded-full">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">Demo Mode</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Timer className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </DialogHeader>

          {currentExamQuestions.length > 0 && question && (
            <div className="space-y-6 pt-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {currentExamQuestions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} />
              </div>

              {/* Question Navigation */}
              <div className="flex flex-wrap gap-2">
                {currentExamQuestions.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={currentQuestion === index ? 'default' : answers[q.id] !== undefined ? 'secondary' : 'outline'}
                    size="sm"
                    className="w-10 h-10"
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              {/* Current Question */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    {question.type === 'multiple-choice' ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <AlignLeft className="h-5 w-5 text-primary" />
                    )}
                    <Badge variant="outline">{question.points} points</Badge>
                    <Badge variant="secondary">{question.type}</Badge>
                  </div>

                  <div className="text-lg mb-6">
                    <FormulaText text={question.question} />
                  </div>

                  {question.type === 'multiple-choice' && question.options && (
                    <div className="space-y-3">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            answers[question.id] === index
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setAnswers({ ...answers, [question.id]: index })}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            answers[question.id] === index ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span><FormulaText text={option} /></span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'essay' && (
                    <Textarea
                      placeholder="Write your answer here..."
                      value={answers[question.id] as string || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      rows={6}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>

                {currentQuestion < currentExamQuestions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    <Lock className="h-4 w-4 mr-2" />
                    Submit Exam (Demo)
                  </Button>
                )}
              </div>

              {/* Demo Notice */}
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700">Demo Experience</p>
                  <p className="text-sm text-amber-600">
                    This is an interactive demo. You can navigate through questions and select answers,
                    but submission is disabled. Contact us for full access!
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
