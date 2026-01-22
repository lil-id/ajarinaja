import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Clock,
  Award,
  Play,
  Lock,
  CheckCircle,
  AlignLeft,
  Timer,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListChecks
} from 'lucide-react';
import { demoExams, demoQuestions } from '@/data/demoData';
import FormulaText from '@/components/FormulaText';
import { cn } from '@/lib/utils';

// Extended demo questions for more variety
const extendedQuestions = [
  ...demoQuestions.filter(q => q.exam_id === 'demo-exam-1'),
  {
    id: 'demo-q-4',
    exam_id: 'demo-exam-1',
    type: 'multi-select',
    question: 'Select all expressions that are polynomials:',
    options: ['$3x^2 + 2x - 1$', '$\\frac{1}{x} + 5$', '$x^3 - 4x$', '$\\sqrt{x} + 2$', '$5x^4 - 2x^2 + 7$'],
    correct_answers: [0, 2, 4],
    points: 15,
    order_index: 3,
  },
  {
    id: 'demo-q-5',
    exam_id: 'demo-exam-1',
    type: 'multiple-choice',
    question: 'If $f(x) = 2x + 3$, what is $f(4)$?',
    options: ['8', '11', '14', '7'],
    correct_answer: 1,
    points: 10,
    order_index: 4,
  },
];

/**
 * Demo Student Take Exam page.
 * 
 * A full-screen, immersive exam taking interface.
 * Features:
 * - Countdown timer
 * - Question navigation (Next/Prev, Jump list)
 * - Progress bar
 * - Support for various question types (Multiple Choice, Multi-select, Essay)
 * - Interactive answer selection
 * - Demo mode restrictions (submission disabled)
 * 
 * @returns {JSX.Element} The rendered Exam Taking page.
 */
export default function DemoStudentTakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | number[] | string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const exam = demoExams.find(e => e.id === examId);
  const questions = extendedQuestions.filter(q => q.exam_id === examId);
  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [examStarted, timeLeft]);

  const handleStartExam = () => {
    setExamStarted(true);
    setTimeLeft((exam?.duration || 60) * 60);
    setCurrentQuestion(0);
    setAnswers({});
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    toast.info('Submit is disabled in demo mode. This is a preview experience!', {
      action: {
        label: 'Contact Us',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: string, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleMultiSelectAnswer = (questionId: string, optionIndex: number) => {
    const currentAnswer = (answers[questionId] as number[]) || [];
    const newAnswer = currentAnswer.includes(optionIndex)
      ? currentAnswer.filter(i => i !== optionIndex)
      : [...currentAnswer, optionIndex];
    setAnswers({ ...answers, [questionId]: newAnswer });
  };

  const handleEssayAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const getAnsweredCount = () => {
    return questions.filter(q => {
      const answer = answers[q.id];
      if (q.type === 'essay') return typeof answer === 'string' && answer.trim().length > 0;
      if (q.type === 'multi-select') return Array.isArray(answer) && answer.length > 0;
      return answer !== undefined;
    }).length;
  };

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Exam not found</p>
            <Button className="mt-4" onClick={() => navigate('/demo/student/exams')}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-exam start screen
  if (!examStarted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/demo/student/exams')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">{exam.course_title}</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
            <CardDescription>{exam.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{exam.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Award className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="font-semibold">{exam.total_points} points</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <ListChecks className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="font-semibold">{questions.length} questions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <CheckCircle className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Passing Grade</p>
                  <p className="font-semibold">{exam.kkm}%</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">Demo Mode</p>
                <p className="text-sm text-amber-600">
                  This is a demo exam. You can experience the full exam interface, but submission is disabled.
                </p>
              </div>
            </div>

            <Button onClick={handleStartExam} className="w-full" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main exam interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">{exam.course_title}</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Demo Mode
          </Badge>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
          timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-muted"
        )}>
          <Timer className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{getAnsweredCount()} of {questions.length} answered</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, index) => {
          const answer = answers[q.id];
          const isAnswered = q.type === 'essay'
            ? typeof answer === 'string' && answer.trim().length > 0
            : q.type === 'multi-select'
              ? Array.isArray(answer) && answer.length > 0
              : answer !== undefined;

          return (
            <Button
              key={q.id}
              variant={currentQuestion === index ? 'default' : isAnswered ? 'secondary' : 'outline'}
              size="sm"
              className="w-10 h-10"
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </Button>
          );
        })}
      </div>

      {/* Current Question */}
      {question && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {question.type === 'multiple-choice' && <CheckCircle className="h-5 w-5 text-primary" />}
              {question.type === 'multi-select' && <ListChecks className="h-5 w-5 text-primary" />}
              {question.type === 'essay' && <AlignLeft className="h-5 w-5 text-primary" />}
              <Badge variant="outline">{question.points} points</Badge>
              <Badge variant="secondary">
                {question.type === 'multiple-choice' ? 'Single Choice' :
                  question.type === 'multi-select' ? 'Multiple Choice' : 'Essay'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg">
              <FormulaText text={question.question} />
            </div>

            {/* Multiple Choice */}
            {question.type === 'multiple-choice' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                      answers[question.id] === index
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => handleSelectAnswer(question.id, index)}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium',
                      answers[question.id] === index
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    )}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1"><FormulaText text={option} /></span>
                  </div>
                ))}
              </div>
            )}

            {/* Multi-Select */}
            {question.type === 'multi-select' && question.options && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select all that apply:</p>
                {question.options.map((option, index) => {
                  const selected = ((answers[question.id] as number[]) || []).includes(index);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                        selected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                      )}
                      onClick={() => handleMultiSelectAnswer(question.id, index)}
                    >
                      <Checkbox checked={selected} />
                      <span className="flex-1"><FormulaText text={option} /></span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Essay */}
            {question.type === 'essay' && (
              <Textarea
                placeholder="Write your answer here..."
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleEssayAnswer(question.id, e.target.value)}
                rows={8}
                className="text-base"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {currentQuestion < questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
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
  );
}