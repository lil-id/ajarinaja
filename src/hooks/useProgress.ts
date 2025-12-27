import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
