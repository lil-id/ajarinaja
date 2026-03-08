import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, BookOpen, Users, UserCircle, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/**
 * Login/Signup page component.
 * 
 * Handles user authentication (sign in and sign up) using email and password.
 * Allows users to choose between 'student' and 'teacher' roles during sign up.
 * 
 * Features:
 * - Toggle between login and signup forms
 * - Form validation
 * - Role selection for new accounts
 * - Redirects authenticated users based on their role
 * 
 * @returns {JSX.Element} The rendered Login/Signup page.
 */
const Login = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'parent' | 'operator'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, role } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          toast.error(t('validation.required'));
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name, selectedRole);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t('auth.checkEmailConfirmation'), {
            duration: 6000, // Show for 6 seconds
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t('auth.welcomeBack'));
        }
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in with a role (only when on /login page)
  useEffect(() => {
    if (role && location.pathname === '/login') {
      // Check for a redirect path from state, otherwise use default dashboard
      const from = (location.state as { from?: string })?.from;
      const defaultPath =
        role === 'teacher' ? '/teacher' :
          role === 'parent' ? '/parent' :
            role === 'operator' ? '/operator' : '/student';
      navigate(from || defaultPath, { replace: true });
    }
  }, [role, navigate, location]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <img src="/ajarinaja-logo.png" alt="AjarinAja" className="h-12 w-auto brightness-0 invert" />
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-lg text-primary-foreground/80">
            {t('landing.platformDescription')}
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-6">
            {/* Teacher Card */}
            <div className="flex items-start gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <div className="w-10 h-10 bg-secondary/30 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground leading-none mb-1.5">{t('auth.teacher')}</h3>
                <p className="text-xs text-primary-foreground/70 leading-snug">{t('landing.teacherDesc')}</p>
              </div>
            </div>

            {/* Student Card */}
            <div className="flex items-start gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <div className="w-10 h-10 bg-secondary/30 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground leading-none mb-1.5">{t('auth.student')}</h3>
                <p className="text-xs text-primary-foreground/70 leading-snug">{t('landing.studentDesc')}</p>
              </div>
            </div>

            {/* Parent Card */}
            <div className="flex items-start gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <div className="w-10 h-10 bg-secondary/30 rounded-lg flex items-center justify-center shrink-0">
                <UserCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground leading-none mb-1.5">{t('auth.parent')}</h3>
                <p className="text-xs text-primary-foreground/70 leading-snug">{t('landing.parentDesc')}</p>
              </div>
            </div>

            {/* Operator Card */}
            <div className="flex items-start gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <div className="w-10 h-10 bg-secondary/30 rounded-lg flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground leading-none mb-1.5">{t('operator.roleLabel')}</h3>
                <p className="text-xs text-primary-foreground/70 leading-snug">{t('landing.operatorDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2024 AjarinAja. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <img src="/ajarinaja-logo.png" alt="AjarinAja" className="h-10 w-auto" />
          </div>

          <Card className="shadow-xl border-0 bg-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {isSignUp ? t('auth.signUp') : t('auth.signIn')}
              </CardTitle>
              <CardDescription>
                {isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('auth.name')}</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>{t('auth.role')}</Label>
                      <RadioGroup
                        value={selectedRole}
                        onValueChange={(v) => setSelectedRole(v as 'teacher' | 'student' | 'parent' | 'operator')}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <RadioGroupItem value="teacher" id="teacher" />
                          <Label htmlFor="teacher" className="cursor-pointer flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {t('auth.teacher')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <RadioGroupItem value="student" id="student" />
                          <Label htmlFor="student" className="cursor-pointer flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {t('auth.student')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <RadioGroupItem value="parent" id="parent" />
                          <Label htmlFor="parent" className="cursor-pointer flex items-center gap-2">
                            <UserCircle className="w-4 h-4" />
                            {t('auth.parent')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <RadioGroupItem value="operator" id="operator" />
                          <Label htmlFor="operator" className="cursor-pointer flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {t('operator.roleLabel')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    {!isSignUp && (
                      <Link to="/forgot-password" className="text-xs text-secondary hover:underline">
                        {t('auth.forgotPassword')}
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSignUp ? t('auth.signUp') : t('auth.signIn')}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-secondary font-semibold hover:underline"
                >
                  {isSignUp ? t('auth.signIn') : t('auth.signUp')}
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
