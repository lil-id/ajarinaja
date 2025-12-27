import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Loader2, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, role } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name, selectedRole);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! You can now sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          // Navigate based on role - will be set after auth state changes
        }
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in with a role
  if (role) {
    navigate(role === 'teacher' ? '/teacher' : '/student');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">EduExam</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Welcome to the Future of Education
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Join our platform to create, manage, and take exams with ease. 
            Designed for both teachers and students.
          </p>
          
          <div className="grid gap-4 pt-6">
            <div className="flex items-center gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-secondary/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">For Teachers</h3>
                <p className="text-sm text-primary-foreground/70">Create courses & exams</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-secondary/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">For Students</h3>
                <p className="text-sm text-primary-foreground/70">Enroll & take exams</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2024 EduExam. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EduExam</span>
          </div>

          <Card className="shadow-xl border-0 bg-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </CardTitle>
              <CardDescription>
                {isSignUp ? 'Join EduExam to get started' : 'Welcome back to EduExam'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>I am a</Label>
                      <RadioGroup 
                        value={selectedRole} 
                        onValueChange={(v) => setSelectedRole(v as 'teacher' | 'student')}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <RadioGroupItem value="teacher" id="teacher" />
                          <Label htmlFor="teacher" className="cursor-pointer flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Teacher
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <RadioGroupItem value="student" id="student" />
                          <Label htmlFor="student" className="cursor-pointer flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Student
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="password">Password</Label>
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
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-secondary font-semibold hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
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
