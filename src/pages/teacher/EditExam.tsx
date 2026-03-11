import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useExamWithQuestions, useUpdateExam, Question } from '@/hooks/useExams';
import { useUpdateQuestion, useDeleteQuestion, useAddQuestion } from '@/hooks/useQuestions';
import { useQuestionBank, useIncrementQuestionUsage, useSaveExamQuestionsToBank } from '@/hooks/useQuestionBank';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTeacherCourseClasses } from '@/hooks/useTeacherCourseClasses';
import { ArrowLeft, Plus, Trash2, Save, Loader2, CheckCircle, AlignLeft, Calendar, Library, Search, BookmarkPlus, Eye, X, Image as ImageIcon, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VisualEquationBuilder from '@/components/VisualEquationBuilder';
import FormulaText from '@/components/FormulaText';
import RiskCriteriaBuilder, { RiskCriterion } from '@/components/RiskCriteriaBuilder';
import SortableList from '@/components/SortableContext';
import SortableItem from '@/components/SortableItem';
import { arrayMove } from '@dnd-kit/sortable';
import StudentPreviewMode from '@/components/StudentPreviewMode';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { localDateTimeToUTC, utcToLocalDateTime } from '@/lib/dateUtils';
import { storageApi } from '@/features/storage/api/storage.api.backend';

/**
 * Edit Exam page.
 * 
 * Interface for modifying an existing exam.
 * Features:
 * - Edit exam details (Title, duration, dates)
 * - Manage questions (Add, Edit, Delete, Reorder)
 * - Question Bank integration (Import/Save)
 * - Student Preview mode
 * - Risk Criteria configuration
 * 
 * @returns {JSX.Element} The rendered Edit Exam page.
 */
const EditExam = () => {
  const { t } = useTranslation();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useSidebarContext();
  const { data: exam, isLoading } = useExamWithQuestions(examId || '');
  const updateExam = useUpdateExam();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const addQuestion = useAddQuestion();
  const { data: questionBank = [] } = useQuestionBank();
  const incrementUsage = useIncrementQuestionUsage();
  const saveToBank = useSaveExamQuestionsToBank();

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
    start_date: '',
    end_date: '',
    kkm: 60,
    status: 'draft',
    course_id: '',
    class_id: '',
  });

  const [riskCriteria, setRiskCriteria] = useState<RiskCriterion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [isSaveToBankDialogOpen, setIsSaveToBankDialogOpen] = useState(false);
  const [saveToBankCategory, setSaveToBankCategory] = useState('General');
  const [newQuestion, setNewQuestion] = useState<{
    type: 'multiple-choice' | 'multi-select' | 'essay';
    question: string;
    image_url?: string;
    options: { text: string; image_url?: string }[];
    correctAnswer: number;
    correctAnswers: number[];
    points: number;
  }>({
    type: 'multiple-choice',
    question: '',
    image_url: undefined,
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctAnswer: 0,
    correctAnswers: [],
    points: 10,
  });

  const { courses = [] } = useTeacherCourses();
  const { data: classes = [] } = useTeacherCourseClasses(examForm.course_id || undefined);

  useEffect(() => {
    if (exam) {
      setExamForm({
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        start_date: exam.start_date ? utcToLocalDateTime(exam.start_date) : '',
        end_date: exam.end_date ? utcToLocalDateTime(exam.end_date) : '',
        kkm: (exam as any).kkm || 60,
        status: exam.status || 'draft',
        course_id: exam.course_id || '',
        class_id: exam.class_id || '',
      });
      setQuestions(exam.questions || []);

      // Initialize risk criteria from exam data
      const examData = exam as any;
      const initialCriteria: RiskCriterion[] = [
        {
          id: 'missed',
          type: 'missed',
          name: 'Missed Submission',
          description: 'Student did not submit by the deadline',
          enabled: examData.risk_on_missed || false,
          severity: examData.risk_missed_severity || 'high',
        },
        {
          id: 'below_kkm',
          type: 'below_kkm',
          name: 'Below Passing Grade (KKM)',
          description: 'Score is below the minimum passing threshold',
          enabled: examData.risk_on_below_kkm || false,
          severity: examData.risk_below_kkm_severity || 'medium',
        },
      ];
      setRiskCriteria(initialCriteria);
    }
  }, [exam]);

  const handleSaveExam = async () => {
    const missedCriterion = riskCriteria.find(c => c.type === 'missed');
    const belowKkmCriterion = riskCriteria.find(c => c.type === 'below_kkm');

    try {
      await updateExam.mutateAsync({
        id: examId!,
        title: examForm.title,
        description: examForm.description || null,
        duration: examForm.duration,
        start_date: examForm.start_date ? localDateTimeToUTC(examForm.start_date) : null,
        end_date: examForm.end_date ? localDateTimeToUTC(examForm.end_date) : null,
        kkm: examForm.kkm,
        status: examForm.status,
        course_id: examForm.course_id,
        class_id: examForm.class_id || null,
        risk_on_missed: missedCriterion?.enabled || false,
        risk_on_below_kkm: belowKkmCriterion?.enabled || false,
        risk_missed_severity: missedCriterion?.severity || 'high',
        risk_below_kkm_severity: belowKkmCriterion?.severity || 'medium',
      });
      toast.success(t('toast.examUpdated'));
    } catch (error) {
      toast.error(t('toast.failedToUpdateExam'));
    }
  };

  const handleUpdateQuestion = async (q: Question) => {
    try {
      await updateQuestion.mutateAsync({
        id: q.id,
        question: q.question,
        image_url: q.image_url,
        options: q.options,
        correct_answer: q.correct_answer,
        correct_answers: q.correct_answers,
        points: q.points,
        type: q.type,
        order_index: q.order_index,
      });
      toast.success(t('toast.questionUpdated'));
    } catch (error) {
      toast.error(t('toast.failedToSaveQuestion'));
    }
  };

  const uploadImage = async (file: File) => {
    try {
      // setIsUploading(true); // This variable is not defined in the provided context. Assuming it's meant to be added elsewhere or is a placeholder.
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
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion.mutateAsync(questionId);
      setQuestions(questions.filter(q => q.id !== questionId));
      toast.success(t('toast.questionDeleted'));
    } catch (error) {
      toast.error(t('toast.failedToDeleteQuestion'));
    }
  };

  const handleAddNewQuestion = async () => {
    if (!newQuestion.question.trim()) {
      toast.error(t('toast.pleaseEnterQuestion'));
      return;
    }

    const isChoice = newQuestion.type === 'multiple-choice' || newQuestion.type === 'multi-select';

    try {
      const result = await addQuestion.mutateAsync({
        examId: examId!,
        type: newQuestion.type,
        question: newQuestion.question,
        image_url: newQuestion.image_url,
        options: isChoice ? newQuestion.options : null,
        correct_answer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : null,
        correct_answers: newQuestion.type === 'multi-select' ? newQuestion.correctAnswers : null,
        points: newQuestion.points,
        order_index: questions.length,
      });

      setQuestions([...questions, result as Question]);
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
    } catch (error) {
      toast.error(t('toast.failedToSaveQuestion'));
    }
  };

  const updateLocalQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleQuestionReorder = async (oldIndex: number, newIndex: number) => {
    const reordered = arrayMove(questions, oldIndex, newIndex);
    // Update order_index for all questions
    const updatedQuestions = reordered.map((q, idx) => ({ ...q, order_index: idx }));
    setQuestions(updatedQuestions);

    // Save updated order to database
    for (const q of updatedQuestions) {
      await updateQuestion.mutateAsync({
        id: q.id,
        order_index: q.order_index,
      });
    }
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

    try {
      let currentIndex = questions.length;
      for (const bankId of selectedBankQuestions) {
        const bankQ = questionBank.find((q) => q.id === bankId);
        if (!bankQ) continue;

        const result = await addQuestion.mutateAsync({
          examId: examId!,
          type: (bankQ.type === 'multiple_choice' ? 'multiple-choice' : bankQ.type) as Question['type'],
          question: bankQ.question,
          options: bankQ.options,
          correct_answer: bankQ.correct_answer,
          correct_answers: (bankQ as any).correct_answers || null,
          points: bankQ.points,
          order_index: currentIndex,
        });

        setQuestions((prev) => [...prev, result as Question]);
        await incrementUsage.mutateAsync(bankId);
        currentIndex++;
      }

      toast.success(t('toast.questionsImported', { count: selectedBankQuestions.length }));
      setSelectedBankQuestions([]);
      setIsImportDialogOpen(false);
    } catch (error) {
      toast.error(t('toast.failedToImportQuestions'));
    }
  };

  const handleSaveQuestionsToBank = async () => {
    if (questions.length === 0) {
      toast.error(t('toast.noQuestionsToSave'));
      return;
    }

    try {
      const questionsToSave = questions.map((q) => ({
        question: q.question,
        type: q.type === 'multiple-choice' ? 'multiple_choice' : q.type,
        options: q.options as string[] | undefined,
        correct_answer: q.correct_answer ?? undefined,
        correct_answers: q.correct_answers ?? undefined,
        points: q.points,
      }));

      await saveToBank.mutateAsync({
        questions: questionsToSave,
        courseId: exam?.course_id || '',
        category: saveToBankCategory,
      });

      toast.success(t('toast.questionsSavedToBank', { count: questions.length }));
      setIsSaveToBankDialogOpen(false);
    } catch (error) {
      toast.error(t('toast.failedToSaveToBank'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('exams.examNotFound', { defaultValue: 'Exam not found' })}</p>
        <Button variant="outline" onClick={() => navigate('/teacher/exams')} className="mt-4">
          {t('exams.backToExams', { defaultValue: 'Back to Exams' })}
        </Button>
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
          <h1 className="text-3xl font-bold text-foreground">{t('exams.editExam')}</h1>
          <p className="text-muted-foreground mt-1">{t('exams.modifyExamDetails')}</p>
        </div>
        <div className="flex items-center gap-2">
          <StudentPreviewMode
            title={examForm.title}
            description={examForm.description}
            questions={questions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question,
              image_url: q.image_url,
              options: q.options,
              points: q.points,
            }))}
            duration={examForm.duration}
            itemType="exam"
            sidebarCollapsed={sidebarCollapsed}
          />
          <Button onClick={handleSaveExam} disabled={updateExam.isPending}>
            {updateExam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Exam Details */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>{t('exams.examDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.course')}</Label>
              <Select
                value={examForm.course_id}
                onValueChange={(val) => setExamForm({ ...examForm, course_id: val, class_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('exams.selectCourse')} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {examForm.course_id && (
              <div className="space-y-2">
                <Label>{t('common.class')}</Label>
                <Select
                  value={examForm.class_id}
                  onValueChange={(val) => setExamForm({ ...examForm, class_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.selectClass')} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('exams.examTitle')}</Label>
              <Input
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('exams.duration')}</Label>
              <Input
                type="number"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('common.description')}</Label>
            <Textarea
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              placeholder={t('exams.descriptionPlaceholder')}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('exams.startDate', { defaultValue: 'Start Date & Time' })}
              </Label>
              <Input
                type="datetime-local"
                value={examForm.start_date}
                onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('exams.endDate', { defaultValue: 'End Date & Time' })}
              </Label>
              <Input
                type="datetime-local"
                value={examForm.end_date}
                onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('exams.minimumPassingGrade')}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={examForm.kkm}
                onChange={(e) => setExamForm({ ...examForm, kkm: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">{t('exams.percentageRequired')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select
                value={examForm.status}
                onValueChange={(value) => setExamForm({ ...examForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('common.draft')}</SelectItem>
                  <SelectItem value="published">{t('common.publish')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Risk Criteria Builder */}
          <div className="pt-4 border-t">
            <RiskCriteriaBuilder
              criteria={riskCriteria}
              onChange={setRiskCriteria}
              allowLate={false}
              allowCustom={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('exams.questions')} ({questions.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {questions.length > 0 && (
              <Dialog open={isSaveToBankDialogOpen} onOpenChange={setIsSaveToBankDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="w-4 h-4" />
                    {t('common.saveToBank', { defaultValue: 'Save to Bank' })}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('common.saveQuestionsToBank', { defaultValue: 'Save Questions to Bank' })}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      {t('common.saveQuestionsToBankDesc', { defaultValue: `This will save all ${questions.length} question(s) from this exam to your question bank for future reuse.` })}
                    </p>
                    <div className="space-y-2">
                      <Label>{t('common.category', { defaultValue: 'Category' })}</Label>
                      <Select value={saveToBankCategory} onValueChange={setSaveToBankCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Midterm">Midterm</SelectItem>
                          <SelectItem value="Final">Final</SelectItem>
                          <SelectItem value="Quiz">Quiz</SelectItem>
                          <SelectItem value="Practice">Practice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsSaveToBankDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleSaveQuestionsToBank} disabled={saveToBank.isPending}>
                        {saveToBank.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('common.saveAllQuestions', { defaultValue: 'Save All Questions' })}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Library className="w-4 h-4" />
                  {t('exams.importFromBank')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('exams.importFromBank')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('common.searchQuestions')}
                      value={importSearch}
                      onChange={(e) => setImportSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-[400px] border rounded-lg p-2">
                    {filteredBankQuestions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {questionBank.length === 0
                          ? t('exams.noQuestionsInBank')
                          : t('common.noMatchingQuestions')}
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
                                  {q.type === 'multiple_choice' ? 'MCQ' : 'Essay'}
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
                      {t('common.selected', { count: selectedBankQuestions.length })}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleImportQuestions}
                        disabled={selectedBankQuestions.length === 0 || addQuestion.isPending}
                      >
                        {addQuestion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('common.importSelected')}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                  {t('exams.addQuestion')}
                </Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>{t('exams.addQuestion')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Tabs
                    value={newQuestion.type}
                    onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v as 'multiple-choice' | 'multi-select' | 'essay' })}
                  >
                    <TabsList className="mb-2">
                      <TabsTrigger value="multiple-choice">{t('exams.questionTypes.multipleChoice')}</TabsTrigger>
                      <TabsTrigger value="multi-select">{t('exams.questionTypes.multiSelect')}</TabsTrigger>
                      <TabsTrigger value="essay">{t('exams.questionTypes.essay')}</TabsTrigger>
                    </TabsList>

                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="new-q-img"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadImage(file);
                              if (url) {
                                setNewQuestion({ ...newQuestion, image_url: url });
                              }
                            }
                          }}
                        />
                        <Label htmlFor="new-q-img">
                          <Button type="button" variant="outline" size="sm" asChild disabled={false}>
                            <span className="cursor-pointer">
                              <ImageIcon className="w-4 h-4 mr-2" />
                              {newQuestion.image_url ? t('common.changeImage') : t('common.addImage')}
                            </span>
                          </Button>
                        </Label>
                        {newQuestion.image_url && (
                          <div className="relative group">
                            <img src={newQuestion.image_url} alt="Question" className="h-20 w-auto object-contain rounded border" />
                            <button
                              type="button"
                              className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
                              onClick={() => setNewQuestion({ ...newQuestion, image_url: undefined })}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <VisualEquationBuilder
                        value={newQuestion.question}
                        onChange={(v) => setNewQuestion({ ...newQuestion, question: v })}
                        placeholder={t('exams.enterQuestion', { defaultValue: 'Enter your question...' })}
                        rows={2}
                      />
                    </div>

                    <TabsContent value="multiple-choice" className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">{t('exams.selectCorrectAnswer')}:</p>
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
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <VisualEquationBuilder
                                  value={opt.text}
                                  onChange={(v) => {
                                    const newOptions = [...newQuestion.options];
                                    newOptions[i] = { ...newOptions[i], text: v };
                                    setNewQuestion({ ...newQuestion, options: newOptions });
                                  }}
                                  placeholder={`${t('exams.option', { defaultValue: 'Option' })} ${i + 1}`}
                                  compact
                                  singleLine
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
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={false}>
                                      <span className="cursor-pointer">
                                        {opt.image_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                      </span>
                                    </Button>
                                  </Label>
                                </div>
                              </div>
                              {opt.image_url && (
                                <div className="relative group w-fit">
                                  <img src={opt.image_url} alt={`${t('exams.option', { defaultValue: 'Option' })} ${i + 1}`} className="h-20 w-auto object-contain rounded border" />
                                  <button
                                    type="button"
                                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
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
                      <p className="text-xs text-muted-foreground">{t('assignments.mathTip', { defaultValue: 'Tip: Use $formula$ syntax for math in options' })}</p>
                    </TabsContent>

                    <TabsContent value="multi-select" className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">{t('exams.selectAllCorrectAnswers')}:</p>
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
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <VisualEquationBuilder
                                  value={opt.text}
                                  onChange={(v) => {
                                    const newOptions = [...newQuestion.options];
                                    newOptions[i] = { ...newOptions[i], text: v };
                                    setNewQuestion({ ...newQuestion, options: newOptions });
                                  }}
                                  placeholder={`${t('exams.option', { defaultValue: 'Option' })} ${i + 1}`}
                                  compact
                                  singleLine
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
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={false}>
                                      <span className="cursor-pointer">
                                        {opt.image_url ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                      </span>
                                    </Button>
                                  </Label>
                                </div>
                              </div>
                              {opt.image_url && (
                                <div className="relative group w-fit">
                                  <img src={opt.image_url} alt={`Option ${i + 1}`} className="h-20 w-auto object-contain rounded border" />
                                  <button
                                    type="button"
                                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
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
                      <p className="text-xs text-muted-foreground">{t('assignments.mathTip', { defaultValue: 'Tip: Use $formula$ syntax for math in options' })}</p>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex-1">
                      <Label className="text-xs">{t('common.points')}</Label>
                      <Input
                        type="number"
                        value={newQuestion.points}
                        onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                      />
                    </div>
                    <Button onClick={handleAddNewQuestion} className="mt-5" disabled={addQuestion.isPending}>
                      {addQuestion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t('exams.addQuestion')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('exams.noQuestionsYet')}</p>
          ) : (
            <SortableList
              items={questions.map(q => q.id)}
              onReorder={handleQuestionReorder}
            >
              <div className="space-y-4">
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
                              onBlur={() => handleUpdateQuestion(questions[index])}
                            />
                            <span className="text-xs text-muted-foreground">pts</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteQuestion(q.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`edit-q-img-${q.id}`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await uploadImage(file);
                                  if (url) {
                                    updateLocalQuestion(index, { image_url: url });
                                    handleUpdateQuestion({ ...questions[index], image_url: url });
                                  }
                                }
                              }}
                            />
                            <Label htmlFor={`edit-q-img-${q.id}`}>
                              <Button type="button" variant="outline" size="sm" asChild disabled={false}>
                                <span className="cursor-pointer">
                                  <ImageIcon className="w-4 h-4 mr-2" />
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
                                  onClick={() => {
                                    updateLocalQuestion(index, { image_url: undefined });
                                    handleUpdateQuestion({ ...questions[index], image_url: null });
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <VisualEquationBuilder
                            value={q.question}
                            onChange={(v) => updateLocalQuestion(index, { question: v })}
                            onBlur={() => handleUpdateQuestion(questions[index])}
                            compact
                            placeholder={t('exams.enterQuestion', { defaultValue: 'Enter your question...' })}
                          />
                        </div>

                        {q.type === 'multiple-choice' && q.options && (
                          <div className="space-y-2">
                            {(q.options).map((opt, optIndex) => {
                              const isString = typeof opt === 'string';
                              const text = isString ? opt : (opt as any).text || '';
                              const imageUrl = !isString ? (opt as any).image_url : undefined;

                              return (
                                <div key={optIndex} className="flex items-start gap-2">
                                  <div className="pt-2">
                                    <input
                                      type="radio"
                                      name={`correct-${q.id}`}
                                      checked={q.correct_answer === optIndex}
                                      onChange={() => {
                                        updateLocalQuestion(index, { correct_answer: optIndex });
                                        handleUpdateQuestion({ ...questions[index], correct_answer: optIndex });
                                      }}
                                      className="w-4 h-4"
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <VisualEquationBuilder
                                        value={text}
                                        onChange={(v) => {
                                          const newOptions = [...(q.options as any[])];
                                          if (typeof newOptions[optIndex] === 'string') {
                                            newOptions[optIndex] = { text: v };
                                          } else {
                                            newOptions[optIndex] = { ...newOptions[optIndex], text: v };
                                          }
                                          updateLocalQuestion(index, { options: newOptions });
                                        }}
                                        onBlur={() => handleUpdateQuestion(questions[index])}
                                        compact
                                        singleLine
                                        placeholder={`${t('exams.option', { defaultValue: 'Option' })} ${optIndex + 1}`}
                                      />
                                      <div className="relative">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`edit-opt-img-${q.id}-${optIndex}`}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const url = await uploadImage(file);
                                              if (url) {
                                                const newOptions = [...(q.options as any[])];
                                                if (typeof newOptions[optIndex] === 'string') {
                                                  newOptions[optIndex] = { text: newOptions[optIndex], image_url: url };
                                                } else {
                                                  newOptions[optIndex] = { ...newOptions[optIndex], image_url: url };
                                                }
                                                updateLocalQuestion(index, { options: newOptions });
                                                handleUpdateQuestion({ ...questions[index], options: newOptions });
                                              }
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`edit-opt-img-${q.id}-${optIndex}`}>
                                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={false}>
                                            <span className="cursor-pointer">
                                              {imageUrl ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                            </span>
                                          </Button>
                                        </Label>
                                      </div>
                                    </div>
                                    {imageUrl && (
                                      <div className="relative group w-fit">
                                        <img src={imageUrl} alt={`${t('exams.option', { defaultValue: 'Option' })} ${optIndex + 1}`} className="h-auto max-h-[150px] object-contain rounded border" />
                                        <button
                                          type="button"
                                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            const newOptions = [...(q.options as any[])];
                                            newOptions[optIndex] = { ...newOptions[optIndex], image_url: undefined };
                                            updateLocalQuestion(index, { options: newOptions });
                                            handleUpdateQuestion({ ...questions[index], options: newOptions });
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'multi-select' && q.options && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">{t('exams.selectAllCorrectAnswers')}</p>
                            {(q.options).map((opt, optIndex) => {
                              const isString = typeof opt === 'string';
                              const text = isString ? opt : (opt as any).text || '';
                              const imageUrl = !isString ? (opt as any).image_url : undefined;

                              return (
                                <div key={optIndex} className="flex items-start gap-2">
                                  <div className="pt-2">
                                    <Checkbox
                                      checked={(q.correct_answers || []).includes(optIndex)}
                                      onCheckedChange={(checked) => {
                                        const currentAnswers = q.correct_answers || [];
                                        const newAnswers = checked
                                          ? [...currentAnswers, optIndex]
                                          : currentAnswers.filter(a => a !== optIndex);
                                        updateLocalQuestion(index, { correct_answers: newAnswers });
                                        handleUpdateQuestion({ ...questions[index], correct_answers: newAnswers });
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <VisualEquationBuilder
                                        value={text}
                                        onChange={(v) => {
                                          const newOptions = [...(q.options as any[])];
                                          if (typeof newOptions[optIndex] === 'string') {
                                            newOptions[optIndex] = { text: v };
                                          } else {
                                            newOptions[optIndex] = { ...newOptions[optIndex], text: v };
                                          }
                                          updateLocalQuestion(index, { options: newOptions });
                                        }}
                                        onBlur={() => handleUpdateQuestion(questions[index])}
                                        compact
                                        singleLine
                                      />
                                      <div className="relative">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`edit-opt-img-ms-${q.id}-${optIndex}`}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const url = await uploadImage(file);
                                              if (url) {
                                                const newOptions = [...(q.options as any[])];
                                                if (typeof newOptions[optIndex] === 'string') {
                                                  newOptions[optIndex] = { text: newOptions[optIndex], image_url: url };
                                                } else {
                                                  newOptions[optIndex] = { ...newOptions[optIndex], image_url: url };
                                                }
                                                updateLocalQuestion(index, { options: newOptions });
                                                handleUpdateQuestion({ ...questions[index], options: newOptions });
                                              }
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`edit-opt-img-ms-${q.id}-${optIndex}`}>
                                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" asChild disabled={false}>
                                            <span className="cursor-pointer">
                                              {imageUrl ? <ImageIcon className="w-4 h-4 text-primary" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                                            </span>
                                          </Button>
                                        </Label>
                                      </div>
                                    </div>
                                    {imageUrl && (
                                      <div className="relative group w-fit">
                                        <img src={imageUrl} alt={`${t('exams.option', { defaultValue: 'Option' })} ${optIndex + 1}`} className="h-auto max-h-[150px] object-contain rounded border" />
                                        <button
                                          type="button"
                                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            const newOptions = [...(q.options as any[])];
                                            newOptions[optIndex] = { ...newOptions[optIndex], image_url: undefined };
                                            updateLocalQuestion(index, { options: newOptions });
                                            handleUpdateQuestion({ ...questions[index], options: newOptions });
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </SortableItem>
                ))}
              </div>
            </SortableList>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditExam;
