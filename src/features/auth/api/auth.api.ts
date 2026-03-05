import { User, Session } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    user_id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    language_preference: string;
}

export interface AuthAPI {
    /** Gets the current session */
    getSession(): Promise<{ data: { session: Session | null }; error: Error | null }>;

    /** Gets the current user */
    getUser(): Promise<{ data: { user: User | null }; error: Error | null }>;

    /** Sets up a listener for auth state changes */
    onAuthStateChange(
        callback: (event: string, session: Session | null) => void
    ): { data: { subscription: { unsubscribe: () => void } } };

    /** Signs a user in */
    signInWithPassword(credentials: { email: string; password?: string }): Promise<{ data: { user: User | null; session: Session | null }; error: Error | null }>;

    /** Signs out the current user */
    signOut(): Promise<{ error: Error | null }>;

    /** Signs up a new user */
    signUp(credentials: { email: string; password?: string; options?: any }): Promise<{ data: { user: User | null; session: Session | null }; error: Error | null }>;

    /** Sends a password reset email */
    resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ data: any; error: Error | null }>;

    /** Updates user details */
    updateUser(attributes: any): Promise<{ data: { user: User | null }; error: Error | null }>;

    /** Fetches a user profile from the database */
    fetchProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }>;

    /** Fetches a user's role from the database */
    fetchUserRole(userId: string): Promise<{ data: { role: string } | null; error: Error | null }>;

    /** Updates language preference */
    updateLanguagePreference(userId: string, language: string): Promise<{ error: Error | null }>;
}
