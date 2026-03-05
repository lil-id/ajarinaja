import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Custom hook to fetch exam submissions for the current user.
 * 
 * @returns {UseQueryResult} The query result containing exam submissions.
 */
export function useExamSubmissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exam-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('exam_submissions')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Custom hook to fetch material views for the current user.
 * 
 * @returns {UseQueryResult} The query result containing material views.
 */
export function useMaterialViews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['material-views', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('material_views')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Mutation hook to mark a material as viewed.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useMarkMaterialViewed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (materialId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('material_views')
        .upsert({
          material_id: materialId,
          student_id: user.id,
        }, {
          onConflict: 'material_id,student_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-views'] });
    },
  });
}

/**
 * Custom hook to fetch all assignment submissions for the current user.
 * Combines both file-based and question-based submissions.
 * 
 * @returns {UseQueryResult} The query result containing unique assignment IDs that have been submitted.
 */
export function useAllAssignmentSubmissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-assignment-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const [fileSubmissions, questionSubmissions] = await Promise.all([
        supabase
          .from('assignment_submissions')
          .select('assignment_id')
          .eq('student_id', user.id),
        supabase
          .from('assignment_question_submissions')
          .select('assignment_id')
          .eq('student_id', user.id)
      ]);

      if (fileSubmissions.error) throw fileSubmissions.error;
      if (questionSubmissions.error) throw questionSubmissions.error;

      const submittedAssignmentIds = new Set([
        ...(fileSubmissions.data?.map(s => s.assignment_id) || []),
        ...(questionSubmissions.data?.map(s => s.assignment_id) || [])
      ]);

      return Array.from(submittedAssignmentIds);
    },
    enabled: !!user,
  });
}

/**
 * Custom hook to calculate course progress based on completed exams, viewed materials, and submitted assignments.
 * 
 * @param {string} courseId - The ID of the course.
 * @param {string[]} examIds - List of exam IDs in the course.
 * @param {string[]} materialIds - List of material IDs in the course.
 * @param {string[]} assignmentIds - List of assignment IDs in the course.
 * @returns {object} Progress statistics and helper functions.
 */
export function useCourseProgress(
  courseId: string,
  examIds: string[],
  materialIds: string[],
  assignmentIds: string[] = []
) {
  const { data: submissions = [] } = useExamSubmissions();
  const { data: materialViews = [] } = useMaterialViews();
  const { data: submittedAssignments = [] } = useAllAssignmentSubmissions();

  const completedExams = submissions.filter(s => examIds.includes(s.exam_id));
  const viewedMaterials = materialViews.filter(v => materialIds.includes(v.material_id));
  const completedAssignments = submittedAssignments.filter(id => assignmentIds.includes(id));

  const examProgress = examIds.length > 0
    ? (completedExams.length / examIds.length) * 100
    : 100;

  const materialProgress = materialIds.length > 0
    ? (viewedMaterials.length / materialIds.length) * 100
    : 100;

  const assignmentProgress = assignmentIds.length > 0
    ? (completedAssignments.length / assignmentIds.length) * 100
    : 100;

  // Calculate overall progress as average of the three components
  // Only include components that have items
  let components = 0;
  let totalProgress = 0;

  if (examIds.length > 0) {
    components++;
    totalProgress += examProgress;
  }
  if (materialIds.length > 0) {
    components++;
    totalProgress += materialProgress;
  }
  if (assignmentIds.length > 0) {
    components++;
    totalProgress += assignmentProgress;
  }

  const overallProgress = components > 0 ? Math.round(totalProgress / components) : 0;

  return {
    completedExams: completedExams.length,
    totalExams: examIds.length,
    viewedMaterials: viewedMaterials.length,
    totalMaterials: materialIds.length,
    completedAssignments: completedAssignments.length,
    totalAssignments: assignmentIds.length,
    examProgress: Math.round(examProgress),
    materialProgress: Math.round(materialProgress),
    assignmentProgress: Math.round(assignmentProgress),
    overallProgress,
    isExamCompleted: (examId: string) => completedExams.some(s => s.exam_id === examId),
    isMaterialViewed: (materialId: string) => viewedMaterials.some(v => v.material_id === materialId),
    isAssignmentSubmitted: (assignmentId: string) => submittedAssignments.includes(assignmentId),
  };
}
