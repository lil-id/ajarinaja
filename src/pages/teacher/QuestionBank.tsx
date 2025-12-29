import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Copy, 
  Library,
  Tag,
  Loader2,
  ChevronDown
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useTeacherCourses } from "@/hooks/useCourses";
import {
  useQuestionBank,
  useQuestionBankCategories,
  useCreateQuestionBankItem,
  useUpdateQuestionBankItem,
  useDeleteQuestionBankItem,
  QuestionBankItem,
} from "@/hooks/useQuestionBank";

interface QuestionFormData {
  question: string;
  type: string;
  options: string[];
  correct_answer: number | null;
  correct_answers: number[];
  points: number;
  category: string;
  course_id: string | null;
  tags: string[];
}

const defaultFormData: QuestionFormData = {
  question: "",
  type: "multiple_choice",
  options: ["", "", "", ""],
  correct_answer: null,
  correct_answers: [],
  points: 10,
  category: "General",
  course_id: null,
  tags: [],
};

export default function QuestionBank() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);
  const [newCategory, setNewCategory] = useState("");

  const { courses } = useTeacherCourses();
  const { data: questions = [], isLoading } = useQuestionBank();
  const { data: categories = [] } = useQuestionBankCategories();
  const createQuestion = useCreateQuestionBankItem();
  const updateQuestion = useUpdateQuestionBankItem();
  const deleteQuestion = useDeleteQuestionBankItem();

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || q.category === filterCategory;
    const matchesCourse = filterCourse === "all" || q.course_id === filterCourse;
    const matchesType = filterType === "all" || q.type === filterType;
    return matchesSearch && matchesCategory && matchesCourse && matchesType;
  });

  const handleOpenDialog = (question?: QuestionBankItem) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question: question.question,
        type: question.type,
        options: question.options || ["", "", "", ""],
        correct_answer: question.correct_answer,
        correct_answers: question.correct_answers || [],
        points: question.points,
        category: question.category,
        course_id: question.course_id,
        tags: question.tags || [],
      });
    } else {
      setEditingQuestion(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    const isChoiceType = formData.type === "multiple_choice" || formData.type === "multi_select";
    
    if (isChoiceType) {
      const filledOptions = formData.options.filter((o) => o.trim());
      if (filledOptions.length < 2) {
        toast.error("At least 2 options are required");
        return;
      }
      if (formData.type === "multiple_choice" && formData.correct_answer === null) {
        toast.error("Please select the correct answer");
        return;
      }
      if (formData.type === "multi_select" && formData.correct_answers.length === 0) {
        toast.error("Please select at least one correct answer");
        return;
      }
    }

    const category = newCategory.trim() || formData.category;

    try {
      if (editingQuestion) {
        await updateQuestion.mutateAsync({
          id: editingQuestion.id,
          question: formData.question,
          type: formData.type,
          options: isChoiceType ? formData.options.filter((o) => o.trim()) : null,
          correct_answer: formData.type === "multiple_choice" ? formData.correct_answer : null,
          correct_answers: formData.type === "multi_select" ? formData.correct_answers : null,
          points: formData.points,
          category,
          course_id: formData.course_id || null,
          tags: formData.tags,
        });
        toast.success("Question updated");
      } else {
        await createQuestion.mutateAsync({
          question: formData.question,
          type: formData.type,
          options: isChoiceType ? formData.options.filter((o) => o.trim()) : null,
          correct_answer: formData.type === "multiple_choice" ? formData.correct_answer : null,
          correct_answers: formData.type === "multi_select" ? formData.correct_answers : null,
          points: formData.points,
          category,
          course_id: formData.course_id || null,
          tags: formData.tags,
        });
        toast.success("Question added to bank");
      }
      setIsDialogOpen(false);
      setNewCategory("");
    } catch (error) {
      toast.error("Failed to save question");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuestion.mutateAsync(deleteId);
      toast.success("Question deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  const handleDuplicate = async (question: QuestionBankItem) => {
    try {
      await createQuestion.mutateAsync({
        question: question.question + " (Copy)",
        type: question.type,
        options: question.options,
        correct_answer: question.correct_answer,
        correct_answers: question.correct_answers,
        points: question.points,
        category: question.category,
        course_id: question.course_id,
        tags: question.tags,
      });
      toast.success("Question duplicated");
    } catch (error) {
      toast.error("Failed to duplicate question");
    }
  };

  const getCourseTitle = (courseId: string | null) => {
    if (!courseId) return "No course";
    const course = courses.find((c) => c.id === courseId);
    return course?.title || "Unknown course";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
          <p className="text-muted-foreground">
            Save and reuse questions across exams
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Add Question to Bank"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      {categories.filter(c => c !== "General").map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or create new category..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Course (Optional)</Label>
                  <Select
                    value={formData.course_id || "none"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, course_id: v === "none" ? null : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="multi_select">Multi-Select</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({ ...formData, points: parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter your question..."
                  rows={3}
                />
              </div>

              {formData.type === "multiple_choice" && (
                <div className="space-y-3">
                  <Label>Options (select the correct answer)</Label>
                  <RadioGroup
                    value={formData.correct_answer?.toString() || ""}
                    onValueChange={(v) =>
                      setFormData({ ...formData, correct_answer: parseInt(v) })
                    }
                  >
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index] = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {formData.type === "multi_select" && (
                <div className="space-y-3">
                  <Label>Options (select all correct answers)</Label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.correct_answers.includes(index)}
                        onCheckedChange={(checked) => {
                          const newAnswers = checked
                            ? [...formData.correct_answers, index]
                            : formData.correct_answers.filter(a => a !== index);
                          setFormData({ ...formData, correct_answers: newAnswers });
                        }}
                      />
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createQuestion.isPending || updateQuestion.isPending}
                >
                  {(createQuestion.isPending || updateQuestion.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingQuestion ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="multi_select">Multi-Select</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No questions found</h3>
            <p className="text-muted-foreground mb-4">
              {questions.length === 0
                ? "Start building your question bank by adding questions."
                : "Try adjusting your filters."}
            </p>
            {questions.length === 0 && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Question
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{q.category}</Badge>
                      <Badge variant="outline">
                        {q.type === "multiple_choice" ? "MCQ" : "Essay"}
                      </Badge>
                      <Badge variant="outline">{q.points} pts</Badge>
                      {q.course_id && (
                        <Badge variant="outline" className="text-xs">
                          {getCourseTitle(q.course_id)}
                        </Badge>
                      )}
                      {q.used_count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Used {q.used_count} time{q.used_count > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground line-clamp-2">{q.question}</p>
                    {q.type === "multiple_choice" && q.options && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Options: {(q.options as string[]).filter(o => o).join(", ")}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(q)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(q)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(q.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question from your bank? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
