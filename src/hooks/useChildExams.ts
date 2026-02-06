/**
 * @fileoverview Hook for fetching a specific child's exam results
 * @description Allows parents to view their child's exam submissions and scores
 * 
 * @module hooks/useChildExams
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch exam results for a specific child
 * 
 * @param {string | undefined} childUserId - The user ID of the child
 * @param {string | undefined} courseId - Optional course ID to filter by specific course
 * @returns {Object} Exam data and state
 * @returns {Array} exams - Array of exams with submission and scores
 * @returns {Object} summary - Summary statistics (completed, average score)
 * @returns {boolean} isLoading - Loading state
 * @returns {Error | null} error - Error object if fetch failed
 * 
 * @example
 * ```tsx
 * const { exams, summary, isLoading } = useChildExams(childId);
 * 
 * return (
 *   <div>
 *     <p>Average Score: {summary.averageScore}%</p>
 *     {exams.map(exam => (
 *       <ExamResultCard key={exam.id} exam={exam} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useChildExams(
    childUserId: string | undefined,
    courseId?: string | undefined
) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['child-exams', childUserId, courseId],
        queryFn: async () => {
            if (!childUserId) return { exams: [], summary: null };

            // Get child's enrollments
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
                return {
                    exams: [],
                    summary: { total: 0, completed: 0, graded: 0, averageScore: 0, averagePercentage: 0 },
                };
            }

            const courseIds = enrollments.map((e: any) => e.course_id);

            // Fetch exams for enrolled courses
            const { data: exams, error: examsError } = await supabase
                .from('exams')
                .select(`
          id,
          title,
          description,
          course_id,
          duration,
          total_points,
          status,
          start_date,
          end_date,
          created_at,
          courses (
            title
          )
        `)
                .in('course_id', courseIds)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (examsError) throw examsError;

            // Fetch exam submissions for this student
            const { data: submissions, error: submissionsError } = await supabase
                .from('exam_submissions')
                .select('*')
                .eq('student_id', childUserId);

            if (submissionsError) throw submissionsError;

            // Create submission map
            const submissionMap = new Map(
                submissions.map((sub: any) => [sub.exam_id, sub])
            );

            // Merge exams with submissions
            const enrichedExams = exams.map((exam: any) => {
                const submission = submissionMap.get(exam.id);
                const percentage = submission && exam.total_points > 0
                    ? Math.round((submission.score / exam.total_points) * 100)
                    : null;

                return {
                    ...exam,
                    course_title: exam.courses?.title,
                    submission: submission || null,
                    submission_status: submission
                        ? submission.graded
                            ? 'graded'
                            : 'submitted'
                        : new Date(exam.end_date) < new Date()
                            ? 'missed'
                            : 'available',
                    score: submission?.score || null,
                    percentage,
                };
            });

            // Calculate summary
            const gradedExams = enrichedExams.filter((e: any) => e.submission?.graded);

            const summary = {
                total: enrichedExams.length,
                completed: enrichedExams.filter((e: any) => e.submission).length,
                graded: gradedExams.length,
                averageScore:
                    gradedExams.length > 0
                        ? Math.round(
                            gradedExams.reduce((sum: number, e: any) => sum + (e.score || 0), 0) /
                            gradedExams.length
                        )
                        : 0,
                averagePercentage:
                    gradedExams.length > 0
                        ? Math.round(
                            gradedExams.reduce((sum: number, e: any) => sum + (e.percentage || 0), 0) /
                            gradedExams.length
                        )
                        : 0,
            };

            return {
                exams: enrichedExams,
                summary,
            };
        },
        enabled: !!childUserId,
    });

    return {
        exams: data?.exams || [],
        summary: data?.summary || {
            total: 0,
            completed: 0,
            graded: 0,
            averageScore: 0,
            averagePercentage: 0,
        },
        isLoading,
        error,
    };
}
