import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Library, Search, CheckCircle, AlignLeft, Eye, ListChecks, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useCreateExam, useExamWithQuestions, useUpdateExam, Question } from '@/hooks/useExams';
import { useQuestionBank, useIncrementQuestionUsage } from '@/hooks/useQuestionBank';
import { useAddQuestion, useUpdateQuestion, useDeleteQuestion } from '@/hooks/useQuestions';
import { toast } from 'sonner';
import { localDateTimeToUTC, utcToLocalDateTime } from '@/lib/dateUtils';
import VisualEquationBuilder from '@/components/VisualEquationBuilder';
import FormulaText from '@/components/FormulaText';
import RiskCriteriaBuilder, { RiskCriterion } from '@/components/RiskCriteriaBuilder';
import StudentPreviewMode from '@/components/StudentPreviewMode';
import SortableList from '@/components/SortableContext';
import SortableItem from '@/components/SortableItem';
import { arrayMove } from '@dnd-kit/sortable';
import { sendCourseNotification, getEnrolledStudents } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { useSidebarContext } from '@/contexts/SidebarContext';

const formSchema = z.object({
  course_id: z.string().min(1, 'Please select a course'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  duration: z.coerce.number().min(1).max(600),
  kkm: z.coerce.number().min(0).max(100),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'published']),
  risk_on_missed: z.boolean(),
  risk_on_below_kkm: z.boolean(),
  risk_missed_severity: z.enum(['high', 'medium', 'low']),
  risk_below_kkm_severity: z.enum(['high', 'medium', 'low']),
});

type FormData = z.infer<typeof formSchema>;

interface LocalQuestion {
  id: string;
  type: 'multiple-choice' | 'multi-select' | 'essay';
  question: string;
  options: string[];
  correct_answer: number | null;
  correct_answers: number[];
  points: number;
  order_index: number;
  isNew?: boolean;
}

/**
 * Create/Edit Exam page.
 * 
 * Form for creating or editing an exam.
 * Features:
 * - Basic info (Title, description, duration)
 * - Settings (KKM, start/end dates)
 * - Question builder (MCQ, Multi-select, Essay)
 * - Import from Question Bank
 * - Drag-and-drop reordering
 * - Risk Criteria configuration
 * - Student Preview mode
 * 
 * @returns {JSX.Element} The rendered Create/Edit Exam page.
 */
