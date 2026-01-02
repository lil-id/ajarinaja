import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
  itemTitle?: string;
}

export function useAtRiskStudents() {
  const { user } = useAuth();

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

  // Fetch exams (with risk settings)
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

  // Fetch assignments (with risk settings)
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

  // Calculate at-risk students using per-item risk criteria
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
      
      // Check for low material views (as general engagement indicator)
      const courseMaterials = materials.filter(m => m.course_id === courseId);
      const studentMaterialViews = materialViews.filter(
        (v: any) => v.student_id === enrollment.student_id && v.course_materials?.course_id === courseId
      );
      
      const materialViewPercent = courseMaterials.length > 0 
        ? (studentMaterialViews.length / courseMaterials.length) * 100 
        : 100;
      
      // Low material engagement (general indicator, always checked)
      if (courseMaterials.length > 0 && materialViewPercent < 50 && studentMaterialViews.length === 0) {
        riskFactors.push({
          type: 'no_material_views',
          description: `Viewed ${studentMaterialViews.length} of ${courseMaterials.length} materials (${Math.round(materialViewPercent)}%)`,
          severity: 'low',
          courseId,
        });
      }
      
      // Check exams with per-item risk criteria
      const courseExams = exams.filter((e: any) => e.course_id === courseId);
      const studentExamSubmissions = examSubmissions.filter(
        (s: any) => s.student_id === enrollment.student_id && s.exams?.course_id === courseId
      );
      
      courseExams.forEach((exam: any) => {
        const submission = studentExamSubmissions.find((s: any) => s.exam_id === exam.id);
        const now = new Date();
        const endDate = exam.end_date ? new Date(exam.end_date) : null;
        const isPastDeadline = endDate && now > endDate;
        
        // Check if exam has risk_on_missed enabled and student hasn't submitted
        if (exam.risk_on_missed && isPastDeadline && !submission) {
          const severity = exam.risk_missed_severity || 'high';
          riskFactors.push({
            type: 'no_exam_submissions',
            description: `Missed exam: "${exam.title}"`,
            severity,
            examIds: [exam.id],
            itemTitle: exam.title,
          });
        }
        
        // Check if exam has risk_on_below_kkm enabled and score is below KKM
        if (exam.risk_on_below_kkm && submission && submission.graded && submission.score !== null) {
          if (exam.kkm && submission.score < exam.kkm) {
            const severity = exam.risk_below_kkm_severity || 'medium';
            riskFactors.push({
              type: 'below_kkm',
              description: `Below KKM on exam "${exam.title}" (${submission.score}/${exam.kkm})`,
              severity,
              examIds: [exam.id],
              itemTitle: exam.title,
            });
          }
        }
      });
      
      // Check assignments with per-item risk criteria
      const courseAssignments = assignments.filter((a: any) => a.course_id === courseId);
      const studentAssignmentSubmissions = assignmentSubmissions.filter(
        (s: any) => s.student_id === enrollment.student_id && s.assignments?.course_id === courseId
      );
      
      const now = new Date();
      
      courseAssignments.forEach((assignment: any) => {
        const submission = studentAssignmentSubmissions.find((s: any) => s.assignment_id === assignment.id);
        const dueDate = new Date(assignment.due_date);
        const isPastDeadline = now > dueDate;
        
        // Check if assignment has risk_on_missed enabled and student hasn't submitted
        if (assignment.risk_on_missed && isPastDeadline && !submission) {
          const severity = assignment.risk_missed_severity || 'high';
          riskFactors.push({
            type: 'missed_deadline',
            description: `Missed assignment: "${assignment.title}"`,
            severity,
            assignmentIds: [assignment.id],
            itemTitle: assignment.title,
          });
        }
        
        // Check if assignment has risk_on_late enabled and submission is late
        if (assignment.risk_on_late && submission && submission.is_late) {
          const severity = assignment.risk_late_severity || 'low';
          riskFactors.push({
            type: 'late_submission',
            description: `Late submission: "${assignment.title}"`,
            severity,
            assignmentIds: [assignment.id],
            itemTitle: assignment.title,
          });
        }
        
        // Check if assignment has risk_on_below_kkm enabled and score is below KKM
        if (assignment.risk_on_below_kkm && submission && submission.graded && submission.score !== null) {
          if (assignment.kkm && submission.score < assignment.kkm) {
            const severity = assignment.risk_below_kkm_severity || 'medium';
            riskFactors.push({
              type: 'below_kkm',
              description: `Below KKM on "${assignment.title}" (${submission.score}/${assignment.kkm})`,
              severity,
              assignmentIds: [assignment.id],
              itemTitle: assignment.title,
            });
          }
        }
      });
      
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
  }, [enrollments, profiles, materials, materialViews, exams, examSubmissions, assignments, assignmentSubmissions, teacherCourses]);

  return {
    atRiskStudents,
    isLoading: !user || teacherCourses.length === 0,
    highRiskCount: atRiskStudents.filter(s => s.riskLevel === 'high').length,
    mediumRiskCount: atRiskStudents.filter(s => s.riskLevel === 'medium').length,
    lowRiskCount: atRiskStudents.filter(s => s.riskLevel === 'low').length,
  };
}
