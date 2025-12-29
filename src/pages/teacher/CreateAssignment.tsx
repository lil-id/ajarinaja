import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { useTeacherCourses } from '@/hooks/useCourses';
import { useCreateAssignment, useUpdateAssignment, useAssignment, RubricItem } from '@/hooks/useAssignments';
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
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAssignment() {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const isEditMode = !!assignmentId;
  
  const { courses = [] } = useTeacherCourses();
  const { data: existingAssignment, isLoading: assignmentLoading } = useAssignment(assignmentId || '');
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const [rubric, setRubric] = useState<RubricItem[]>([]);

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
    },
  });

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
      });
      setRubric(existingAssignment.rubric || []);
    }
  }, [isEditMode, existingAssignment, form]);

  const allowLate = form.watch('allow_late_submissions');

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

  const onSubmit = async (data: FormData) => {
    try {
      const assignmentData = {
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        due_date: data.due_date,
        max_points: data.max_points,
        allow_late_submissions: data.allow_late_submissions,
        late_penalty_percent: data.late_penalty_percent,
        max_file_size_mb: data.max_file_size_mb,
        status: data.status,
        rubric: rubric.filter(r => r.criterion.trim()),
      };

      if (isEditMode) {
        await updateAssignment.mutateAsync({
          id: assignmentId!,
          ...assignmentData,
        });
        toast.success('Assignment updated successfully');
      } else {
        await createAssignment.mutateAsync(assignmentData);
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
