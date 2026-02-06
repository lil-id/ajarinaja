/**
 * @fileoverview Hook for searching students by name or email
 * @description Used by parents to find their children when adding them
 * 
 * @module hooks/useSearchStudents
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to search for students by name or email
 * 
 * @param {string} searchQuery - The search term (name or email)
 * @param {boolean} enabled - Whether the query should run (default: true when query length >= 2)
 * @returns {Object} Search results and state
 * @returns {Array} students - Array of matching student profiles
 * @returns {boolean} isLoading - Loading state
 * @returns {Error | null} error - Error object if search failed
 * 
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const { students, isLoading } = useSearchStudents(query);
 * 
 * return (
 *   <div>
 *     <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *     {students.map(student => (
 *       <StudentCard key={student.user_id} student={student} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useSearchStudents(searchQuery: string, enabled: boolean = true) {
    const trimmedQuery = searchQuery.trim();
    const shouldSearch = enabled && trimmedQuery.length >= 2;

    const { data: students = [], isLoading, error } = useQuery({
        queryKey: ['search-students', trimmedQuery],
        queryFn: async () => {
            if (!trimmedQuery) return [];

            // First, get all student user IDs from user_roles
            const { data: studentRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'student');

            if (rolesError) throw rolesError;
            if (!studentRoles || studentRoles.length === 0) return [];

            const studentIds = studentRoles.map(r => r.user_id);

            // Then search profiles for those students
            const { data, error } = await supabase
                .from('profiles')
                .select('user_id, name, email, avatar_url')
                .in('user_id', studentIds)
                .or(`name.ilike.%${trimmedQuery}%,email.ilike.%${trimmedQuery}%`)
                .limit(20);

            if (error) throw error;

            return data.map((profile: any) => ({
                user_id: profile.user_id,
                name: profile.name,
                email: profile.email,
                avatar_url: profile.avatar_url,
            }));
        },
        enabled: shouldSearch,
        staleTime: 30000, // Cache for 30 seconds
    });

    return {
        students,
        isLoading: shouldSearch ? isLoading : false,
        error,
    };
}
