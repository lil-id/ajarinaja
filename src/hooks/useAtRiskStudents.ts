import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useRiskSettings } from './useRiskSettings';

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  riskFactors: RiskFactor[];
  riskLevel: 'high' | 'medium' | 'low';
}

export interface RiskFactor {
  type: 'no_material_views' | 'missed_deadline' | 'low_score' | 'no_exam_submissions' | 'late_submission' | 'below_kkm';
  description: string;
  severity: 'high' | 'medium' | 'low';
  // Metadata for navigation
  examIds?: string[];
  assignmentIds?: string[];
  courseId?: string;
}

export function useAtRiskStudents() {
  const { user } = useAuth();
  const { settings: riskSettings } = useRiskSettings();

  const { data: teacherCourses = [] } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const courseIds = teacherCourses.map(c => c.id);

  // Fetch enrollments with student profiles
  const { data: enrollments = [] } = useQuery({
    queryKey: ['at-risk-enrollments', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .in('course_id', courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Fetch student profiles
  const studentIds = [...new Set(enrollments.map(e => e.student_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ['student-profiles', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentIds);
      if (error) throw error;
      return data;
    },
    enabled: studentIds.length > 0,
  });

  // Fetch material views
  const { data: materialViews = [] } = useQuery({
    queryKey: ['at-risk-material-views', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('material_views')
        .select('*, course_materials!inner(course_id)')
        .in('course_materials.course_id', courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Fetch course materials
  const { data: materials = [] } = useQuery({
    queryKey: ['at-risk-materials', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .in('course_id', courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Fetch exam submissions
  const { data: examSubmissions = [] } = useQuery({
    queryKey: ['at-risk-exam-submissions', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('exam_submissions')
        .select('*, exams!inner(course_id, total_points)')
        .in('exams.course_id', courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Fetch exams
  const { data: exams = [] } = useQuery({
    queryKey: ['at-risk-exams', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .in('course_id', courseIds)
        .eq('status', 'published');
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Fetch assignment submissions
  const { data: assignmentSubmissions = [] } = useQuery({
    queryKey: ['at-risk-assignment-submissions', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*, assignments!inner(course_id, max_points, due_date)')
        .in('assignments.course_id', courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Fetch assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['at-risk-assignments', courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .eq('status', 'published');
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  // Calculate at-risk students using customizable thresholds
  const atRiskStudents = useMemo(() => {
    const courseMap = new Map(teacherCourses.map(c => [c.id, c.title]));
    const profileMap = new Map(profiles.map(p => [p.user_id, p]));
    
    const results: AtRiskStudent[] = [];
    
    // Group enrollments by student and course
    enrollments.forEach(enrollment => {
      const profile = profileMap.get(enrollment.student_id);
      if (!profile) return;
      
      const courseId = enrollment.course_id;
      const courseName = courseMap.get(courseId) || 'Unknown Course';
      const riskFactors: RiskFactor[] = [];
      
      // Check for low material views
      const courseMaterials = materials.filter(m => m.course_id === courseId);
      const studentMaterialViews = materialViews.filter(
        (v: any) => v.student_id === enrollment.student_id && v.course_materials?.course_id === courseId
      );
      
      const materialViewPercent = courseMaterials.length > 0 
        ? (studentMaterialViews.length / courseMaterials.length) * 100 
        : 100;
      
      if (courseMaterials.length > 0 && materialViewPercent < riskSettings.low_risk_material_view_percent) {
        riskFactors.push({
          type: 'no_material_views',
          description: `Viewed ${studentMaterialViews.length} of ${courseMaterials.length} materials (${Math.round(materialViewPercent)}%)`,
          severity: studentMaterialViews.length === 0 ? 'medium' : 'low',
          courseId,
        });
      }
      
      // Check for no exam submissions
      const courseExams = exams.filter(e => e.course_id === courseId);
      const studentExamSubmissions = examSubmissions.filter(
        (s: any) => s.student_id === enrollment.student_id && s.exams?.course_id === courseId
      );
      
      if (courseExams.length > 0 && studentExamSubmissions.length === 0) {
        const unsubmittedExamIds = courseExams.map(e => e.id);
        riskFactors.push({
          type: 'no_exam_submissions',
          description: `Has not submitted any of ${courseExams.length} exams`,
          severity: 'high',
          examIds: unsubmittedExamIds,
        });
      }
      
      // Check for scores below KKM (using teacher's customized threshold)
      const gradedExamSubmissions = studentExamSubmissions.filter((s: any) => s.graded && s.score !== null);
      const belowKkmExams: string[] = [];
      
      gradedExamSubmissions.forEach((sub: any) => {
        const exam = courseExams.find(e => e.id === sub.exam_id);
        if (exam && exam.kkm && sub.score < exam.kkm) {
          belowKkmExams.push(sub.exam_id);
        }
      });
      
      // Check assignment scores below KKM too
      const courseAssignments = assignments.filter(a => a.course_id === courseId);
      const studentAssignmentSubmissions = assignmentSubmissions.filter(
        (s: any) => s.student_id === enrollment.student_id && s.assignments?.course_id === courseId
      );
      
      const belowKkmAssignments: string[] = [];
      studentAssignmentSubmissions.forEach((sub: any) => {
        const assignment = courseAssignments.find(a => a.id === sub.assignment_id);
        if (assignment && assignment.kkm && sub.graded && sub.score !== null && sub.score < assignment.kkm) {
          belowKkmAssignments.push(sub.assignment_id);
        }
      });
      
      const totalBelowKkm = belowKkmExams.length + belowKkmAssignments.length;
      
      if (totalBelowKkm >= riskSettings.high_risk_below_kkm_count) {
        riskFactors.push({
          type: 'below_kkm',
          description: `${totalBelowKkm} score${totalBelowKkm > 1 ? 's' : ''} below KKM`,
          severity: 'high',
          examIds: belowKkmExams,
          assignmentIds: belowKkmAssignments,
        });
      } else if (totalBelowKkm >= riskSettings.medium_risk_below_kkm_count) {
        riskFactors.push({
          type: 'below_kkm',
          description: `${totalBelowKkm} score${totalBelowKkm > 1 ? 's' : ''} below KKM`,
          severity: 'medium',
          examIds: belowKkmExams,
          assignmentIds: belowKkmAssignments,
        });
      }
      
      // Check for missed deadlines (assignments not submitted after due date)
      const now = new Date();
      const pastDueAssignments = courseAssignments.filter(a => new Date(a.due_date) < now);
      const missedAssignments = pastDueAssignments.filter(
        a => !studentAssignmentSubmissions.some((s: any) => s.assignment_id === a.id)
      );
      
      if (missedAssignments.length >= riskSettings.high_risk_missed_assignments) {
        riskFactors.push({
          type: 'missed_deadline',
          description: `Missed ${missedAssignments.length} assignment deadline${missedAssignments.length > 1 ? 's' : ''}`,
          severity: 'high',
          assignmentIds: missedAssignments.map(a => a.id),
        });
      } else if (missedAssignments.length >= riskSettings.medium_risk_missed_assignments) {
        riskFactors.push({
          type: 'missed_deadline',
          description: `Missed ${missedAssignments.length} assignment deadline${missedAssignments.length > 1 ? 's' : ''}`,
          severity: 'medium',
          assignmentIds: missedAssignments.map(a => a.id),
        });
      }
      
      // Check for late submissions
      const lateSubmissions = studentAssignmentSubmissions.filter((s: any) => s.is_late);
      if (lateSubmissions.length >= riskSettings.low_risk_late_submissions) {
        riskFactors.push({
          type: 'late_submission',
          description: `${lateSubmissions.length} late submission${lateSubmissions.length > 1 ? 's' : ''}`,
          severity: 'low',
          assignmentIds: lateSubmissions.map((s: any) => s.assignment_id),
        });
      }
      
      // Only add if there are risk factors
      if (riskFactors.length > 0) {
        const highCount = riskFactors.filter(r => r.severity === 'high').length;
        const mediumCount = riskFactors.filter(r => r.severity === 'medium').length;
        
        let riskLevel: 'high' | 'medium' | 'low' = 'low';
        if (highCount >= 2 || (highCount >= 1 && mediumCount >= 1)) {
          riskLevel = 'high';
        } else if (highCount >= 1 || mediumCount >= 2) {
          riskLevel = 'medium';
        }
        
        results.push({
          studentId: enrollment.student_id,
          studentName: profile.name,
          studentEmail: profile.email,
          courseId,
          courseName,
          riskFactors,
          riskLevel,
        });
      }
    });
    
    // Sort by risk level
    return results.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
  }, [enrollments, profiles, materials, materialViews, exams, examSubmissions, assignments, assignmentSubmissions, teacherCourses, riskSettings]);

  return {
    atRiskStudents,
    isLoading: !user || teacherCourses.length === 0,
    highRiskCount: atRiskStudents.filter(s => s.riskLevel === 'high').length,
    mediumRiskCount: atRiskStudents.filter(s => s.riskLevel === 'medium').length,
    lowRiskCount: atRiskStudents.filter(s => s.riskLevel === 'low').length,
  };
}