export default function CreateExam() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  const isEditMode = !!examId;
  const { sidebarCollapsed } = useSidebarContext();

  const { courses = [] } = useTeacherCourses();
  const { data: existingExam, isLoading: examLoading } = useExamWithQuestions(examId || '');
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const { data: questionBank = [] } = useQuestionBank();
  const incrementUsage = useIncrementQuestionUsage();

  const [riskCriteria, setRiskCriteria] = useState<RiskCriterion[]>([]);
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState<{
    type: 'multiple-choice' | 'multi-select' | 'essay';
    question: string;
    options: string[];
    correctAnswer: number;
    correctAnswers: number[];
    points: number;
  }>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    correctAnswers: [],
    points: 10,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_id: '',
      title: '',
      description: '',
      duration: 60,
      kkm: 60,
      start_date: '',
      end_date: '',
      status: 'draft',
      risk_on_missed: false,
      risk_on_below_kkm: false,
      risk_missed_severity: 'high',
      risk_below_kkm_severity: 'medium',
    },
  });

  // Load existing exam data in edit mode
  useEffect(() => {
    if (isEditMode && existingExam) {
      const examData = existingExam as any;
      form.reset({
        course_id: existingExam.course_id,
        title: existingExam.title,
        description: existingExam.description || '',
        duration: existingExam.duration,
        kkm: examData.kkm || 60,
        start_date: existingExam.start_date
          ? utcToLocalDateTime(existingExam.start_date)
          : '',
        end_date: existingExam.end_date
          ? utcToLocalDateTime(existingExam.end_date)
          : '',
        status: existingExam.status as 'draft' | 'published',
        risk_on_missed: examData.risk_on_missed || false,
        risk_on_below_kkm: examData.risk_on_below_kkm || false,
        risk_missed_severity: examData.risk_missed_severity || 'high',
        risk_below_kkm_severity: examData.risk_below_kkm_severity || 'medium',
      });

      // Initialize risk criteria from existing exam
      const initialRiskCriteria: RiskCriterion[] = [
        {
          id: crypto.randomUUID(),
          type: 'missed',
          name: 'Missed Submission',
          description: 'Student did not submit by the deadline',
          enabled: examData.risk_on_missed || false,
          severity: examData.risk_missed_severity || 'high',
        },
        {
          id: crypto.randomUUID(),
          type: 'below_kkm',
          name: 'Below Passing Grade (KKM)',
          description: 'Score is below the minimum passing threshold',
          enabled: examData.risk_on_below_kkm || false,
          severity: examData.risk_below_kkm_severity || 'medium',
        },
      ];
      setRiskCriteria(initialRiskCriteria);

      // Load existing questions
      if (existingExam.questions && existingExam.questions.length > 0) {
        setQuestions(existingExam.questions.map((q: Question) => ({
          id: q.id,
          type: q.type as 'multiple-choice' | 'multi-select' | 'essay',
          question: q.question,
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer,
          correct_answers: q.correct_answers || [],
          points: q.points,
          order_index: q.order_index,
        })));
      }
    }
  }, [isEditMode, existingExam, form]);

  // Set course_id from URL query parameter (when coming from course detail)
  useEffect(() => {
    if (!isEditMode && courseIdFromUrl && courses.length > 0) {
      const courseExists = courses.some(c => c.id === courseIdFromUrl);
      if (courseExists) {
        form.setValue('course_id', courseIdFromUrl);
      }
    }
  }, [isEditMode, courseIdFromUrl, courses, form]);

  // Initialize default risk criteria for new exams
  useEffect(() => {
    if (!isEditMode && riskCriteria.length === 0) {
      setRiskCriteria([
        {
          id: crypto.randomUUID(),
          type: 'missed',
          name: 'Missed Submission',
          description: 'Student did not submit by the deadline',
          enabled: false,
          severity: 'high',
        },
        {
          id: crypto.randomUUID(),
          type: 'below_kkm',
          name: 'Below Passing Grade (KKM)',
          description: 'Score is below the minimum passing threshold',
          enabled: false,
          severity: 'medium',
        },
      ]);
    }
  }, [isEditMode, riskCriteria.length]);

  const handleAddNewQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast.error(t('toast.pleaseEnterQuestion'));
      return;
    }

    const newQ: LocalQuestion = {
      id: crypto.randomUUID(),
      type: newQuestion.type,
      question: newQuestion.question,
      options: newQuestion.type !== 'essay' ? newQuestion.options : [],
      correct_answer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : null,
      correct_answers: newQuestion.type === 'multi-select' ? newQuestion.correctAnswers : [],
      points: newQuestion.points,
      order_index: questions.length,
      isNew: true,
    };

    setQuestions([...questions, newQ]);
    setNewQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      correctAnswers: [],
      points: 10,
    });
    setIsAddDialogOpen(false);
    toast.success(t('toast.questionAdded'));
  };

  const updateLocalQuestion = (index: number, updates: Partial<LocalQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionReorder = (oldIndex: number, newIndex: number) => {
    const reordered = arrayMove(questions, oldIndex, newIndex);
    const updatedQuestions = reordered.map((q, idx) => ({ ...q, order_index: idx }));
    setQuestions(updatedQuestions);
    toast.success(t('toast.questionOrderUpdated'));
  };

  const filteredBankQuestions = questionBank.filter((q) =>
    q.question.toLowerCase().includes(importSearch.toLowerCase()) ||
    q.category.toLowerCase().includes(importSearch.toLowerCase())
  );

  const toggleBankQuestion = (id: string) => {
    setSelectedBankQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const mapBankTypeToExamType = (type: string): 'multiple-choice' | 'multi-select' | 'essay' => {
    if (type === 'multiple_choice' || type === 'multiple-choice') return 'multiple-choice';
    if (type === 'multi_select' || type === 'multi-select') return 'multi-select';
    return 'essay';
  };

  const handleImportQuestions = async () => {
    if (selectedBankQuestions.length === 0) {
      toast.error(t('toast.selectQuestions'));
      return;
    }

    let currentIndex = questions.length;
    const newQuestions: LocalQuestion[] = [];

    for (const bankId of selectedBankQuestions) {
      const bankQ = questionBank.find((q) => q.id === bankId);
      if (!bankQ) continue;

      newQuestions.push({
        id: crypto.randomUUID(),
        type: mapBankTypeToExamType(bankQ.type),
        question: bankQ.question,
        options: bankQ.options || ['', '', '', ''],
        correct_answer: bankQ.correct_answer,
        correct_answers: (bankQ as any).correct_answers || [],
        points: bankQ.points,
        order_index: currentIndex,
        isNew: true,
      });
      currentIndex++;

      await incrementUsage.mutateAsync(bankId);
    }

    setQuestions([...questions, ...newQuestions]);
    toast.success(t('toast.questionsImported', { count: selectedBankQuestions.length }));
    setSelectedBankQuestions([]);
    setIsImportDialogOpen(false);
  };

  const toggleCorrectAnswer = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.includes(index)
        ? prev.correctAnswers.filter(i => i !== index)
        : [...prev.correctAnswers, index],
    }));
  };

  const onSubmit = async (data: FormData) => {
    if (questions.length === 0) {
      toast.error(t('exams.addAtLeastOneQuestion'));
      return;
    }

    try {
      const missedCriterion = riskCriteria.find(c => c.type === 'missed');
      const belowKkmCriterion = riskCriteria.find(c => c.type === 'below_kkm');

      if (isEditMode) {
        // Update exam
        await updateExam.mutateAsync({
          id: examId!,
          title: data.title,
          description: data.description || null,
          duration: data.duration,
          kkm: data.kkm,
          start_date: data.start_date ? localDateTimeToUTC(data.start_date) : null,
          end_date: data.end_date ? localDateTimeToUTC(data.end_date) : null,
          status: data.status,
          risk_on_missed: missedCriterion?.enabled || false,
          risk_on_below_kkm: belowKkmCriterion?.enabled || false,
          risk_missed_severity: missedCriterion?.severity || 'high',
          risk_below_kkm_severity: belowKkmCriterion?.severity || 'medium',
        });

        // Handle questions: delete removed, update existing, add new
        const existingQuestions = existingExam?.questions || [];
        const existingIds = existingQuestions.map((q: Question) => q.id);
        const currentIds = questions.filter(q => !q.isNew).map(q => q.id);
        const deletedIds = existingIds.filter((id: string) => !currentIds.includes(id));

        for (const id of deletedIds) {
          await deleteQuestion.mutateAsync(id);
        }

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (q.isNew) {
            await addQuestion.mutateAsync({
              examId: examId!,
              exam_id: examId!,
              type: q.type,
              question: q.question,
              options: q.type !== 'essay' ? q.options : null,
              correct_answer: q.correct_answer,
              correct_answers: q.correct_answers.length > 0 ? q.correct_answers : null,
              points: q.points,
              order_index: i,
            });
          } else {
            await updateQuestion.mutateAsync({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.type !== 'essay' ? q.options : null,
              correct_answer: q.correct_answer,
              correct_answers: q.correct_answers.length > 0 ? q.correct_answers : null,
              points: q.points,
              order_index: i,
            });
          }
        }

        toast.success(t('toast.examUpdated'));
        navigate('/teacher/exams');
      } else {
        // Create new exam
        const questionsToCreate = questions.map((q, idx) => ({
          type: q.type,
          question: q.question,
          options: q.type !== 'essay' ? q.options : null,
          correct_answer: q.correct_answer,
          correct_answers: q.correct_answers.length > 0 ? q.correct_answers : null,
          points: q.points,
          order_index: idx,
        }));

        await createExam.mutateAsync({
          courseId: data.course_id,
          title: data.title,
          description: data.description,
          duration: data.duration,
          kkm: data.kkm,
          questions: questionsToCreate,
        });

        // Send notification if publishing
        if (data.status === 'published') {
          const recipients = await getEnrolledStudents(supabase, data.course_id);
          if (recipients.length > 0) {
            const course = courses.find(c => c.id === data.course_id);
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
              .single();

            await sendCourseNotification({
              recipients,
              courseName: course?.title || 'Course',
              teacherName: profile?.name || 'Teacher',
              contentType: 'exam',
              contentTitle: data.title,
              duration: data.duration,
              description: data.description,
            });
          }
        }

        toast.success(t('exams.examCreated'));
        navigate('/teacher/exams');
      }
    } catch (error) {
      toast.error(isEditMode ? t('toast.failedToUpdateExam') : t('exams.failedToCreate'));
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (isEditMode && examLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/exams')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? t('exams.editExam') : t('exams.createExam')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? t('exams.modifyExamDetails') : t('exams.createNewExam')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StudentPreviewMode
            title={form.watch('title') || 'Untitled Exam'}
            description={form.watch('description') || ''}
            questions={questions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.type !== 'essay' ? q.options : null,
              points: q.points,
            }))}
            duration={form.watch('duration')}
            itemType="exam"
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Exam Details */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle>{t('exams.examDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="course_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('exams.selectCourse')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isEditMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('exams.chooseCourse')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('exams.examTitle')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('exams.examTitlePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.description')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('exams.descriptionPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('exams.duration')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={600} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kkm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('exams.minimumPassingGrade')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t('common.draft')}</SelectItem>
                          <SelectItem value="published">{t('common.published')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('exams.startDate')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('exams.endDate')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Risk Criteria Builder */}
              <div className="pt-4 border-t">
                <RiskCriteriaBuilder
                  criteria={riskCriteria}
                  onChange={(criteria) => {
                    setRiskCriteria(criteria);
                    const missed = criteria.find(c => c.type === 'missed');
                    const belowKkm = criteria.find(c => c.type === 'below_kkm');
                    if (missed) {
                      form.setValue('risk_on_missed', missed.enabled);
                      form.setValue('risk_missed_severity', missed.severity);
                    }
                    if (belowKkm) {
                      form.setValue('risk_on_below_kkm', belowKkm.enabled);
                      form.setValue('risk_below_kkm_severity', belowKkm.severity);
                    }
                  }}
                  allowLate={false}
                  allowCustom={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('exams.questions')} ({questions.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('common.totalPoints')}: {totalPoints}
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!form.watch('course_id')}>
                      <Library className="w-4 h-4" />
                      {t('common.importFromBank')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('common.importFromBank')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder={t('common.searchQuestions')}
                          value={importSearch}
                          onChange={(e) => setImportSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <ScrollArea className="h-80">
                        <div className="space-y-2">
                          {filteredBankQuestions.map((q) => (
                            <div
                              key={q.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBankQuestions.includes(q.id)
                                ? 'border-secondary bg-secondary/10'
                                : 'border-border hover:bg-muted/50'
                                }`}
                              onClick={() => toggleBankQuestion(q.id)}
                            >
                              <Checkbox checked={selectedBankQuestions.includes(q.id)} />
                              <div className="flex-1 min-w-0">
                                <FormulaText text={q.question} className="text-sm" />
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {q.type === 'multiple_choice' ? 'MC' : q.type === 'multi_select' ? 'MS' : 'Essay'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                                  <span className="text-xs text-muted-foreground">{q.points} pts</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {filteredBankQuestions.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                              {t('common.noQuestionsFound')}
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          {selectedBankQuestions.length} {t('common.selected')}
                        </span>
                        <Button onClick={handleImportQuestions} disabled={selectedBankQuestions.length === 0}>
                          {t('common.import')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="sm">
                      <Plus className="w-4 h-4" />
                      {t('exams.addQuestion')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('exams.addQuestion')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Tabs
                        value={newQuestion.type}
                        onValueChange={(v) => setNewQuestion({
                          ...newQuestion,
                          type: v as 'multiple-choice' | 'multi-select' | 'essay',
                          correctAnswers: [],
                        })}
                      >
                        <TabsList className="w-full">
                          <TabsTrigger value="multiple-choice" className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t('exams.questionTypes.multipleChoice')}
                          </TabsTrigger>
                          <TabsTrigger value="multi-select" className="flex-1">
                            <ListChecks className="w-4 h-4 mr-1" />
                            {t('exams.questionTypes.multiSelect')}
                          </TabsTrigger>
                          <TabsTrigger value="essay" className="flex-1">
                            <AlignLeft className="w-4 h-4 mr-1" />
                            {t('exams.questionTypes.essay')}
                          </TabsTrigger>
                        </TabsList>

                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>{t('exams.question')}</Label>
                            <VisualEquationBuilder
                              value={newQuestion.question}
                              onChange={(val) => setNewQuestion({ ...newQuestion, question: val })}
                              placeholder={t('exams.enterQuestion')}
                            />
                          </div>

                          <TabsContent value="multiple-choice" className="mt-0 space-y-2">
                            <Label>{t('exams.options')}</Label>
                            <p className="text-xs text-muted-foreground mb-2">{t('exams.selectCorrectAnswer')}</p>
                            {newQuestion.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="correct"
                                  checked={newQuestion.correctAnswer === i}
                                  onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                                  className="w-4 h-4"
                                />
                                <VisualEquationBuilder
                                  value={opt}
                                  onChange={(val) => {
                                    const opts = [...newQuestion.options];
                                    opts[i] = val;
                                    setNewQuestion({ ...newQuestion, options: opts });
                                  }}
                                  placeholder={`${t('exams.option')} ${String.fromCharCode(65 + i)}`}
                                />
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="multi-select" className="mt-0 space-y-2">
                            <Label>{t('exams.options')}</Label>
                            <p className="text-xs text-muted-foreground mb-2">{t('exams.selectAllCorrect')}</p>
                            {newQuestion.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Checkbox
                                  checked={newQuestion.correctAnswers.includes(i)}
                                  onCheckedChange={() => toggleCorrectAnswer(i)}
                                />
                                <VisualEquationBuilder
                                  value={opt}
                                  onChange={(val) => {
                                    const opts = [...newQuestion.options];
                                    opts[i] = val;
                                    setNewQuestion({ ...newQuestion, options: opts });
                                  }}
                                  placeholder={`${t('exams.option')} ${String.fromCharCode(65 + i)}`}
                                />
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="essay" className="mt-0">
                            <p className="text-sm text-muted-foreground">
                              {t('exams.essayDescription')}
                            </p>
                          </TabsContent>

                          <div className="space-y-2">
                            <Label>{t('common.points')}</Label>
                            <Input
                              type="number"
                              min={1}
                              value={newQuestion.points}
                              onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                            />
                          </div>

                          <Button onClick={handleAddNewQuestion} className="w-full">
                            <Plus className="w-4 h-4" />
                            {t('exams.addQuestion')}
                          </Button>
                        </div>
                      </Tabs>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('exams.noQuestionsYet')}</p>
                </div>
              ) : (
                <SortableList
                  items={questions.map(q => q.id)}
                  onReorder={handleQuestionReorder}
                >
                  {questions.map((q, index) => (
                    <SortableItem key={q.id} id={q.id}>
                      <div className="flex items-start gap-3 p-4 bg-muted rounded-lg mb-2">
                        <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {q.type === 'multiple-choice' ? (
                              <CheckCircle className="w-4 h-4 text-secondary" />
                            ) : q.type === 'multi-select' ? (
                              <ListChecks className="w-4 h-4 text-accent" />
                            ) : (
                              <AlignLeft className="w-4 h-4 text-primary" />
                            )}
                            <Badge variant="outline" className="text-xs">{q.type}</Badge>
                            <span className="text-xs text-muted-foreground">{q.points} {t('common.pts')}</span>
                          </div>
                          <FormulaText text={q.question} className="text-sm" />
                          {q.type !== 'essay' && q.options && q.options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  className={`text-xs px-2 py-1 rounded ${(q.type === 'multiple-choice' && q.correct_answer === i) ||
                                    (q.type === 'multi-select' && q.correct_answers.includes(i))
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-background'
                                    }`}
                                >
                                  {String.fromCharCode(65 + i)}. <FormulaText text={opt} className="inline" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </SortableList>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/teacher/exams')}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={createExam.isPending || updateExam.isPending}
            >
              {(createExam.isPending || updateExam.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditMode ? t('common.saveChanges') : t('exams.createExam')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
