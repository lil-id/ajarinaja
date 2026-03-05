import { supabase } from '@/integrations/supabase/client';
import { AuthAPI, Profile } from './auth.api';

export class BackendAuthAPI implements AuthAPI {
    async getSession() {
        return await supabase.auth.getSession();
    }

    async getUser() {
        return await supabase.auth.getUser();
    }

    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }

    async signInWithPassword(credentials: { email: string; password?: string }) {
        if (!credentials.password) {
            return { data: { user: null, session: null }, error: new Error("Password is required") };
        }
        return await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });
    }

    async signOut() {
        return await supabase.auth.signOut();
    }

    async signUp(credentials: { email: string; password?: string; options?: any }) {
        if (!credentials.password) {
            return { data: { user: null, session: null }, error: new Error("Password is required") };
        }
        return await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: credentials.options,
        });
    }

    async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
        return await supabase.auth.resetPasswordForEmail(email, options);
    }

    async updateUser(attributes: any) {
        return await supabase.auth.updateUser(attributes);
    }

    async fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        return { data: data as Profile | null, error };
    }

    async fetchUserRole(userId: string) {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

        return { data, error };
    }

    async updateLanguagePreference(userId: string, language: string) {
        const { error } = await supabase
            .from('profiles')
            .update({ language_preference: language })
            .eq('user_id', userId);

        return { error };
    }
}

export const authApi = new BackendAuthAPI();
