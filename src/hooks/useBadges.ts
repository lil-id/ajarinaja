import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_preset: boolean;
  created_by: string | null;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  exam_id: string | null;
  submission_id: string | null;
  awarded_by: string;
  awarded_at: string;
  badge?: Badge;
}

/**
 * Custom hook to fetch all available badges (both preset and custom).
 * 
 * @returns {UseQueryResult} The query result containing all badges.
 */
export function useBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('is_preset', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Badge[];
    },
    enabled: !!user,
  });
}

/**
 * Custom hook to fetch badges awarded to a specific student.
 * 
 * @param {string} [studentId] - The ID of the student.
 * @returns {UseQueryResult} The query result containing student badges.
 */
export function useStudentBadges(studentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-badges', studentId],
    queryFn: async () => {
      let query = supabase
        .from('student_badges')
        .select('*, badge:badges(*)');

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query.order('awarded_at', { ascending: false });

      if (error) throw error;
      return data as (StudentBadge & { badge: Badge })[];
    },
    enabled: !!user,
  });
}

/**
 * Custom hook to fetch badges awarded to the current user (student).
 * 
 * @returns {UseQueryResult} The query result containing the user's badges.
 */
export function useMyBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-badges'],
    queryFn: async () => {
      if (!user) return [];

      // First get student badges with badge details
      const { data: badgesData, error } = await supabase
        .from('student_badges')
        .select('*, badge:badges(*)')
        .eq('student_id', user.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      if (!badgesData || badgesData.length === 0) return [];

      // Get unique teacher IDs and exam IDs
      const teacherIds = [...new Set(badgesData.map(b => b.awarded_by))];
      const examIds = [...new Set(badgesData.filter(b => b.exam_id).map(b => b.exam_id))];

      // Fetch teacher profiles using public_profiles view (accessible to students)
      const { data: teachers } = await supabase
        .from('public_profiles')
        .select('user_id, name')
        .in('user_id', teacherIds);

      // Fetch exams with course info
      let examsWithCourses: any[] = [];
      if (examIds.length > 0) {
        const { data: exams } = await supabase
          .from('exams')
          .select('id, title, course_id')
          .in('id', examIds as string[]);

        if (exams && exams.length > 0) {
          const courseIds = [...new Set(exams.map(e => e.course_id))];
          const { data: courses } = await supabase
            .from('courses')
            .select('id, title')
            .in('id', courseIds);

          examsWithCourses = exams.map(e => ({
            ...e,
            course: courses?.find(c => c.id === e.course_id)
          }));
        }
      }

      const teacherMap = new Map(teachers?.map(t => [t.user_id, t.name]) || []);
      const examMap = new Map(examsWithCourses.map(e => [e.id, e]));

      return badgesData.map(b => ({
        ...b,
        teacher_name: teacherMap.get(b.awarded_by) || 'Unknown Teacher',
        exam: b.exam_id ? examMap.get(b.exam_id) : null,
      }));
    },
    enabled: !!user,
  });
}

/**
 * Mutation hook to create a new custom badge.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useCreateBadge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      icon,
      color
    }: {
      name: string;
      description?: string;
      icon: string;
      color: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('badges')
        .insert({
          name,
          description,
          icon,
          color,
          is_preset: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}

/**
 * Mutation hook to award a badge to a student.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useAwardBadge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      studentId,
      badgeId,
      examId,
      submissionId,
    }: {
      studentId: string;
      badgeId: string;
      examId?: string;
      submissionId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('student_badges')
        .insert({
          student_id: studentId,
          badge_id: badgeId,
          exam_id: examId,
          submission_id: submissionId,
          awarded_by: user.id,
        })
        .select('*, badge:badges(*)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-badges'] });
    },
  });
}

/**
 * Mutation hook to revoke an awarded badge.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useRevokeBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeAwardId: string) => {
      const { error } = await supabase
        .from('student_badges')
        .delete()
        .eq('id', badgeAwardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-badges'] });
    },
  });
}

/**
 * Mutation hook to delete a custom badge.
 * 
 * @returns {UseMutationResult} The mutation result.
 */
export function useDeleteBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}
