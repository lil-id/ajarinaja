import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, FileText, Calendar, Users, MoreHorizontal, Pencil, Trash2, Eye, Search, Archive, ArchiveRestore, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useAssignments, useDeleteAssignment, useUpdateAssignment } from '@/hooks/useAssignments';
import { toast } from 'sonner';

export default function TeacherAssignments() {
  const navigate = useNavigate();
  const { courses = [] } = useTeacherCourses();
  const { data: assignments = [], isLoading } = useAssignments();
  const deleteAssignment = useDeleteAssignment();
  const updateAssignment = useUpdateAssignment();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');

  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = a.title.toLowerCase().includes(query);
      const matchesCourse = courseMap.get(a.course_id)?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesCourse) return false;
    }
    
    // Course filter
    if (selectedCourse !== 'all' && a.course_id !== selectedCourse) return false;
    
    // Tab filter (archived vs active)
    const isArchived = (a as any).archived === true;
    if (activeTab === 'archived' && !isArchived) return false;
    if (activeTab !== 'archived' && isArchived) return false;
    
    // Status filter for active tab
    if (activeTab === 'active') {
      const isPastDue = new Date(a.due_date) < new Date();
      return a.status === 'published' && !isPastDue;
    }
    if (activeTab === 'closed') {
      const isPastDue = new Date(a.due_date) < new Date();
      return a.status === 'published' && isPastDue;
    }
    if (activeTab === 'draft') {
      return a.status === 'draft';
    }
    
    return true;
  });

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

  const handleArchive = async (id: string, archive: boolean) => {
    try {
      await updateAssignment.mutateAsync({ id, archived: archive } as any);
      toast.success(archive ? 'Assignment archived' : 'Assignment restored');
    } catch {
      toast.error('Failed to update assignment');
    }
  };

  const getStatusBadge = (assignment: { status: string; due_date: string }) => {
    const isPastDue = new Date(assignment.due_date) < new Date();
    if ((assignment as any).archived) {
      return <Badge variant="outline">Archived</Badge>;
    }
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

  // Count items for each tab
  const counts = {
    active: assignments.filter(a => !((a as any).archived) && a.status === 'published' && new Date(a.due_date) >= new Date()).length,
    closed: assignments.filter(a => !((a as any).archived) && a.status === 'published' && new Date(a.due_date) < new Date()).length,
    draft: assignments.filter(a => !((a as any).archived) && a.status === 'draft').length,
    archived: assignments.filter(a => (a as any).archived === true).length,
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({counts.closed})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({counts.archived})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {activeTab === 'archived' ? 'No archived assignments' : 'No assignments found'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === 'archived' 
                    ? 'Archived assignments will appear here'
                    : searchQuery 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first assignment to get started'
                  }
                </p>
                {!searchQuery && activeTab !== 'archived' && (
                  <Button onClick={() => navigate('/teacher/assignments/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAssignments.map((assignment) => (
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assignments/${assignment.id}/submissions`); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Submissions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assignments/${assignment.id}/edit`); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(assignment as any).archived ? (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(assignment.id, false); }}>
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(assignment.id, true); }}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); setDeleteId(assignment.id); }}
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
        </TabsContent>
      </Tabs>

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