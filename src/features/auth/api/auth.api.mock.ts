import { AuthAPI, Profile } from './auth.api';
import { User, Session } from '@supabase/supabase-js';

export class MockAuthAPI implements AuthAPI {
    private user: User | null = null;
    private session: Session | null = null;
    private profile: Profile | null = null;
    private role: string | null = null;
    private listeners: ((event: string, session: Session | null) => void)[] = [];

    constructor(initialData?: {
        user?: User | null;
        session?: Session | null;
        profile?: Profile | null;
        role?: string | null;
    }) {
        if (initialData) {
            this.user = initialData.user || null;
            this.session = initialData.session || null;
            this.profile = initialData.profile || null;
            this.role = initialData.role || null;
        }
    }

    async getSession() {
        return { data: { session: this.session }, error: null };
    }

    async getUser() {
        return { data: { user: this.user }, error: null };
    }

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        this.listeners.push(callback);
        return {
            data: {
                subscription: {
                    unsubscribe: () => {
                        this.listeners = this.listeners.filter(cb => cb !== callback);
                    }
                }
            }
        };
    }

    private triggerEvent(event: string, session: Session | null) {
        this.listeners.forEach(cb => cb(event, session));
    }

    async signInWithPassword(credentials: { email: string; password?: string }) {
        if (credentials.email === "test@test.com" && credentials.password === "password") {
            this.user = { id: "test-user-id", email: credentials.email } as User;
            this.session = { access_token: "mock-token", user: this.user } as Session;
            this.triggerEvent("SIGNED_IN", this.session);
            return { data: { user: this.user, session: this.session }, error: null };
        }
        return { data: { user: null, session: null }, error: new Error("Invalid credentials") };
    }

    async signOut() {
        this.user = null;
        this.session = null;
        this.triggerEvent("SIGNED_OUT", null);
        return { error: null };
    }

    async signUp(credentials: { email: string; password?: string; options?: any }) {
        this.user = { id: "test-user-id", email: credentials.email } as User;
        return { data: { user: this.user, session: null }, error: null };
    }

    async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
        return { data: {}, error: null };
    }

    async updateUser(attributes: any) {
        return { data: { user: this.user }, error: null };
    }

    async fetchProfile(userId: string) {
        return { data: this.profile, error: null };
    }

    async fetchUserRole(userId: string) {
        return { data: { role: this.role || 'student' }, error: null };
    }

    async updateLanguagePreference(userId: string, language: string) {
        if (this.profile) {
            this.profile.language_preference = language;
        }
        return { error: null };
    }
}

// For use in unit tests
export const mockAuthApi = new MockAuthAPI();
