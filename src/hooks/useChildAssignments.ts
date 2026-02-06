/**
 * @fileoverview Hook for fetching a specific child's assignment submissions
 * @description Allows parents to view their child's assignments and submission status
 * 
 * @module hooks/useChildAssignments
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch assignments and submissions for a specific child
 * 
 * @param {string | undefined} childUserId - The user ID of the child
 * @param {string | undefined} courseId - Optional course ID to filter by specific course
 * @returns {Object} Assignment data and state
 * @returns {Array} assignments - Array of assignments with submission status
 * @returns {Object} summary - Summary statistics (completed, pending, graded)
 * @returns {boolean} isLoading - Loading state
 * @returns {Error | null} error - Error object if fetch failed
 * 
 * @example
 * ```tsx
 * const { assignments, summary, isLoading } = useChildAssignments(childId);
 * 
 * return (
 *   <div>
 *     <p>Completed: {summary.completed}/{summary.total}</p>
 *     {assignments.map(assignment => (
 *       <AssignmentCard key={assignment.id} assignment={assignment} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useChildAssignments(
    childUserId: string | undefined,
    courseId?: string | undefined
) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['child-assignments', childUserId, courseId],
        queryFn: async () => {
            if (!childUserId) return { assignments: [], summary: null };

            // First, get the child's enrollments to know which assignments they should see
            let enrollmentQuery = supabase
                .from('enrollments')
                .select('course_id')
                .eq('student_id', childUserId);

            if (courseId) {
                enrollmentQuery = enrollmentQuery.eq('course_id', courseId);
            }

            const { data: enrollments, error: enrollmentError } = await enrollmentQuery;

            if (enrollmentError) throw enrollmentError;

            if (!enrollments || enrollments.length === 0) {
                return { assignments: [], summary: { total: 0, completed: 0, pending: 0, graded: 0, averageScore: 0 } };
            }

            const courseIds = enrollments.map((e: any) => e.course_id);

            // Fetch assignments for enrolled courses
            const { data: assignments, error: assignmentsError } = await supabase
                .from('assignments')
                .select(`
          id,
          title,
          description,
          course_id,
          due_date,
          max_points,
          status,
          created_at,
          assignment_type,
          courses (
            title
          )
        `)
                .in('course_id', courseIds)
                .order('due_date', { ascending: false });

            if (assignmentsError) throw assignmentsError;

            // Fetch file-based submissions
            const { data: fileSubmissions, error: fileSubmissionsError } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('student_id', childUserId);

            if (fileSubmissionsError) throw fileSubmissionsError;

            // Fetch question-based (quiz) submissions
            const { data: quizSubmissions, error: quizSubmissionsError } = await supabase
                .from('assignment_question_submissions')
                .select('*')
                .eq('student_id', childUserId);

            if (quizSubmissionsError) throw quizSubmissionsError;

            // Create maps for efficient lookup
            const fileSubmissionMap = new Map(
                fileSubmissions.map((sub: any) => [sub.assignment_id, sub])
            );
            const quizSubmissionMap = new Map(
                quizSubmissions.map((sub: any) => [sub.assignment_id, sub])
            );

            const enrichedAssignments = assignments.map((assignment: any) => {
                // Determine which submission to use based on assignment type or presence
                const fileSub = fileSubmissionMap.get(assignment.id);
                const quizSub = quizSubmissionMap.get(assignment.id);

                // Prioritize quiz submission if assignment type is 'questions', otherwise fallback or use file sub
                // If assignment_type is missing (legacy), try to guess based on existing submission
                const submission = (assignment.assignment_type === 'questions' || quizSub)
                    ? quizSub
                    : fileSub;

                return {
                    ...assignment,
                    course_title: assignment.courses?.title,
                    submission: submission || null,
                    total_points: assignment.max_points,
                    submission_status: submission
                        ? submission.graded
                            ? 'graded'
                            : 'submitted'
                        : new Date(assignment.due_date) < new Date()
                            ? 'overdue'
                            : 'pending',
                    score: submission?.score || null,
                };
            });

            // Calculate summary
            const summary = {
                total: enrichedAssignments.length,
                completed: enrichedAssignments.filter((a: any) => a.submission).length,
                pending: enrichedAssignments.filter((a: any) => !a.submission && new Date(a.due_date) >= new Date()).length,
                overdue: enrichedAssignments.filter((a: any) => !a.submission && new Date(a.due_date) < new Date()).length,
                graded: enrichedAssignments.filter((a: any) => a.submission?.graded).length,
                averageScore:
                    enrichedAssignments.filter((a: any) => a.submission?.graded).length > 0
                        ? Math.round(
                            enrichedAssignments
                                .filter((a: any) => a.submission?.graded)
                                .reduce((sum: number, a: any) => sum + (a.score || 0), 0) /
                            enrichedAssignments.filter((a: any) => a.submission?.graded).length
                        )
                        : 0,
            };

            return {
                assignments: enrichedAssignments,
                summary,
            };
        },
        enabled: !!childUserId,
    });

    return {
        assignments: data?.assignments || [],
        summary: data?.summary || {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            graded: 0,
            averageScore: 0,
        },
        isLoading,
        error,
    };
}
