import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      toast.success('Welcome back!');
      // Redirect based on role
      const user = email.includes('teacher') ? 'teacher' : 'student';
      navigate(user === 'teacher' ? '/teacher' : '/student');
    } else {
      toast.error('Invalid credentials. Try one of the demo accounts.');
    }
  };

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

      {/* Right Panel - Login Form */}
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
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>Choose your role and enter your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="teacher" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="teacher">Teacher</TabsTrigger>
                  <TabsTrigger value="student">Student</TabsTrigger>
                </TabsList>
                
                <TabsContent value="teacher">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher-email">Email</Label>
                      <Input
                        id="teacher-email"
                        type="email"
                        placeholder="teacher@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-password">Password</Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sign In as Teacher
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Demo: teacher@example.com (any password)
                    </p>
                  </form>
                </TabsContent>
                
                <TabsContent value="student">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-email">Email</Label>
                      <Input
                        id="student-email"
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password">Password</Label>
                      <Input
                        id="student-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sign In as Student
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Demo: student@example.com (any password)
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <button className="text-secondary font-semibold hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
