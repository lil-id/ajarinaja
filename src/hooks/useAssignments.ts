import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface RubricItem {
  id: string;
  criterion: string;
  description: string;
  maxPoints: number;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  max_points: number;
  allow_late_submissions: boolean;
  late_penalty_percent: number | null;
  max_file_size_mb: number | null;
  allowed_file_types: string[] | null;
  rubric: RubricItem[];
  status: string;
  risk_on_missed: boolean;
  risk_on_below_kkm: boolean;
  risk_on_late: boolean;
  risk_missed_severity: 'high' | 'medium' | 'low' | null;
  risk_below_kkm_severity: 'high' | 'medium' | 'low' | null;
  risk_late_severity: 'high' | 'medium' | 'low' | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  text_content: string | null;
  submitted_at: string;
  is_late: boolean;
  score: number | null;
  graded: boolean;
  graded_at: string | null;
  graded_by: string | null;
  feedback: string | null;
  rubric_scores: { id: string; score: number }[];
}

export function useAssignments(courseId?: string) {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      let query = supabase.from('assignments').select('*');
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query.order('due_date', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(a => ({
        ...a,
        rubric: (a.rubric as unknown as RubricItem[]) || [],
      })) as Assignment[];
    },
  });
}

export function useAssignment(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        rubric: (data.rubric as unknown as RubricItem[]) || [],
      } as Assignment;
    },
    enabled: !!assignmentId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: {
      course_id: string;
      title: string;
      description?: string;
      instructions?: string;
      due_date: string;
      max_points?: number;
      allow_late_submissions?: boolean;
      late_penalty_percent?: number;
      max_file_size_mb?: number;
      allowed_file_types?: string[];
      rubric?: RubricItem[];
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          ...assignment,
          rubric: assignment.rubric as unknown as Json,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Assignment> & { id: string }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          ...updates,
          rubric: updates.rubric as unknown as Json,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// Submissions hooks - handles both file-based and question-based submissions
export function useAssignmentSubmissions(assignmentId: string, assignmentType?: string) {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId, assignmentType],
    queryFn: async () => {
      // For question-based assignments, query assignment_question_submissions
      if (assignmentType === 'questions') {
        const { data: submissions, error } = await supabase
          .from('assignment_question_submissions')
          .select('*')
          .eq('assignment_id', assignmentId);
        
        if (error) throw error;

        const studentIds = [...new Set(submissions?.map(s => s.student_id) || [])];
        
        if (studentIds.length === 0) return [];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', studentIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        return (submissions || []).map(s => ({
          ...s,
          answers: s.answers as Record<string, string | number | number[]>,
          student: profileMap.get(s.student_id) || null,
        }));
      }
      
      // For file-based assignments (default)
      const { data: submissions, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId);
      
      if (error) throw error;

      // Fetch student profiles separately
      const studentIds = [...new Set(submissions?.map(s => s.student_id) || [])];
      
      if (studentIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (submissions || []).map(s => ({
        ...s,
        rubric_scores: (s.rubric_scores as unknown as { id: string; score: number }[]) || [],
        student: profileMap.get(s.student_id) || null,
      }));
    },
    enabled: !!assignmentId,
  });
}

export function useMyAssignmentSubmission(assignmentId: string, assignmentType?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-assignment-submission', assignmentId, user?.id, assignmentType],
    queryFn: async () => {
      if (!user) return null;
      
      // For question-based assignments
      if (assignmentType === 'questions') {
        const { data, error } = await supabase
          .from('assignment_question_submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('student_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        return data ? {
          ...data,
          answers: data.answers as Record<string, string | number | number[]>,
        } : null;
      }
      
      // For file-based assignments (default)
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data ? {
        ...data,
        rubric_scores: (data.rubric_scores as unknown as { id: string; score: number }[]) || [],
      } as AssignmentSubmission : null;
    },
    enabled: !!assignmentId && !!user,
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      file,
      textContent,
      dueDate,
    }: {
      assignmentId: string;
      file?: File;
      textContent?: string;
      dueDate: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let fileType: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        filePath = `${user.id}/${assignmentId}/${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assignment-submissions')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;

        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
      }

      const isLate = new Date() > new Date(dueDate);

      const { data, error } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: user.id,
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          text_content: textContent,
          is_late: isLate,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: 'assignment_id,student_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { assignmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['my-assignment-submission', assignmentId] });
    },
  });
}

export function useGradeAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      score,
      feedback,
      rubricScores,
    }: {
      submissionId: string;
      score: number;
      feedback?: string;
      rubricScores?: { id: string; score: number }[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          score,
          feedback,
          rubric_scores: rubricScores as unknown as Json,
          graded: true,
          graded_at: new Date().toISOString(),
          graded_by: user.id,
        })
        .eq('id', submissionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
    },
  });
}

export function useSubmissionFileUrl(filePath: string | null) {
  return useQuery({
    queryKey: ['submission-file-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;
      
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .createSignedUrl(filePath, 3600);
      
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
  });
}
