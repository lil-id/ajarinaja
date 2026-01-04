import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock, Award, Lock, FileText, Upload } from 'lucide-react';
import { demoAssignments, demoCourses } from '@/data/demoData';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DemoTeacherAssignments() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'submission' | 'questions'>('submission');
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
    max_points: 100,
    allow_late: false,
    late_penalty: 10,
  });

  const handleCreate = () => {
    toast.info('Save is disabled in demo mode. Contact us for full access!', {
      action: {
        label: 'Contact',
        onClick: () => window.open('https://wa.me/6282293675164?text=Hi,%20I%20want%20to%20use%20AjarinAja%20LMS!', '_blank'),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment Management</h1>
          <p className="text-muted-foreground">Create file-based or question-based assignments</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Assignment Type */}
              <Tabs value={assignmentType} onValueChange={(v) => setAssignmentType(v as 'submission' | 'questions')}>
                <TabsList className="w-full">
                  <TabsTrigger value="submission" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    File Submission
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Questions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="submission" className="mt-4 space-y-4">
                  {/* File Submission Fields */}
                  <div className="space-y-2">
                    <Label>Assignment Title</Label>
                    <Input
                      placeholder="e.g., Essay Submission"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={newAssignment.course_id} onValueChange={(v) => setNewAssignment({ ...newAssignment, course_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {demoCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="datetime-local"
                        value={newAssignment.due_date}
                        onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Points</Label>
                      <Input
                        type="number"
                        value={newAssignment.max_points}
                        onChange={(e) => setNewAssignment({ ...newAssignment, max_points: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea
                      placeholder="Detailed instructions for file submission..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Students will upload files here</p>
                    <p className="text-xs">Supported: PDF, DOC, DOCX, Images</p>
                  </div>
                </TabsContent>

                <TabsContent value="questions" className="mt-4 space-y-4">
                  {/* Question-based Fields */}
                  <div className="space-y-2">
                    <Label>Assignment Title</Label>
                    <Input
                      placeholder="e.g., Quiz - Chapter 1"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={newAssignment.course_id} onValueChange={(v) => setNewAssignment({ ...newAssignment, course_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {demoCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="datetime-local"
                        value={newAssignment.due_date}
                        onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Points</Label>
                      <Input
                        type="number"
                        value={newAssignment.max_points}
                        onChange={(e) => setNewAssignment({ ...newAssignment, max_points: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea
                      placeholder="Instructions for answering questions..."
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  {/* Question Builder Preview */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Questions</Label>
                      <Button variant="outline" size="sm" onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Question
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">MC</Badge>
                          <span className="text-sm">Sample: What is 2+2?</span>
                        </div>
                        <span className="text-xs text-muted-foreground">10 pts</span>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Essay</Badge>
                          <span className="text-sm">Sample: Explain your answer...</span>
                        </div>
                        <span className="text-xs text-muted-foreground">20 pts</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Late Submissions - Common for both types */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Allow Late Submissions</Label>
                  <p className="text-xs text-muted-foreground">Accept submissions after deadline</p>
                </div>
                <Switch
                  checked={newAssignment.allow_late}
                  onCheckedChange={(v) => setNewAssignment({ ...newAssignment, allow_late: v })}
                />
              </div>

              {newAssignment.allow_late && (
                <div className="space-y-2">
                  <Label>Late Penalty (%)</Label>
                  <Input
                    type="number"
                    value={newAssignment.late_penalty}
                    onChange={(e) => setNewAssignment({ ...newAssignment, late_penalty: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">Saving is disabled in demo mode</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="flex-1">
                  Create Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {demoAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                <Badge variant={assignment.status === 'published' ? 'default' : 'secondary'}>
                  {assignment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{assignment.course_title}</p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">
                  <Award className="h-3 w-3 mr-1" />
                  {assignment.max_points} pts
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Due {format(new Date(assignment.due_date), 'MMM d')}
                </Badge>
                <Badge variant="outline">{assignment.assignment_type}</Badge>
                {assignment.allow_late_submissions && (
                  <Badge variant="secondary">Late OK (-{assignment.late_penalty_percent}%)</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
