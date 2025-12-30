import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Library, Search, CheckCircle, AlignLeft } from 'lucide-react';
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
import { useAssignmentQuestions, useAddAssignmentQuestion, useUpdateAssignmentQuestion, useDeleteAssignmentQuestion, AssignmentQuestion } from '@/hooks/useAssignmentQuestions';
import { useQuestionBank, useIncrementQuestionUsage } from '@/hooks/useQuestionBank';
import { toast } from 'sonner';

const formSchema = z.object({
  course_id: z.string().min(1, 'Please select a course'),
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

export default function CreateAssignment() {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
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
      instructions: '',
      due_date: '',
      max_points: 100,
      allow_late_submissions: false,
      late_penalty_percent: 10,
      max_file_size_mb: 10,
      status: 'draft',
      assignment_type: 'submission',
      kkm: 60,
    },
  });

  const assignmentType = form.watch('assignment_type');
  const allowLate = form.watch('allow_late_submissions');

  // Load existing assignment data in edit mode
  useEffect(() => {
    if (isEditMode && existingAssignment) {
      form.reset({
        course_id: existingAssignment.course_id,
        title: existingAssignment.title,
        description: existingAssignment.description || '',
        instructions: existingAssignment.instructions || '',
        due_date: existingAssignment.due_date 
          ? new Date(existingAssignment.due_date).toISOString().slice(0, 16) 
          : '',
        max_points: existingAssignment.max_points,
        allow_late_submissions: existingAssignment.allow_late_submissions,
        late_penalty_percent: existingAssignment.late_penalty_percent || 10,
        max_file_size_mb: existingAssignment.max_file_size_mb || 10,
        status: existingAssignment.status as 'draft' | 'published',
        assignment_type: ((existingAssignment as any).assignment_type as 'submission' | 'questions') || 'submission',
        kkm: (existingAssignment as any).kkm || 60,
      });
      setRubric(existingAssignment.rubric || []);
    }
  }, [isEditMode, existingAssignment, form]);

  // Load existing questions
  useEffect(() => {
    if (isEditMode && existingQuestions.length > 0) {
      setQuestions(existingQuestions.map(q => ({
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
      toast.error('Please enter a question');
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
    toast.success('Question added');
  };

  const updateLocalQuestion = (index: number, updates: Partial<LocalQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
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
      toast.error('Please select at least one question');
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
    toast.success(`Imported ${selectedBankQuestions.length} question(s)`);
    setSelectedBankQuestions([]);
    setIsImportDialogOpen(false);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const assignmentData = {
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        due_date: data.due_date,
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
      };

      if (isEditMode) {
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
              });
            }
          }
        }

        toast.success('Assignment updated successfully');
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
            });
          }
        }

        toast.success('Assignment created successfully');
      }
      navigate('/teacher/assignments');
    } catch {
      toast.error(isEditMode ? 'Failed to update assignment' : 'Failed to create assignment');
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
        <p className="text-muted-foreground">Assignment not found</p>
        <Button variant="outline" onClick={() => navigate('/teacher/assignments')} className="mt-4">
          Back to Assignments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Assignment' : 'Create Assignment'}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update the assignment details' : 'Set up a new assignment for your students'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
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
                name="assignment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="submission">File Submission</SelectItem>
                        <SelectItem value="questions">Question-Based</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === 'submission' 
                        ? 'Students submit files or text content' 
                        : 'Students answer questions (essay, multiple choice, multi-select)'}
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
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Assignment title" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the assignment" 
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
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed instructions for students" 
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
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
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
                        <FormLabel>Maximum Points</FormLabel>
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
                    <Label>Total Points</Label>
                    <Input 
                      type="number" 
                      value={questions.reduce((sum, q) => sum + q.points, 0)} 
                      disabled 
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-calculated from question points
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
                      <FormLabel>Minimum Passing Grade (KKM)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormDescription>
                        Percentage required to pass
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
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
                      <FormLabel>Max File Size (MB)</FormLabel>
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
                        <FormLabel>Allow Late Submissions</FormLabel>
                        <FormDescription>
                          Students can submit after the due date with a penalty
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
                        <FormLabel>Late Penalty (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={100} {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage deducted from score for late submissions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Questions Card - Only for question-based assignments */}
          {assignmentType === 'questions' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Questions ({questions.length})</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Library className="w-4 h-4 mr-2" />
                        Import from Bank
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Import from Question Bank</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search questions..."
                            value={importSearch}
                            onChange={(e) => setImportSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <ScrollArea className="h-[400px] border rounded-lg p-2">
                          {filteredBankQuestions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              {questionBank.length === 0
                                ? 'No questions in your bank yet'
                                : 'No questions match your search'}
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
                                    <p className="text-sm line-clamp-2">{q.question}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-muted-foreground">
                            {selectedBankQuestions.length} selected
                          </span>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleImportQuestions}
                              disabled={selectedBankQuestions.length === 0}
                            >
                              Import Selected
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
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Question</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Tabs
                          value={newQuestion.type}
                          onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v as 'multiple-choice' | 'multi-select' | 'essay' })}
                        >
                          <TabsList className="mb-4">
                            <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                            <TabsTrigger value="multi-select">Multi-Select</TabsTrigger>
                            <TabsTrigger value="essay">Essay</TabsTrigger>
                          </TabsList>

                          <Textarea
                            placeholder="Enter your question..."
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                          />

                          <TabsContent value="multiple-choice" className="mt-4 space-y-2">
                            {newQuestion.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="newCorrect"
                                  checked={newQuestion.correctAnswer === i}
                                  onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                                  className="w-4 h-4"
                                />
                                <Input
                                  placeholder={`Option ${i + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...newQuestion.options];
                                    newOptions[i] = e.target.value;
                                    setNewQuestion({ ...newQuestion, options: newOptions });
                                  }}
                                />
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="multi-select" className="mt-4 space-y-2">
                            <p className="text-xs text-muted-foreground mb-2">Select all correct answers</p>
                            {newQuestion.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Checkbox
                                  checked={newQuestion.correctAnswers.includes(i)}
                                  onCheckedChange={(checked) => {
                                    const newAnswers = checked
                                      ? [...newQuestion.correctAnswers, i]
                                      : newQuestion.correctAnswers.filter(a => a !== i);
                                    setNewQuestion({ ...newQuestion, correctAnswers: newAnswers });
                                  }}
                                />
                                <Input
                                  placeholder={`Option ${i + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...newQuestion.options];
                                    newOptions[i] = e.target.value;
                                    setNewQuestion({ ...newQuestion, options: newOptions });
                                  }}
                                />
                              </div>
                            ))}
                          </TabsContent>
                        </Tabs>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-xs">Points</Label>
                            <Input
                              type="number"
                              value={newQuestion.points}
                              onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                            />
                          </div>
                          <Button onClick={handleAddNewQuestion} className="mt-5">
                            Add Question
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
                    No questions yet. Add your first question!
                  </p>
                ) : (
                  questions.map((q, index) => (
                    <Card key={q.id} className="bg-muted/50">
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

                        <Textarea
                          value={q.question}
                          onChange={(e) => updateLocalQuestion(index, { question: e.target.value })}
                          className="bg-background"
                        />

                        {q.type === 'multiple-choice' && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correct_answer === optIndex}
                                  onChange={() => updateLocalQuestion(index, { correct_answer: optIndex })}
                                  className="w-4 h-4"
                                />
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[optIndex] = e.target.value;
                                    updateLocalQuestion(index, { options: newOptions });
                                  }}
                                  className="bg-background"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'multi-select' && q.options && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Select all correct answers</p>
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <Checkbox
                                  checked={q.correct_answers.includes(optIndex)}
                                  onCheckedChange={(checked) => {
                                    const newAnswers = checked
                                      ? [...q.correct_answers, optIndex]
                                      : q.correct_answers.filter(a => a !== optIndex);
                                    updateLocalQuestion(index, { correct_answers: newAnswers });
                                  }}
                                />
                                <Input
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[optIndex] = e.target.value;
                                    updateLocalQuestion(index, { options: newOptions });
                                  }}
                                  className="bg-background"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
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
                    <CardTitle>Rubric (Optional)</CardTitle>
                    <CardDescription>
                      Define grading criteria for this assignment
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addRubricItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Criterion
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rubric.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No rubric items yet. Add criteria to help with grading.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {rubric.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-4 border rounded-lg">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 grid gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-3">
                            <Input
                              placeholder="Criterion name"
                              value={item.criterion}
                              onChange={(e) => updateRubricItem(item.id, 'criterion', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Points"
                              min={1}
                              value={item.maxPoints}
                              onChange={(e) => updateRubricItem(item.id, 'maxPoints', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <Textarea
                            placeholder="Description of what this criterion evaluates"
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Assignment' : 'Create Assignment'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
