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
  type: 'no_material_views' | 'missed_deadline' | 'low_score' | 'no_exam_submissions';
  description: string;
  severity: 'high' | 'medium' | 'low';
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

  // Calculate at-risk students
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
      
      // Check for no material views
      const courseMaterials = materials.filter(m => m.course_id === courseId);
      const studentMaterialViews = materialViews.filter(
        (v: any) => v.student_id === enrollment.student_id && v.course_materials?.course_id === courseId
      );
      
      if (courseMaterials.length > 0 && studentMaterialViews.length === 0) {
        riskFactors.push({
          type: 'no_material_views',
          description: `Has not viewed any of ${courseMaterials.length} course materials`,
          severity: 'medium',
        });
      } else if (courseMaterials.length > 0 && studentMaterialViews.length < courseMaterials.length / 2) {
        riskFactors.push({
          type: 'no_material_views',
          description: `Viewed only ${studentMaterialViews.length} of ${courseMaterials.length} materials`,
          severity: 'low',
        });
      }
      
      // Check for no exam submissions
      const courseExams = exams.filter(e => e.course_id === courseId);
      const studentExamSubmissions = examSubmissions.filter(
        (s: any) => s.student_id === enrollment.student_id && s.exams?.course_id === courseId
      );
      
      if (courseExams.length > 0 && studentExamSubmissions.length === 0) {
        riskFactors.push({
          type: 'no_exam_submissions',
          description: `Has not submitted any of ${courseExams.length} exams`,
          severity: 'high',
        });
      }
      
      // Check for low scores
      const gradedSubmissions = studentExamSubmissions.filter((s: any) => s.graded && s.score !== null);
      if (gradedSubmissions.length > 0) {
        const avgScore = gradedSubmissions.reduce((sum: number, s: any) => {
          const totalPoints = s.exams?.total_points || 100;
          return sum + ((s.score / totalPoints) * 100);
        }, 0) / gradedSubmissions.length;
        
        if (avgScore < 50) {
          riskFactors.push({
            type: 'low_score',
            description: `Average exam score is ${avgScore.toFixed(0)}%`,
            severity: 'high',
          });
        } else if (avgScore < 70) {
          riskFactors.push({
            type: 'low_score',
            description: `Average exam score is ${avgScore.toFixed(0)}%`,
            severity: 'medium',
          });
        }
      }
      
      // Check for missed deadlines (late or missing assignment submissions)
      const now = new Date();
      const courseAssignments = assignments.filter(a => a.course_id === courseId && new Date(a.due_date) < now);
      const studentAssignmentSubmissions = assignmentSubmissions.filter(
        (s: any) => s.student_id === enrollment.student_id && s.assignments?.course_id === courseId
      );
      
      const missedAssignments = courseAssignments.filter(
        a => !studentAssignmentSubmissions.some((s: any) => s.assignment_id === a.id)
      );
      
      if (missedAssignments.length > 0) {
        riskFactors.push({
          type: 'missed_deadline',
          description: `Missed ${missedAssignments.length} assignment deadline${missedAssignments.length > 1 ? 's' : ''}`,
          severity: missedAssignments.length >= 2 ? 'high' : 'medium',
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
  }, [enrollments, profiles, materials, materialViews, exams, examSubmissions, assignments, assignmentSubmissions, teacherCourses]);

  return {
    atRiskStudents,
    isLoading: !user || teacherCourses.length === 0,
    highRiskCount: atRiskStudents.filter(s => s.riskLevel === 'high').length,
    mediumRiskCount: atRiskStudents.filter(s => s.riskLevel === 'medium').length,
    lowRiskCount: atRiskStudents.filter(s => s.riskLevel === 'low').length,
  };
}
