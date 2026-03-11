import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Library, Search, CheckCircle, AlignLeft, AlertTriangle, Eye, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { localDateTimeToUTC, utcToLocalDateTime } from '@/lib/dateUtils';
import {
  Form,
  FormControl,
  FormDescription,
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
import { useCreateAssignment, useUpdateAssignment, useAssignment, RubricItem } from '@/hooks/useAssignments';
import { useTeacherCourseClasses } from '@/hooks/useTeacherCourseClasses';
import { useAssignmentQuestions, useAddAssignmentQuestion, useUpdateAssignmentQuestion, useDeleteAssignmentQuestion, AssignmentQuestion } from '@/hooks/useAssignmentQuestions';
import { useQuestionBank, useIncrementQuestionUsage } from '@/hooks/useQuestionBank';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import VisualEquationBuilder from '@/components/VisualEquationBuilder';
import FormulaText from '@/components/FormulaText';
import RiskCriteriaBuilder, { RiskCriterion } from '@/components/RiskCriteriaBuilder';
import StudentPreviewMode from '@/components/StudentPreviewMode';
import SortableList from '@/components/SortableContext';
import SortableItem from '@/components/SortableItem';
import { arrayMove } from '@dnd-kit/sortable';
import { sendCourseNotification, getEnrolledStudents } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { storageApi } from '@/features/storage/api/storage.api.backend';
import { useAuth } from '@/features/auth/hooks/useAuth';

const formSchema = z.object({
  course_id: z.string().min(1, 'Please select a course'),
  class_id: z.string().min(1, 'Please select a class'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  max_points: z.coerce.number().min(1).max(1000),
  allow_late_submissions: z.boolean(),
  late_penalty_percent: z.coerce.number().min(0).max(100).optional(),
  max_file_size_mb: z.coerce.number().min(1).max(50),
  status: z.enum(['draft', 'published']),
  assignment_type: z.enum(['submission', 'questions']),
  kkm: z.coerce.number().min(0).max(100).optional(),
  risk_on_missed: z.boolean(),
  risk_on_below_kkm: z.boolean(),
  risk_on_late: z.boolean(),
  risk_missed_severity: z.enum(['high', 'medium', 'low']),
  risk_below_kkm_severity: z.enum(['high', 'medium', 'low']),
  risk_late_severity: z.enum(['high', 'medium', 'low']),
});

type FormData = z.infer<typeof formSchema>;

interface LocalOption {
  text: string;
  image_url?: string;
}

interface LocalQuestion {
  id: string;
  type: 'multiple-choice' | 'multi-select' | 'essay';
  question: string;
  image_url?: string;
  options: LocalOption[];
  correct_answer: number | null;
  correct_answers: number[];
  points: number;
  order_index: number;
  isNew?: boolean;
}

/**
 * Create/Edit Assignment page.
 * 
 * Form for creating or editing an assignment.
 * Features:
 * - Basic info (Title, description, instructions)
 * - Settings (Due date, max points, late submissions)
 * - Assignment Types:
 *   - File Submission: With max file size
 *   - Question Based: With interactive question builder (MCQ, Essay, etc.)
 * - Risk Criteria configuration
 * - Validations using zod schema
 * 
 * @returns {JSX.Element} The rendered Create/Edit Assignment page.
 */
export default function CreateAssignment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  const isEditMode = !!assignmentId;

  const { courses = [] } = useTeacherCourses();
  const { data: existingAssignment, isLoading: assignmentLoading } = useAssignment(assignmentId || '');
  const { data: existingQuestions = [] } = useAssignmentQuestions(assignmentId || '');
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const addQuestion = useAddAssignmentQuestion();
  const updateQuestion = useUpdateAssignmentQuestion();
  const deleteQuestion = useDeleteAssignmentQuestion();
  const { data: questionBank = [] } = useQuestionBank();
  const incrementUsage = useIncrementQuestionUsage();

  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [riskCriteria, setRiskCriteria] = useState<RiskCriterion[]>([]);
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState<{
    type: 'multiple-choice' | 'multi-select' | 'essay';
    question: string;
    image_url?: string;
    options: LocalOption[];
    correctAnswer: number;
    correctAnswers: number[];
    points: number;
  }>({
    type: 'multiple-choice',
    question: '',
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctAnswer: 0,
    correctAnswers: [],
    points: 10,
  });
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${Math.random()}-${sanitizedName}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await storageApi.uploadFile('question-images', filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = storageApi.getPublicUrl('question-images', filePath);

      return data?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('toast.uploadFailed'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      course_id: '',
      class_id: '',
      title: '',
      description: '',
      instructions: '',
      due_date: '',
      max_points: 100,
      allow_late_submissions: false,
      late_penalty_percent: 10,
      max_file_size_mb: 10,
      status: 'draft',
      assignment_type: 'submission',
      kkm: 60,
      risk_on_missed: false,
      risk_on_below_kkm: false,
      risk_on_late: false,
      risk_missed_severity: 'high',
      risk_below_kkm_severity: 'medium',
      risk_late_severity: 'low',
    },
  });

  const assignmentType = form.watch('assignment_type');
  const allowLate = form.watch('allow_late_submissions');
  const selectedCourseId = form.watch('course_id');

  const { data: classes = [] } = useTeacherCourseClasses(selectedCourseId || undefined);

  // Load existing assignment data in edit mode
  useEffect(() => {
    if (isEditMode && existingAssignment) {
      form.reset({
        course_id: existingAssignment.course_id,
        class_id: existingAssignment.class_id,
        title: existingAssignment.title,
        description: existingAssignment.description || '',
        instructions: existingAssignment.instructions || '',
        due_date: existingAssignment.due_date
          ? utcToLocalDateTime(existingAssignment.due_date)
          : '',
        max_points: existingAssignment.max_points,
        allow_late_submissions: existingAssignment.allow_late_submissions,
        late_penalty_percent: existingAssignment.late_penalty_percent || 10,
        max_file_size_mb: existingAssignment.max_file_size_mb || 10,
        status: existingAssignment.status as 'draft' | 'published',
        assignment_type: ((existingAssignment as any).assignment_type as 'submission' | 'questions') || 'submission',
        kkm: (existingAssignment as any).kkm || 60,
        risk_on_missed: (existingAssignment as any).risk_on_missed || false,
        risk_on_below_kkm: (existingAssignment as any).risk_on_below_kkm || false,
        risk_on_late: (existingAssignment as any).risk_on_late || false,
        risk_missed_severity: (existingAssignment as any).risk_missed_severity || 'high',
        risk_below_kkm_severity: (existingAssignment as any).risk_below_kkm_severity || 'medium',
        risk_late_severity: (existingAssignment as any).risk_late_severity || 'low',
      });
      setRubric(existingAssignment.rubric || []);

      // Initialize risk criteria from existing assignment
      const initialRiskCriteria: RiskCriterion[] = [
        {
          id: crypto.randomUUID(),
          type: 'missed',
          name: t('risk.missedSubmission'),
          description: t('risk.missedSubmissionDesc'),
          enabled: (existingAssignment as any).risk_on_missed || false,
          severity: (existingAssignment as any).risk_missed_severity || 'high',
        },
        {
          id: crypto.randomUUID(),
          type: 'below_kkm',
          name: t('risk.belowKKM'),
          description: t('risk.belowKKMDesc'),
          enabled: (existingAssignment as any).risk_on_below_kkm || false,
          severity: (existingAssignment as any).risk_below_kkm_severity || 'medium',
        },
        {
          id: crypto.randomUUID(),
          type: 'late',
          name: t('risk.lateSubmission'),
          description: t('risk.lateSubmissionDesc'),
          enabled: (existingAssignment as any).risk_on_late || false,
          severity: (existingAssignment as any).risk_late_severity || 'low',
        },
      ];
      setRiskCriteria(initialRiskCriteria);
    }
  }, [isEditMode, existingAssignment, form, t]);

  // Set course_id from URL query parameter (when coming from course detail)
  useEffect(() => {
    if (!isEditMode && courseIdFromUrl && courses.length > 0) {
      const courseExists = courses.some(c => c.id === courseIdFromUrl);
      if (courseExists) {
        form.setValue('course_id', courseIdFromUrl);
      }
    }
  }, [isEditMode, courseIdFromUrl, courses, form]);

  // Load existing questions
  useEffect(() => {
    if (isEditMode && existingQuestions.length > 0) {
      setQuestions(existingQuestions.map(q => ({
        id: q.id,
        type: q.type as 'multiple-choice' | 'multi-select' | 'essay',
        question: q.question,
        image_url: q.image_url || undefined,
        options: q.options
          ? q.options.map((o: any) => typeof o === 'string' ? { text: o } : { text: o.text, image_url: o.image_url })
          : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
        correct_answer: q.correct_answer,
        correct_answers: q.correct_answers || [],
        points: q.points,
        order_index: q.order_index,
      })));
    }
  }, [isEditMode, existingQuestions]);

  const addRubricItem = () => {
    setRubric([
      ...rubric,
      { id: crypto.randomUUID(), criterion: '', description: '', maxPoints: 10 },
    ]);
  };

  const updateRubricItem = (id: string, field: keyof RubricItem, value: string | number) => {
    setRubric(rubric.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeRubricItem = (id: string) => {
    setRubric(rubric.filter(item => item.id !== id));
  };

  const handleAddNewQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast.error(t('toast.pleaseEnterQuestion'));
      return;
    }

    const newQ: LocalQuestion = {
      id: crypto.randomUUID(),
      type: newQuestion.type,
      question: newQuestion.question,
      image_url: newQuestion.image_url,
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
      image_url: undefined,
      options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
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

      const type = bankQ.type === 'multiple_choice' ? 'multiple-choice' :
        bankQ.type === 'multi_select' ? 'multi-select' :
          bankQ.type as 'multiple-choice' | 'multi-select' | 'essay';

      newQuestions.push({
        id: crypto.randomUUID(),
        type,
        question: bankQ.question,
        image_url: bankQ.image_url || undefined,
        options: bankQ.options
          ? bankQ.options.map((o: any) => typeof o === 'string' ? { text: o } : { text: o.text, image_url: o.image_url })
          : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
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

  const onSubmit = async (data: FormData) => {
    try {
      const assignmentData = {
        course_id: data.course_id,
        class_id: data.class_id,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        due_date: localDateTimeToUTC(data.due_date),
        max_points: data.assignment_type === 'questions'
          ? questions.reduce((sum, q) => sum + q.points, 0)
          : data.max_points,
        allow_late_submissions: data.allow_late_submissions,
        late_penalty_percent: data.late_penalty_percent,
        max_file_size_mb: data.max_file_size_mb,
        status: data.status,
        rubric: data.assignment_type === 'submission' ? rubric.filter(r => r.criterion.trim()) : [],
        assignment_type: data.assignment_type,
        kkm: data.kkm,
        risk_on_missed: data.risk_on_missed,
        risk_on_below_kkm: data.risk_on_below_kkm,
        risk_on_late: data.risk_on_late,
        risk_missed_severity: data.risk_missed_severity,
        risk_below_kkm_severity: data.risk_below_kkm_severity,
        risk_late_severity: data.risk_late_severity,
      };

      // Helper to send notifications when published
      const sendNotificationIfPublished = async (status: string, courseId: string, title: string, dueDate: string, description?: string) => {
        if (status === 'published') {
          const recipients = await getEnrolledStudents(supabase, courseId);
          if (recipients.length > 0) {
            const course = courses.find(c => c.id === courseId);
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
              .single();

            await sendCourseNotification({
              recipients,
              courseName: course?.title || 'Course',
              teacherName: profile?.name || 'Teacher',
              contentType: 'assignment',
              contentTitle: title,
              dueDate,
              description,
            });
          }
        }
      };

      if (isEditMode) {
        const wasPublished = existingAssignment?.status === 'published';

        await updateAssignment.mutateAsync({
          id: assignmentId!,
          ...assignmentData,
        });

        // Handle questions for question-based assignments
        if (data.assignment_type === 'questions') {
          // Delete removed questions
          const existingIds = existingQuestions.map(q => q.id);
          const currentIds = questions.filter(q => !q.isNew).map(q => q.id);
          const deletedIds = existingIds.filter(id => !currentIds.includes(id));

          for (const id of deletedIds) {
            await deleteQuestion.mutateAsync({ id, assignmentId: assignmentId! });
          }

          // Update existing and add new questions
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (q.isNew) {
              await addQuestion.mutateAsync({
                assignmentId: assignmentId!,
                type: q.type,
                question: q.question,
                options: q.type !== 'essay' ? q.options : null,
                correct_answer: q.correct_answer,
                correct_answers: q.correct_answers.length > 0 ? q.correct_answers : null,
                points: q.points,
                order_index: i,
                image_url: q.image_url,
              });
            } else {
              await updateQuestion.mutateAsync({
                id: q.id,
                assignmentId: assignmentId!,
                type: q.type,
                question: q.question,
                options: q.type !== 'essay' ? q.options : null,
                correct_answer: q.correct_answer,
                correct_answers: q.correct_answers.length > 0 ? q.correct_answers : null,
                points: q.points,
                order_index: i,
                image_url: q.image_url,
              });
            }
          }
        }

        // Send notification only if just published (was draft, now published)
        if (!wasPublished && data.status === 'published') {
          await sendNotificationIfPublished(data.status, data.course_id, data.title, data.due_date, data.description);
        }

        toast.success(t('toast.assignmentUpdated'));
      } else {
        const result = await createAssignment.mutateAsync(assignmentData);

        // Add questions for question-based assignments
        if (data.assignment_type === 'questions' && result) {
          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            await addQuestion.mutateAsync({
              assignmentId: result.id,
              type: q.type,
              question: q.question,
              options: q.type !== 'essay' ? q.options : null,
              correct_answer: q.correct_answer,
              correct_answers: q.correct_answers.length > 0 ? q.correct_answers : null,
              points: q.points,
              order_index: i,
              image_url: q.image_url,
            });
          }
        }

        // Send notification if created as published
        await sendNotificationIfPublished(data.status, data.course_id, data.title, data.due_date, data.description);

        toast.success(t('toast.assignmentCreated'));
      }
      navigate('/teacher/assignments');
    } catch {
      toast.error(isEditMode ? t('toast.failedToUpdateAssignment') : t('toast.failedToCreateAssignment'));
    }
  };

  const isPending = createAssignment.isPending || updateAssignment.isPending;

  if (isEditMode && assignmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditMode && !existingAssignment && !assignmentLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('assignments.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/teacher/assignments')} className="mt-4">
          {t('common.backToAssignments')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/assignments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? t('assignments.editTitle') : t('assignments.createTitle')}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? t('assignments.updateDetails') : t('assignments.setupNew')}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('assignments.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('assignments.course')}</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue('class_id', ''); // Reset class when course changes
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('materials.selectCourse')} />
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

              {selectedCourseId && (
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.class')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.selectClass')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="assignment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('assignments.assignmentType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="submission">{t('assignments.typeSubmission')}</SelectItem>
                        <SelectItem value="questions">{t('assignments.typeQuiz')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === 'submission'
                        ? t('assignments.submissionDesc')
                        : t('assignments.questionsDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('assignments.title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('materials.materialTitlePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('calendar.eventDescriptionPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('assignments.instructions')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('assignments.instructionsPlaceholder')}
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('common.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('assignments.dueDate')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {assignmentType === 'submission' && (
                  <FormField
                    control={form.control}
                    name="max_points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('assignments.maxPoints')}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={1000} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {assignmentType === 'questions' && (
                  <div className="space-y-2">
                    <Label>{t('assignments.totalPoints')}</Label>
                    <Input
                      type="number"
                      value={questions.reduce((sum, q) => sum + q.points, 0)}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('assignments.autoCalculated')}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kkm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reportCards.kkm')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('assignments.kkmDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('assignments.status')}</FormLabel>
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

              {assignmentType === 'submission' && (
                <FormField
                  control={form.control}
                  name="max_file_size_mb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('assignments.maxFileSize')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={50} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="allow_late_submissions"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>{t('assignments.allowLateSubmissions')}</FormLabel>
                        <FormDescription>
                          {t('assignments.allowLateDesc')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {allowLate && (
                  <FormField
                    control={form.control}
                    name="late_penalty_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('assignments.latePenalty')}</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={100} {...field} />
                        </FormControl>
                        <FormDescription>
                          {t('assignments.latePenaltyDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* At-Risk Monitoring - Unified Risk Criteria Builder */}
              <div className="pt-4 border-t">
                <RiskCriteriaBuilder
                  criteria={riskCriteria}
                  onChange={(newCriteria) => {
                    setRiskCriteria(newCriteria);
                    // Sync with form fields
                    const missed = newCriteria.find(c => c.type === 'missed');
                    const belowKkm = newCriteria.find(c => c.type === 'below_kkm');
                    const late = newCriteria.find(c => c.type === 'late');

                    if (missed) {
                      form.setValue('risk_on_missed', missed.enabled);
                      form.setValue('risk_missed_severity', missed.severity);
                    }
                    if (belowKkm) {
                      form.setValue('risk_on_below_kkm', belowKkm.enabled);
                      form.setValue('risk_below_kkm_severity', belowKkm.severity);
                    }
                    if (late) {
                      form.setValue('risk_on_late', late.enabled);
                      form.setValue('risk_late_severity', late.severity);
                    }
                  }}
                  allowLate={true}
                  allowCustom={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions Card - Only for question-based assignments */}
          {assignmentType === 'questions' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('assignments.questions')} ({questions.length})</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Library className="w-4 h-4 mr-2" />
                        {t('assignments.importFromBank')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t('assignments.importFromBank')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t('common.search')}
                            value={importSearch}
                            onChange={(e) => setImportSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <ScrollArea className="h-[400px] border rounded-lg p-2">
                          {filteredBankQuestions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              {questionBank.length === 0
                                ? t('assignments.noQuestionsInBank')
                                : t('assignments.noMatchingQuestions')}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {filteredBankQuestions.map((q) => (
                                <div
                                  key={q.id}
                                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                  onClick={() => toggleBankQuestion(q.id)}
                                >
                                  <Checkbox
                                    checked={selectedBankQuestions.includes(q.id)}
                                    onCheckedChange={() => toggleBankQuestion(q.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex gap-2 mb-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {q.category}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {q.type === 'multiple_choice' ? 'MCQ' : q.type === 'multi_select' ? 'Multi' : 'Essay'}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {q.points} pts
                                      </Badge>
                                    </div>
                                    <p className="text-sm line-clamp-2"><FormulaText text={q.question} /></p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-muted-foreground">
                            {t('assignments.selected', { count: selectedBankQuestions.length })}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                              {t('common.cancel')}
                            </Button>
                            <Button
                              onClick={handleImportQuestions}
                              disabled={selectedBankQuestions.length === 0}
                            >
                              {t('assignments.importSelected')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('assignments.addQuestion')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent size="lg">
                      <DialogHeader>
                        <DialogTitle>{t('assignments.addQuestion')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Tabs
                          value={newQuestion.type}
                          onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v as 'multiple-choice' | 'multi-select' | 'essay' })}
                        >
                          <TabsList className="mb-2">
                            <TabsTrigger value="multiple-choice">{t('assignments.mcq')}</TabsTrigger>
                            <TabsTrigger value="multi-select">{t('assignments.multiSelect')}</TabsTrigger>
                            <TabsTrigger value="essay">{t('assignments.essay')}</TabsTrigger>
                          </TabsList>

                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="new-question-image"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = await uploadImage(file);
                                    if (url) setNewQuestion({ ...newQuestion, image_url: url });
                                  }
                                }}
                              />
                              <Label htmlFor="new-question-image">
                                <Button type="button" variant="outline" size="sm" asChild disabled={isUploading}>
                                  <span className="cursor-pointer">
                                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                                    {newQuestion.image_url ? t('common.changeImage') : t('common.addImage')}
                                  </span>
                                </Button>
                              </Label>
                              {newQuestion.image_url && (
                                <div className="relative group">
                                  <img src={newQuestion.image_url} alt="Question" className="w-full h-auto max-h-[300px] object-contain rounded border" />
                                  <button
                                    type="button"
                                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setNewQuestion({ ...newQuestion, image_url: undefined })}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <VisualEquationBuilder
                              placeholder={t('assignments.enterQuestion')}
                              value={newQuestion.question}
                              onChange={(v) => setNewQuestion({ ...newQuestion, question: v })}
                              rows={2}
                            />
                          </div>

                          <TabsContent value="multiple-choice" className="mt-3 space-y-2">
                            <p className="text-xs text-muted-foreground mb-1">{t('assignments.selectCorrectAnswer')}:</p>
                            <div className="grid gap-2">
                              {newQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-start gap-2 bg-muted/30 p-2 rounded-md">
                                  <div className="pt-2">
                                    <input
                                      type="radio"
                                      name="newCorrect"
                                      checked={newQuestion.correctAnswer === i}
                                      onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                                      className="w-4 h-4 flex-shrink-0"
                                    />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder={`${t('assignments.option')} ${i + 1}`}
                                        value={opt.text}
                                        onChange={(e) => {
                                          const newOptions = [...newQuestion.options];
                                          newOptions[i] = { ...newOptions[i], text: e.target.value };
                                          setNewQuestion({ ...newQuestion, options: newOptions });
                                        }}
                                        className="flex-1"
                                      />
                                      <div className="relative">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`new-opt-img-${i}`}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const url = await uploadImage(file);
                                              if (url) {
                                                const newOptions = [...newQuestion.options];
                                                newOptions[i] = { ...newOptions[i], image_url: url };
                                                setNewQuestion({ ...newQuestion, options: newOptions });
                                              }
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`new-opt-img-${i}`}>
                                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={isUploading}>
                                            <span className="cursor-pointer">
                                              {opt.image_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                            </span>
                                          </Button>
                                        </Label>
                                      </div>
                                    </div>
                                    {opt.image_url && (
                                      <div className="relative group w-fit">
                                        <img src={opt.image_url} alt={`Option ${i + 1}`} className="h-auto max-h-[150px] object-contain rounded border" />
                                        <button
                                          type="button"
                                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            const newOptions = [...newQuestion.options];
                                            newOptions[i] = { ...newOptions[i], image_url: undefined };
                                            setNewQuestion({ ...newQuestion, options: newOptions });
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('assignments.mathTip')}</p>
                          </TabsContent>

                          <TabsContent value="multi-select" className="mt-3 space-y-2">
                            <p className="text-xs text-muted-foreground mb-1">{t('assignments.selectCorrectAnswers')}:</p>
                            <div className="grid gap-2">
                              {newQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-start gap-2 bg-muted/30 p-2 rounded-md">
                                  <div className="pt-2">
                                    <Checkbox
                                      checked={newQuestion.correctAnswers.includes(i)}
                                      onCheckedChange={(checked) => {
                                        const newAnswers = checked
                                          ? [...newQuestion.correctAnswers, i]
                                          : newQuestion.correctAnswers.filter(a => a !== i);
                                        setNewQuestion({ ...newQuestion, correctAnswers: newAnswers });
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder={`${t('assignments.option')} ${i + 1}`}
                                        value={opt.text}
                                        onChange={(e) => {
                                          const newOptions = [...newQuestion.options];
                                          newOptions[i] = { ...newOptions[i], text: e.target.value };
                                          setNewQuestion({ ...newQuestion, options: newOptions });
                                        }}
                                        className="flex-1"
                                      />
                                      <div className="relative">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`new-opt-img-ms-${i}`}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const url = await uploadImage(file);
                                              if (url) {
                                                const newOptions = [...newQuestion.options];
                                                newOptions[i] = { ...newOptions[i], image_url: url };
                                                setNewQuestion({ ...newQuestion, options: newOptions });
                                              }
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`new-opt-img-ms-${i}`}>
                                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={isUploading}>
                                            <span className="cursor-pointer">
                                              {opt.image_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                            </span>
                                          </Button>
                                        </Label>
                                      </div>
                                    </div>
                                    {opt.image_url && (
                                      <div className="relative group w-fit">
                                        <img src={opt.image_url} alt={`Option ${i + 1}`} className="h-12 w-12 object-cover rounded border" />
                                        <button
                                          type="button"
                                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            const newOptions = [...newQuestion.options];
                                            newOptions[i] = { ...newOptions[i], image_url: undefined };
                                            setNewQuestion({ ...newQuestion, options: newOptions });
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('assignments.mathTip')}</p>
                          </TabsContent>
                        </Tabs>

                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex-1">
                            <Label className="text-xs">{t('assignments.points')}</Label>
                            <Input
                              type="number"
                              value={newQuestion.points}
                              onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                            />
                          </div>
                          <Button onClick={handleAddNewQuestion} className="mt-5">
                            {t('assignments.addQuestion')}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('assignments.noQuestions')}
                  </p>
                ) : (
                  <SortableList
                    items={questions.map(q => q.id)}
                    onReorder={handleQuestionReorder}
                  >
                    {questions.map((q, index) => (
                      <SortableItem key={q.id} id={q.id}>
                        <Card className="bg-muted/50">
                          <CardContent className="pt-4 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {q.type === 'multiple-choice' ? (
                                  <CheckCircle className="w-4 h-4 text-secondary" />
                                ) : q.type === 'multi-select' ? (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <AlignLeft className="w-4 h-4 text-primary" />
                                )}
                                <span className="font-medium">Q{index + 1}</span>
                                <span className="capitalize">({q.type})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  className="w-20 h-8"
                                  value={q.points}
                                  onChange={(e) => updateLocalQuestion(index, { points: Number(e.target.value) })}
                                />
                                <span className="text-xs text-muted-foreground">pts</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeQuestion(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`q-img-${q.id}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = await uploadImage(file);
                                      if (url) updateLocalQuestion(index, { image_url: url });
                                    }
                                  }}
                                />
                                <Label htmlFor={`q-img-${q.id}`}>
                                  <Button type="button" variant="outline" size="sm" asChild disabled={isUploading}>
                                    <span className="cursor-pointer">
                                      {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                                      {q.image_url ? t('common.changeImage') : t('common.addImage')}
                                    </span>
                                  </Button>
                                </Label>
                                {q.image_url && (
                                  <div className="relative group">
                                    <img src={q.image_url} alt="Question" className="w-full h-auto max-h-[400px] object-contain rounded border" />
                                    <button
                                      type="button"
                                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => updateLocalQuestion(index, { image_url: undefined })}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <VisualEquationBuilder
                                value={q.question}
                                onChange={(v) => updateLocalQuestion(index, { question: v })}
                              />
                            </div>

                            {q.type === 'multiple-choice' && q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-start gap-2">
                                    <div className="pt-2">
                                      <input
                                        type="radio"
                                        name={`correct-${q.id}`}
                                        checked={q.correct_answer === optIndex}
                                        onChange={() => updateLocalQuestion(index, { correct_answer: optIndex })}
                                        className="w-4 h-4"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <VisualEquationBuilder
                                          singleLine
                                          value={opt.text}
                                          onChange={(v) => {
                                            const newOptions = [...q.options];
                                            newOptions[optIndex] = { ...newOptions[optIndex], text: v };
                                            updateLocalQuestion(index, { options: newOptions });
                                          }}
                                        />
                                        <div className="relative">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id={`q-opt-img-${q.id}-${optIndex}`}
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const url = await uploadImage(file);
                                                if (url) {
                                                  const newOptions = [...q.options];
                                                  newOptions[optIndex] = { ...newOptions[optIndex], image_url: url };
                                                  updateLocalQuestion(index, { options: newOptions });
                                                }
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`q-opt-img-${q.id}-${optIndex}`}>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={isUploading}>
                                              <span className="cursor-pointer">
                                                {opt.image_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                              </span>
                                            </Button>
                                          </Label>
                                        </div>
                                      </div>
                                      {opt.image_url && (
                                        <div className="relative group w-fit">
                                          <img src={opt.image_url} alt={`Option ${optIndex + 1}`} className="h-auto max-h-[150px] object-contain rounded border" />
                                          <button
                                            type="button"
                                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                              const newOptions = [...q.options];
                                              newOptions[optIndex] = { ...newOptions[optIndex], image_url: undefined };
                                              updateLocalQuestion(index, { options: newOptions });
                                            }}
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.type === 'multi-select' && q.options && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Select all correct answers</p>
                                {q.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-start gap-2">
                                    <div className="pt-2">
                                      <Checkbox
                                        checked={q.correct_answers.includes(optIndex)}
                                        onCheckedChange={(checked) => {
                                          const newAnswers = checked
                                            ? [...q.correct_answers, optIndex]
                                            : q.correct_answers.filter(a => a !== optIndex);
                                          updateLocalQuestion(index, { correct_answers: newAnswers });
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <VisualEquationBuilder
                                          singleLine
                                          value={opt.text}
                                          onChange={(v) => {
                                            const newOptions = [...q.options];
                                            newOptions[optIndex] = { ...newOptions[optIndex], text: v };
                                            updateLocalQuestion(index, { options: newOptions });
                                          }}
                                        />
                                        <div className="relative">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id={`q-opt-img-ms-${q.id}-${optIndex}`}
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const url = await uploadImage(file);
                                                if (url) {
                                                  const newOptions = [...q.options];
                                                  newOptions[optIndex] = { ...newOptions[optIndex], image_url: url };
                                                  updateLocalQuestion(index, { options: newOptions });
                                                }
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`q-opt-img-ms-${q.id}-${optIndex}`}>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={isUploading}>
                                              <span className="cursor-pointer">
                                                {opt.image_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                              </span>
                                            </Button>
                                          </Label>
                                        </div>
                                      </div>
                                      {opt.image_url && (
                                        <div className="relative group w-fit">
                                          <img src={opt.image_url} alt={`Option ${optIndex + 1}`} className="h-12 w-12 object-cover rounded border" />
                                          <button
                                            type="button"
                                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                              const newOptions = [...q.options];
                                              newOptions[optIndex] = { ...newOptions[optIndex], image_url: undefined };
                                              updateLocalQuestion(index, { options: newOptions });
                                            }}
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </SortableItem>
                    ))}
                  </SortableList>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rubric Card - Only for submission-based assignments */}
          {assignmentType === 'submission' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('assignments.rubric')}</CardTitle>
                    <CardDescription>
                      {t('assignments.rubricDesc')}
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addRubricItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('assignments.addCriterion')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rubric.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {t('assignments.noRubric')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {rubric.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-4 border rounded-lg">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 grid gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-3">
                            <Input
                              placeholder={t('assignments.criterionName')}
                              value={item.criterion}
                              onChange={(e) => updateRubricItem(item.id, 'criterion', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder={t('assignments.points')}
                              min={1}
                              value={item.maxPoints}
                              onChange={(e) => updateRubricItem(item.id, 'maxPoints', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <Textarea
                            placeholder={t('assignments.criterionDesc')}
                            value={item.description}
                            onChange={(e) => updateRubricItem(item.id, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRubricItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            {assignmentType === 'questions' && questions.length > 0 && (
              <StudentPreviewMode
                title={form.watch('title')}
                description={form.watch('description')}
                questions={questions.map(q => ({
                  id: q.id,
                  type: q.type,
                  question: q.question,
                  image_url: q.image_url,
                  options: q.type !== 'essay' ? q.options : null,
                  points: q.points,
                }))}
                itemType="assignment"
              />
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? t('common.updating') : t('common.creating')}
                </>
              ) : (
                isEditMode ? t('assignments.updateAssignment') : t('assignments.createAssignment')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
