import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authApi } from '../api/auth.api.backend';
import { Profile } from '../api/auth.api';
import i18n from '@/i18n';

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    role: 'teacher' | 'student' | 'parent' | 'operator' | null;
    signUp: (email: string, password: string, name: string, role: 'teacher' | 'student' | 'parent' | 'operator') => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateLanguagePreference: (language: string) => Promise<void>;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Context provider for authentication state and methods.
 * Handles user sessions, profile fetching, and role management 
 * utilizing the abstract AuthAPI.
 * 
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Child components to render.
 * @returns {JSX.Element} The provider component.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [role, setRole] = useState<'teacher' | 'student' | 'parent' | 'operator' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Note: we're tightly coupling to authApi instance right now, 
    // but could inject it via props for testing isolation.
    const api = authApi;

    const fetchProfile = async (userId: string) => {
        try {
            const { data: profileData } = await api.fetchProfile(userId);

            if (profileData) {
                setProfile(profileData);
                // Apply saved language preference
                if (profileData.language_preference) {
                    i18n.changeLanguage(profileData.language_preference);
                }
            }

            const { data: roleData } = await api.fetchUserRole(userId);

            if (roleData) {
                setRole(roleData.role as 'teacher' | 'student' | 'parent' | 'operator');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const updateLanguagePreference = async (language: string) => {
        if (!user) return;

        try {
            const { error } = await api.updateLanguagePreference(user.id, language);

            if (!error && profile) {
                setProfile({ ...profile, language_preference: language });
            }
        } catch (error) {
            console.error('Error updating language preference:', error);
        }
    };

    useEffect(() => {
        // Set up auth state listener FIRST
        const { data: { subscription } } = api.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Defer profile fetch to avoid deadlock
                    setTimeout(() => {
                        fetchProfile(session.user.id);
                    }, 0);
                } else {
                    setProfile(null);
                    setRole(null);
                }
                setIsLoading(false);
            }
        );

        // THEN check for existing session
        api.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, name: string, role: 'teacher' | 'student' | 'parent' | 'operator') => {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await api.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    name,
                    role,
                },
            },
        });

        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await api.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const signOut = async () => {
        await api.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            profile,
            role,
            signUp,
            signIn,
            signOut,
            updateLanguagePreference,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}
