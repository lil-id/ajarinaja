import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { mockExams, mockCourses } from '@/data/mockData';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const exam = mockExams.find(e => e.id === examId);
  const course = exam ? mockCourses.find(c => c.id === exam.courseId) : null;
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeLeft, setTimeLeft] = useState(exam ? exam.duration * 60 : 0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!exam || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, isSubmitted]);

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-0 shadow-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Exam not found</h2>
          <Button onClick={() => navigate('/student/exams')}>Back to Exams</Button>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const question = exam.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;

  const handleAnswer = (value: string | number) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleSubmit = () => {
    // Calculate score for multiple choice questions
    let score = 0;
    exam.questions.forEach(q => {
      if (q.type === 'multiple-choice' && answers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    });
    
    setIsSubmitted(true);
    toast.success('Exam submitted successfully!');
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Exam Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your answers have been recorded. Essay questions will be graded by your teacher.
            </p>
            <Button onClick={() => navigate('/student/exams')}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{course?.title}</p>
          <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
        )}>
          <Clock className="w-5 h-5" />
          <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestion + 1} of {exam.questions.length}</span>
          <span>{question.points} points</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              question.type === 'multiple-choice' 
                ? "bg-primary/10 text-primary" 
                : "bg-secondary/10 text-secondary"
            )}>
              {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Essay'}
            </span>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === 'multiple-choice' && question.options ? (
            <RadioGroup
              value={String(answers[question.id] ?? '')}
              onValueChange={(v) => handleAnswer(Number(v))}
              className="space-y-3"
            >
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    answers[question.id] === index
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                  onClick={() => handleAnswer(index)}
                >
                  <RadioGroupItem value={String(index)} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              placeholder="Write your answer here..."
              rows={8}
              value={String(answers[question.id] || '')}
              onChange={(e) => handleAnswer(e.target.value)}
              className="resize-none"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentQuestion === exam.questions.length - 1 ? (
          <Button variant="hero" onClick={handleSubmit}>
            Submit Exam
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {exam.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                  currentQuestion === i
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id] !== undefined
                    ? "bg-secondary/20 text-secondary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeExam;
