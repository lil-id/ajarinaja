import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import i18next from 'i18next';

export interface ReportCard {
  id: string;
  student_id: string;
  period_id: string;
  status: 'draft' | 'finalized';
  overall_average: number | null;
  overall_rank: number | null;
  total_courses: number;
  teacher_notes: string | null;
  finalized_at: string | null;
  finalized_by: string | null;
  teacher_signature: string | null;
  principal_signature: string | null;
  attendance_percentage: number | null;
  attendance_sessions_total: number | null;
  attendance_sessions_present: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
  period?: {
    name: string;
    academic_year: string;
    semester: number;
  };
}

export interface ReportCardEntry {
  id: string;
  report_card_id: string;
  course_id: string;
  exam_average: number | null;
  assignment_average: number | null;
  final_grade: number;
  kkm: number;
  passed: boolean;
  teacher_notes: string | null;
  attendance_grade: number | null;
  attendance_percentage: number | null;
  attendance_sessions_total: number | null;
  attendance_sessions_present: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  course?: {
    title: string;
    description: string | null;
  };
}

export interface CreateReportCardData {
  student_id: string;
  period_id: string;
  teacher_notes?: string;
}

export interface CreateReportCardEntryData {
  report_card_id: string;
  course_id: string;
  exam_average?: number;
  assignment_average?: number;
  final_grade: number;
  kkm?: number;
  teacher_notes?: string;
}

export function useReportCards(periodId?: string) {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  // Fetch report cards for a period (teacher view)
  const reportCardsQuery = useQuery({
    queryKey: ['report-cards', periodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('period_id', periodId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Manually fetch student profiles since we don't have a direct FK
      const reportCards = data || [];
      const studentIds = reportCards.map(rc => rc.student_id);

      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', studentIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        return reportCards.map(rc => ({
          ...rc,
          student: profileMap.get(rc.student_id) || null,
        })) as ReportCard[];
      }

      return reportCards as ReportCard[];
    },
    enabled: !!periodId && role === 'teacher',
  });

  // Fetch student's own report cards
  const myReportCardsQuery = useQuery({
    queryKey: ['my-report-cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', user!.id)
        .eq('status', 'finalized')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch period info
      const periodIds = data?.map(rc => rc.period_id) || [];
      if (periodIds.length > 0) {
        const { data: periods } = await supabase
          .from('academic_periods')
          .select('id, name, academic_year, semester')
          .in('id', periodIds);

        const periodMap = new Map(periods?.map(p => [p.id, p]) || []);

        return (data || []).map(rc => ({
          ...rc,
          period: periodMap.get(rc.period_id) || null,
        })) as ReportCard[];
      }

      return data as ReportCard[];
    },
    enabled: !!user && role === 'student',
  });

  // Create report card
  const createReportCard = useMutation({
    mutationFn: async (data: CreateReportCardData) => {
      const { data: result, error } = await supabase
        .from('report_cards')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success(i18next.t('toast.reportCardCreated'));
    },
    onError: (error: Error & { code?: string }) => {
      // Log technical error for debugging
      console.error('[useReportCards] createReportCard failed:', error);

      // Translate known DB constraint violations into user-friendly messages
      const isDuplicate = error.code === '23505' ||
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique constraint');

      if (isDuplicate) {
        toast.error(i18next.t('toast.reportCardAlreadyExists'));
      } else {
        toast.error(i18next.t('toast.failedToCreateReportCard'));
      }
    },
  });

  // Update report card
  const updateReportCard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReportCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success(i18next.t('toast.reportCardUpdated'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToUpdateReportCard')}: ${error.message}`);
    },
  });

  // Finalize report card
  const finalizeReportCard = useMutation({
    mutationFn: async ({ id, signature }: { id: string; signature: string }) => {
      const { data, error } = await supabase
        .from('report_cards')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          finalized_by: user!.id,
          teacher_signature: signature,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success(i18next.t('toast.reportCardFinalized'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToFinalizeReportCard')}: ${error.message}`);
    },
  });

  // Delete report card
  const deleteReportCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      toast.success(i18next.t('toast.reportCardDeleted'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToDeleteReportCard')}: ${error.message}`);
    },
  });

  return {
    reportCards: reportCardsQuery.data || [],
    myReportCards: myReportCardsQuery.data || [],
    isLoading: reportCardsQuery.isLoading || myReportCardsQuery.isLoading,
    error: reportCardsQuery.error || myReportCardsQuery.error,
    createReportCard,
    updateReportCard,
    finalizeReportCard,
    deleteReportCard,
  };
}

export function useReportCardEntries(reportCardId?: string) {
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ['report-card-entries', reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_card_entries')
        .select('*')
        .eq('report_card_id', reportCardId!)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch course info
      const courseIds = data?.map(e => e.course_id) || [];
      if (courseIds.length > 0) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, description')
          .in('id', courseIds);

        const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

        return (data || []).map(entry => ({
          ...entry,
          course: courseMap.get(entry.course_id) || null,
        })) as any;
      }

      return data as any;
    },
    enabled: !!reportCardId,
  });

  // Create entry
  const createEntry = useMutation({
    mutationFn: async (data: CreateReportCardEntryData) => {
      const { data: result, error } = await supabase
        .from('report_card_entries')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-card-entries'] });
      toast.success(i18next.t('toast.gradeAdded'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToAddGrade')}: ${error.message}`);
    },
  });

  // Update entry
  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReportCardEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_card_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-card-entries'] });
      toast.success(i18next.t('toast.gradeUpdated'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToUpdateGrade')}: ${error.message}`);
    },
  });

  // Delete entry
  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_card_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-card-entries'] });
      toast.success(i18next.t('toast.gradeDeleted'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToDeleteGrade')}: ${error.message}`);
    },
  });

  // Bulk upsert entries
  const bulkUpsertEntries = useMutation({
    mutationFn: async (entries: CreateReportCardEntryData[]) => {
      const { data, error } = await supabase
        .from('report_card_entries')
        .upsert(entries, { onConflict: 'report_card_id,course_id' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-card-entries'] });
      toast.success(i18next.t('toast.gradesSaved'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToSaveGrades')}: ${error.message}`);
    },
  });

  return {
    entries: entriesQuery.data || [],
    isLoading: entriesQuery.isLoading,
    error: entriesQuery.error,
    createEntry,
    updateEntry,
    deleteEntry,
    bulkUpsertEntries,
  };
}

export function useSyncStudentAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, periodId }: { studentId: string; periodId: string }) => {
      const { data, error } = await supabase.rpc('sync_student_attendance_grades' as any, {
        p_student_id: studentId,
        p_period_id: periodId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      queryClient.invalidateQueries({ queryKey: ['report-card-entries'] });
      toast.success(i18next.t('toast.attendanceSynced'));
    },
    onError: (error: Error) => {
      toast.error(`${i18next.t('toast.failedToSyncAttendance')}: ${error.message}`);
    },
  });
}
