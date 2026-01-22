import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useExams, useCreateExam, useUpdateExam, useDeleteExam, Question } from '@/hooks/useExams';
import { useQuestionBank, useIncrementQuestionUsage } from '@/hooks/useQuestionBank';
import { FileText, Plus, Clock, Award, MoreVertical, Edit, Trash2, CheckCircle, AlignLeft, Loader2, ClipboardCheck, Search, Filter, Archive, ArchiveRestore, Library, ListChecks } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { sendCourseNotification, getEnrolledStudents } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import FormulaText from '@/components/FormulaText';

/**
 * Teacher Exams Management page.
 * 
 * Dashboard for managing exams across courses.
 * Features:
 * - List of exams (Published/Draft/Archived)
 * - Create new exam with quick setup
 * - Import questions from bank
 * - Publish/Archive/Delete actions
 * - Filtering and search
 * 
 * @returns {JSX.Element} The rendered Exams page.
 */
const TeacherExams = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courses } = useTeacherCourses();
  const { exams, isLoading } = useExams();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  // Filter exams to only show those for teacher's courses
  const teacherCourseIds = courses.map(c => c.id);
  const teacherExams = exams.filter(e => teacherCourseIds.includes(e.course_id));

  // Question bank
  const { data: questionBank = [] } = useQuestionBank();
  const incrementUsage = useIncrementQuestionUsage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [activeTab, setActiveTab] = useState('published');

  // Import from bank state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
    kkm: 60,
  });
  const [questions, setQuestions] = useState<Omit<Question, 'id' | 'exam_id'>[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<{
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

  const mapBankTypeToExamType = (type: string): 'multiple-choice' | 'multi-select' | 'essay' => {
    if (type === 'multiple_choice' || type === 'multiple-choice') return 'multiple-choice';
    if (type === 'multi_select' || type === 'multi-select') return 'multi-select';
    return 'essay';
  };

  const addQuestion = () => {
    if (!currentQuestion.question?.trim()) {
      toast.error(t('exams.enterQuestion'));
      return;
    }

    const isChoice = currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'multi-select';

    const newQuestion: Omit<Question, 'id' | 'exam_id'> = {
      type: currentQuestion.type,
      question: currentQuestion.question,
      points: currentQuestion.points,
      order_index: questions.length,
      options: isChoice ? currentQuestion.options : null,
      correct_answer: currentQuestion.type === 'multiple-choice' ? currentQuestion.correctAnswer : null,
      correct_answers: currentQuestion.type === 'multi-select' ? currentQuestion.correctAnswers : null,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      correctAnswers: [],
      points: 10,
    });
    toast.success(t('exams.questionAdded'));
  };

  const toggleCorrectAnswer = (index: number) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.includes(index)
        ? prev.correctAnswers.filter(i => i !== index)
        : [...prev.correctAnswers, index],
    }));
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

  const handleImportFromBank = async () => {
    if (selectedBankQuestions.length === 0) {
      toast.error(t('toast.selectQuestions'));
      return;
    }

    let currentIndex = questions.length;
    const importedQuestions: Omit<Question, 'id' | 'exam_id'>[] = [];

    for (const bankId of selectedBankQuestions) {
      const bankQ = questionBank.find((q) => q.id === bankId);
      if (!bankQ) continue;

      importedQuestions.push({
        type: mapBankTypeToExamType(bankQ.type),
        question: bankQ.question,
        options: bankQ.options,
        correct_answer: bankQ.correct_answer,
        correct_answers: bankQ.correct_answers,
        points: bankQ.points,
        order_index: currentIndex,
      });

      // Increment usage count
      await incrementUsage.mutateAsync(bankId);
      currentIndex++;
    }

    setQuestions([...questions, ...importedQuestions]);
    toast.success(t('toast.questionsImported', { count: selectedBankQuestions.length }));
    setSelectedBankQuestions([]);
    setIsImportDialogOpen(false);
  };

  const handleCreateExam = async () => {
    if (!selectedCourse || !examForm.title.trim() || questions.length === 0) {
      toast.error(t('exams.fillAllFields'));
      return;
    }

    try {
      await createExam.mutateAsync({
        courseId: selectedCourse,
        title: examForm.title,
        description: examForm.description,
        duration: examForm.duration,
        kkm: examForm.kkm,
        questions,
      });

      setExamForm({ title: '', description: '', duration: 60, kkm: 60 });
      setQuestions([]);
      setSelectedCourse('');
      setIsDialogOpen(false);
      toast.success(t('exams.examCreated'));
    } catch (error) {
      toast.error(t('exams.failedToCreate'));
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam.mutateAsync(examId);
      toast.success(t('exams.examDeleted'));
    } catch (error) {
      toast.error(t('exams.failedToDelete'));
    }
  };

  const handlePublishExam = async (examId: string) => {
    try {
      const exam = teacherExams.find(e => e.id === examId);
      await updateExam.mutateAsync({ id: examId, status: 'published' });

      // Send notification to enrolled students
      if (exam) {
        const recipients = await getEnrolledStudents(supabase, exam.course_id);
        if (recipients.length > 0) {
          const course = courses.find(c => c.id === exam.course_id);
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
            contentTitle: exam.title,
            duration: exam.duration,
            description: exam.description || undefined,
          });
        }
      }

      toast.success(t('exams.examPublished'));
    } catch (error) {
      toast.error(t('exams.failedToPublish'));
    }
  };

  const handleArchiveExam = async (examId: string, archive: boolean) => {
    try {
      await updateExam.mutateAsync({ id: examId, archived: archive } as any);
      toast.success(archive ? t('exams.examArchived') : t('exams.examRestored'));
    } catch {
      toast.error(t('exams.failedToUpdate'));
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'Unknown Course';
  };

  const openExam = (id: string, status: string) => {
    if (status === 'published') {
      navigate(`/teacher/exams/${id}/grade`);
      return;
    }
    navigate(`/teacher/exams/${id}/edit`);
  };

  // Filter exams based on search, course, and tab
  const filteredExams = teacherExams.filter(exam => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = exam.title.toLowerCase().includes(query);
      const matchesCourse = getCourseTitle(exam.course_id).toLowerCase().includes(query);
      if (!matchesTitle && !matchesCourse) return false;
    }

    // Course filter
    if (filterCourse !== 'all' && exam.course_id !== filterCourse) return false;

    // Tab filter
    const isArchived = (exam as any).archived === true;
    if (activeTab === 'archived') return isArchived;
    if (isArchived) return false;

    if (activeTab === 'published') return exam.status === 'published';
    if (activeTab === 'draft') return exam.status === 'draft';

    return true;
  });

  // Count items for tabs
  const counts = {
    published: teacherExams.filter(e => !((e as any).archived) && e.status === 'published').length,
    draft: teacherExams.filter(e => !((e as any).archived) && e.status === 'draft').length,
    archived: teacherExams.filter(e => (e as any).archived === true).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('exams.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('exams.manageExams')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" disabled={courses.length === 0}>
              <Plus className="w-4 h-4" />
              {t('exams.newExam')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('exams.createExam')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Exam Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('exams.selectCourse')}</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('exams.chooseCourse')} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('exams.examTitle')}</Label>
                  <Input
                    placeholder={t('exams.examTitlePlaceholder')}
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('exams.duration')}</Label>
                    <Input
                      type="number"
                      value={examForm.duration}
                      onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
                    />
                  </div>
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
                </div>
              </div>

              {/* Questions Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{t('exams.questions')} ({questions.length})</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportDialogOpen(true)}
                    disabled={!selectedCourse}
                  >
                    <Library className="w-4 h-4" />
                    {t('common.importFromBank')}
                  </Button>
                </div>

                {/* Question List */}
                {questions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        {q.type === 'multiple-choice' ? (
                          <CheckCircle className="w-4 h-4 text-secondary" />
                        ) : q.type === 'multi-select' ? (
                          <ListChecks className="w-4 h-4 text-accent" />
                        ) : (
                          <AlignLeft className="w-4 h-4 text-primary" />
                        )}
                        <span className="flex-1 text-sm truncate">{q.question}</span>
                        <Badge variant="outline" className="text-xs">{q.type}</Badge>
                        <span className="text-xs text-muted-foreground">{q.points} {t('common.pts')}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Question Form */}
                <Tabs
                  value={currentQuestion.type}
                  onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, type: v as 'multiple-choice' | 'multi-select' | 'essay', correctAnswers: [] })}
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="multiple-choice">{t('exams.questionTypes.multipleChoice')}</TabsTrigger>
                    <TabsTrigger value="multi-select">{t('exams.questionTypes.multiSelect')}</TabsTrigger>
                    <TabsTrigger value="essay">{t('exams.questionTypes.essay')}</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4">
                    <Textarea
                      placeholder={t('exams.enterQuestion')}
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    />

                    <TabsContent value="multiple-choice" className="mt-0 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">{t('exams.selectCorrectAnswer')}</p>
                      {currentQuestion.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={currentQuestion.correctAnswer === i}
                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: i })}
                            className="w-4 h-4"
                          />
                          <Input
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[i] = e.target.value;
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="multi-select" className="mt-0 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">{t('exams.selectAllCorrectAnswers')}</p>
                      {currentQuestion.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox
                            checked={currentQuestion.correctAnswers.includes(i)}
                            onCheckedChange={() => toggleCorrectAnswer(i)}
                          />
                          <Input
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[i] = e.target.value;
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                    </TabsContent>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs">{t('common.points')}</Label>
                        <Input
                          type="number"
                          value={currentQuestion.points}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) })}
                        />
                      </div>
                      <Button onClick={addQuestion} className="mt-5">
                        {t('exams.addQuestion')}
                      </Button>
                    </div>
                  </div>
                </Tabs>
              </div>

              <Button
                onClick={handleCreateExam}
                className="w-full"
                size="lg"
                disabled={createExam.isPending}
              >
                {createExam.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('exams.createExam')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import from Question Bank Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
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
                          <div className="flex gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {q.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {q.type === 'multiple_choice'
                                ? 'MCQ'
                                : q.type === 'multi_select'
                                  ? 'Multi-Select'
                                  : q.type === 'multi-select'
                                    ? 'Multi-Select'
                                    : 'Essay'}
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
                  {selectedBankQuestions.length} {t('common.selected')}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleImportFromBank}
                    disabled={selectedBankQuestions.length === 0 || incrementUsage.isPending}
                  >
                    {incrementUsage.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('common.importSelected')}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('exams.searchExams')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('common.allCourses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allCourses')}</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="published">{t('common.published')} ({counts.published})</TabsTrigger>
          <TabsTrigger value="draft">{t('common.draft')} ({counts.draft})</TabsTrigger>
          <TabsTrigger value="archived">{t('common.archived')} ({counts.archived})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {courses.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {t('exams.createCourseFirst')}
                </p>
              </CardContent>
            </Card>
          ) : filteredExams.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {activeTab === 'archived' ? t('exams.noArchivedExams') : t('exams.noExamsFound')}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery ? t('assignments.tryAdjustingSearch') :
                    activeTab === 'archived' ? t('exams.archivedExamsAppear') :
                      t('exams.createFirstExam')}
                </p>
                {!searchQuery && activeTab !== 'archived' && (
                  <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    {t('exams.createExam')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredExams.map((exam, index) => (
                <Card
                  key={exam.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openExam(exam.id, exam.status)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openExam(exam.id, exam.status);
                    }
                  }}
                  className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${exam.status === 'published'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-muted text-muted-foreground'
                          }`}>
                          {exam.status === 'published' ? t('common.published') : t('common.draft')}
                        </span>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {getCourseTitle(exam.course_id)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {exam.status === 'published' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/teacher/exams/${exam.id}/grade`); }}>
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              {t('exams.gradeExam')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/teacher/exams/${exam.id}/edit`); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          {exam.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePublishExam(exam.id); }}>
                              <FileText className="w-4 h-4 mr-2" />
                              {t('courses.publish')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {(exam as any).archived ? (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveExam(exam.id, false); }}>
                              <ArchiveRestore className="w-4 h-4 mr-2" />
                              {t('common.restore')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveExam(exam.id, true); }}>
                              <Archive className="w-4 h-4 mr-2" />
                              {t('common.archive')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {exam.duration} {t('common.min')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {exam.total_points} {t('common.pts')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherExams;