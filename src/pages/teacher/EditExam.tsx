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
import { ArrowLeft, Plus, Trash2, Save, Loader2, CheckCircle, AlignLeft, Calendar, Library, Search, BookmarkPlus, Eye } from 'lucide-react';
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

  useEffect(() => {
    if (exam) {
      setExamForm({
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        start_date: exam.start_date ? new Date(exam.start_date).toISOString().slice(0, 16) : '',
        end_date: exam.end_date ? new Date(exam.end_date).toISOString().slice(0, 16) : '',
        kkm: (exam as any).kkm || 60,
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
        start_date: examForm.start_date ? new Date(examForm.start_date).toISOString() : null,
        end_date: examForm.end_date ? new Date(examForm.end_date).toISOString() : null,
        kkm: examForm.kkm,
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
        options: isChoice ? newQuestion.options : null,
        correct_answer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : null,
        correct_answers: newQuestion.type === 'multi-select' ? newQuestion.correctAnswers : null,
        points: newQuestion.points,
        order_index: questions.length,
        exam_id: examId!,
      });

      setQuestions([...questions, result as Question]);
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
          exam_id: examId!,
          type: bankQ.type === 'multiple_choice' ? 'multiple-choice' : bankQ.type,
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
        <p className="text-muted-foreground">Exam not found</p>
        <Button variant="outline" onClick={() => navigate('/teacher/exams')} className="mt-4">
          Back to Exams
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
          <h1 className="text-3xl font-bold text-foreground">Edit Exam</h1>
          <p className="text-muted-foreground mt-1">Modify exam details and questions</p>
        </div>
        <div className="flex items-center gap-2">
          <StudentPreviewMode
            title={examForm.title}
            description={examForm.description}
            questions={questions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.options as string[] | null,
              points: q.points,
            }))}
            duration={examForm.duration}
            itemType="exam"
            sidebarCollapsed={sidebarCollapsed}
          />
          <Button onClick={handleSaveExam} disabled={updateExam.isPending}>
            {updateExam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Exam Details */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              placeholder="Exam description..."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date & Time
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
                End Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={examForm.end_date}
                onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Minimum Passing Grade (KKM)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={examForm.kkm}
              onChange={(e) => setExamForm({ ...examForm, kkm: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Percentage required to pass</p>
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
          <CardTitle>Questions ({questions.length})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {questions.length > 0 && (
              <Dialog open={isSaveToBankDialogOpen} onOpenChange={setIsSaveToBankDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="w-4 h-4" />
                    Save to Bank
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Questions to Bank</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      This will save all {questions.length} question(s) from this exam to your question bank for future reuse.
                    </p>
                    <div className="space-y-2">
                      <Label>Category</Label>
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
                        Cancel
                      </Button>
                      <Button onClick={handleSaveQuestionsToBank} disabled={saveToBank.isPending}>
                        {saveToBank.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save All Questions
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
                      {selectedBankQuestions.length} selected
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImportQuestions}
                        disabled={selectedBankQuestions.length === 0 || addQuestion.isPending}
                      >
                        {addQuestion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Tabs
                    value={newQuestion.type}
                    onValueChange={(v) => setNewQuestion({ ...newQuestion, type: v as 'multiple-choice' | 'multi-select' | 'essay' })}
                  >
                    <TabsList className="mb-2">
                      <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                      <TabsTrigger value="multi-select">Multi-Select</TabsTrigger>
                      <TabsTrigger value="essay">Essay</TabsTrigger>
                    </TabsList>

                    <VisualEquationBuilder
                      value={newQuestion.question}
                      onChange={(v) => setNewQuestion({ ...newQuestion, question: v })}
                      placeholder="Enter your question..."
                      rows={2}
                    />

                    <TabsContent value="multiple-choice" className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">Select the correct answer:</p>
                      <div className="grid gap-2">
                        {newQuestion.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                            <input
                              type="radio"
                              name="newCorrect"
                              checked={newQuestion.correctAnswer === i}
                              onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <Input
                              placeholder={`Option ${i + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options];
                                newOptions[i] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: newOptions });
                              }}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Tip: Use $formula$ syntax for math in options</p>
                    </TabsContent>

                    <TabsContent value="multi-select" className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">Select all correct answers:</p>
                      <div className="grid gap-2">
                        {newQuestion.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
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
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Tip: Use $formula$ syntax for math in options</p>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex-1">
                      <Label className="text-xs">Points</Label>
                      <Input
                        type="number"
                        value={newQuestion.points}
                        onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                      />
                    </div>
                    <Button onClick={handleAddNewQuestion} className="mt-5" disabled={addQuestion.isPending}>
                      {addQuestion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
            <p className="text-center text-muted-foreground py-8">No questions yet. Add your first question!</p>
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

                        <VisualEquationBuilder
                          value={q.question}
                          onChange={(v) => updateLocalQuestion(index, { question: v })}
                          onBlur={() => handleUpdateQuestion(questions[index])}
                          compact
                        />

                        {q.type === 'multiple-choice' && q.options && (
                          <div className="space-y-2">
                            {(q.options as string[]).map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
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
                                <VisualEquationBuilder
                                  value={opt}
                                  onChange={(v) => {
                                    const newOptions = [...(q.options as string[])];
                                    newOptions[optIndex] = v;
                                    updateLocalQuestion(index, { options: newOptions });
                                  }}
                                  onBlur={() => handleUpdateQuestion(questions[index])}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'multi-select' && q.options && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Select all correct answers</p>
                            {(q.options as string[]).map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
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
                                <VisualEquationBuilder
                                  value={opt}
                                  onChange={(v) => {
                                    const newOptions = [...(q.options as string[])];
                                    newOptions[optIndex] = v;
                                    updateLocalQuestion(index, { options: newOptions });
                                  }}
                                  onBlur={() => handleUpdateQuestion(questions[index])}
                                  compact
                                />
                              </div>
                            ))}
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
