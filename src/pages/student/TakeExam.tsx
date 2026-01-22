import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useExamWithQuestions } from '@/hooks/useExams';
import { useSubmitExam, useMySubmission } from '@/hooks/useSubmissions';
import { useCourses } from '@/hooks/useCourses';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import FormulaText from '@/components/FormulaText';

/**
 * Take Exam page.
 * 
 * Interactive exam taking interface.
 * Features:
 * - Live countdown timer
 * - Question navigation
 * - Support for Multiple Choice, Multi-select, and Essay questions
 * - Auto-submission on timeout
 * 
 * @returns {JSX.Element} The rendered Take Exam page.
 */
const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { data: exam, isLoading: examLoading } = useExamWithQuestions(examId || '');
  const { courses } = useCourses();
  const { data: existingSubmission } = useMySubmission(examId || '');
  const submitExam = useSubmitExam();

  const course = exam ? courses.find(c => c.id === exam.course_id) : null;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | number[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (exam && started && !isSubmitted) {
      setTimeLeft(exam.duration * 60);
    }
  }, [exam, started, isSubmitted]);

  useEffect(() => {
    if (!started || isSubmitted || timeLeft <= 0) return;

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
  }, [started, isSubmitted, timeLeft]);

  // Check if already submitted
  useEffect(() => {
    if (existingSubmission) {
      setIsSubmitted(true);
    }
  }, [existingSubmission]);

  if (examLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

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

  const handleAnswer = (value: string | number | number[]) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleSubmit = async () => {
    // Calculate score for multiple choice questions
    let score = 0;
    exam.questions.forEach(q => {
      if (q.type === 'multiple-choice' && answers[q.id] === q.correct_answer) {
        score += q.points;
      }
    });

    try {
      await submitExam.mutateAsync({
        examId: exam.id,
        answers,
        score,
      });
      setIsSubmitted(true);
      toast.success('Exam submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit exam');
    }
  };

  if (existingSubmission || isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {existingSubmission ? 'Already Submitted!' : 'Exam Submitted!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {existingSubmission
                ? `Your score: ${existingSubmission.score ?? 'Pending grading'}/${exam.total_points}`
                : 'Your answers have been recorded. Essay questions will be graded by your teacher.'
              }
            </p>
            <Button onClick={() => navigate('/student/exams')}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>{exam.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Course</p>
              <p className="font-medium">{course?.title}</p>
            </div>

            {/* Exam Description/Instructions */}
            {exam.description && (
              <div className="p-4 border rounded-lg bg-card">
                <p className="text-sm font-medium text-foreground mb-2">Instructions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-bold">{exam.duration} min</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl mb-1">📝</p>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="font-bold">{exam.questions.length}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl mb-1">🏆</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="font-bold">{exam.total_points}</p>
              </div>
            </div>
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <p className="text-sm text-destructive">
                ⚠️ Once you start, the timer will begin. Make sure you have enough time to complete the exam.
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={() => setStarted(true)}>
              Start Exam
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
                : question.type === 'multi-select'
                  ? "bg-secondary/10 text-secondary"
                  : "bg-muted text-muted-foreground"
            )}>
              {question.type === 'multiple-choice' ? 'Multiple Choice' : question.type === 'multi-select' ? 'Multi-Select' : 'Essay'}
            </span>
            {question.type === 'multi-select' && (
              <span className="text-xs text-muted-foreground">(Select all that apply)</span>
            )}
          </div>
          <CardTitle className="text-xl leading-relaxed">
            <FormulaText text={question.question} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === 'multiple-choice' && question.options ? (
            <RadioGroup
              value={String(answers[question.id] ?? '')}
              onValueChange={(v) => handleAnswer(Number(v))}
              className="space-y-3"
            >
              {(question.options as string[]).map((option, index) => (
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
                    <FormulaText text={option} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : question.type === 'multi-select' && question.options ? (
            <div className="space-y-3">
              {(question.options as string[]).map((option, index) => {
                const currentAnswers = (answers[question.id] as number[]) || [];
                const isSelected = currentAnswers.includes(index);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                      isSelected
                        ? "border-secondary bg-secondary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                    onClick={() => {
                      const newAnswers = isSelected
                        ? currentAnswers.filter(a => a !== index)
                        : [...currentAnswers, index];
                      handleAnswer(newAnswers);
                    }}
                  >
                    <Checkbox checked={isSelected} />
                    <Label className="flex-1 cursor-pointer">
                      <FormulaText text={option} />
                    </Label>
                  </div>
                );
              })}
            </div>
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
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={submitExam.isPending}
          >
            {submitExam.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
