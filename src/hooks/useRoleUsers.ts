import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoleUser {
    id: string; // user_id
    name: string;
    email: string;
    avatar_url: string | null;
}

/**
 * Hook to fetch all users with a specific role
 * Primarily used by Operators to get a list of teachers for reassignment.
 */
export function useRoleUsers(roleToFetch: 'teacher' | 'student' | 'parent' | 'operator') {
    const { user, role } = useAuth();

    return useQuery({
        queryKey: ['role-users', roleToFetch],
        queryFn: async () => {
            // 1. Get user_ids for the specific role
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', roleToFetch as unknown as 'teacher' | 'student' | 'parent');

            if (rolesError) throw rolesError;

            const userIds = userRoles?.map((ur) => ur.user_id) || [];

            if (userIds.length === 0) return [];

            // 2. Get profiles for those user_ids
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, name, email, avatar_url')
                .in('user_id', userIds);

            if (profilesError) throw profilesError;

            return (profiles || []).map((p) => ({
                id: p.user_id,
                name: p.name,
                email: p.email,
                avatar_url: p.avatar_url,
            })) as RoleUser[];
        },
        // Only fetch if user is logged in
        enabled: !!user,
    });
}
