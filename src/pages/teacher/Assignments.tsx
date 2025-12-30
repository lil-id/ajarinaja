import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, FileText, Calendar, Users, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments';
import { toast } from 'sonner';

export default function TeacherAssignments() {
  const navigate = useNavigate();
  const { courses = [] } = useTeacherCourses();
  const { data: assignments = [], isLoading } = useAssignments();
  const deleteAssignment = useDeleteAssignment();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAssignment.mutateAsync(deleteId);
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
    }
    setDeleteId(null);
  };

  const getStatusBadge = (assignment: { status: string; due_date: string }) => {
    const isPastDue = new Date(assignment.due_date) < new Date();

    if (assignment.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (isPastDue) {
      return <Badge variant="destructive">Closed</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  const openAssignment = (id: string, status: string) => {
    if (status === 'draft') {
      navigate(`/teacher/assignments/${id}/edit`);
      return;
    }

    navigate(`/teacher/assignments/${id}/submissions`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Create and manage course assignments</p>
        </div>
        <Button onClick={() => navigate('/teacher/assignments/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first assignment to get started
            </p>
            <Button onClick={() => navigate('/teacher/assignments/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              role="button"
              tabIndex={0}
              onClick={() => openAssignment(assignment.id, assignment.status)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openAssignment(assignment.id, assignment.status);
                }
              }}
              className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription>
                      {courseMap.get(assignment.course_id) || 'Unknown Course'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(assignment)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/teacher/assignments/${assignment.id}/submissions`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(assignment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due: {format(new Date(assignment.due_date), 'MMM d, yyyy h:mm a')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {assignment.max_points} points
                  </div>
                </div>
                {assignment.description && (
                  <p className="mt-2 text-sm line-clamp-2">{assignment.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment and all student submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
