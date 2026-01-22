import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
 * Custom hook to calculate course progress based on completed exams and viewed materials.
 * 
 * @param {string} courseId - The ID of the course.
 * @param {string[]} examIds - List of exam IDs in the course.
 * @param {string[]} materialIds - List of material IDs in the course.
 * @returns {object} Progress statistics and helper functions.
 */
export function useCourseProgress(courseId: string, examIds: string[], materialIds: string[]) {
  const { data: submissions = [] } = useExamSubmissions();
  const { data: materialViews = [] } = useMaterialViews();

  const completedExams = submissions.filter(s => examIds.includes(s.exam_id));
  const viewedMaterials = materialViews.filter(v => materialIds.includes(v.material_id));

  const examProgress = examIds.length > 0
    ? Math.round((completedExams.length / examIds.length) * 100)
    : 100;

  const materialProgress = materialIds.length > 0
    ? Math.round((viewedMaterials.length / materialIds.length) * 100)
    : 100;

  const overallProgress = Math.round((examProgress + materialProgress) / 2);

  return {
    completedExams: completedExams.length,
    totalExams: examIds.length,
    viewedMaterials: viewedMaterials.length,
    totalMaterials: materialIds.length,
    examProgress,
    materialProgress,
    overallProgress,
    isExamCompleted: (examId: string) => completedExams.some(s => s.exam_id === examId),
    isMaterialViewed: (materialId: string) => viewedMaterials.some(v => v.material_id === materialId),
  };
}
