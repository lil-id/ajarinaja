import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  FileText,
  Users,
  BarChart2,
  Calendar,
  Bell,
  X,
  Eye,
  MessageSquare,
  GraduationCap,
  Menu,
  FolderOpen,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoContext } from '@/contexts/DemoContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DemoTour } from '@/components/DemoTour';

const teacherNavItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/demo/teacher' },
  { icon: BookOpen, label: 'Courses', path: '/demo/teacher/courses' },
  { icon: FileText, label: 'Exams', path: '/demo/teacher/exams' },
  { icon: ClipboardCheck, label: 'Assignments', path: '/demo/teacher/assignments' },
  { icon: FolderOpen, label: 'Materials', path: '/demo/teacher/materials' },
  { icon: Database, label: 'Question Bank', path: '/demo/teacher/question-bank' },
  { icon: Users, label: 'Students', path: '/demo/teacher/students' },
  { icon: BarChart2, label: 'Analytics', path: '/demo/teacher/analytics' },
  { icon: Calendar, label: 'Calendar', path: '/demo/teacher/calendar' },
  { icon: Bell, label: 'Announcements', path: '/demo/teacher/announcements' },
];

const studentNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/demo/student' },
  { icon: BookOpen, label: 'My Courses', path: '/demo/student/courses' },
  { icon: FileText, label: 'Exams', path: '/demo/student/exams' },
  { icon: ClipboardCheck, label: 'Assignments', path: '/demo/student/assignments' },
  { icon: BarChart2, label: 'Analytics', path: '/demo/student/analytics' },
  { icon: Calendar, label: 'Calendar', path: '/demo/student/calendar' },
  { icon: Bell, label: 'Notifications', path: '/demo/student/notifications' },
];

export default function DemoLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { demoRole, setDemoRole, exitDemo } = useDemoContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = demoRole === 'teacher' ? teacherNavItems : studentNavItems;

  const handleRoleSwitch = (role: 'teacher' | 'student') => {
    setDemoRole(role);
    navigate(role === 'teacher' ? '/demo/teacher' : '/demo/student');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">AjarinAja</span>
        </Link>
      </div>

      {/* Demo Badge */}
      <div className="px-4 py-3 bg-primary/10 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Demo Mode</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            Interactive Preview
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Explore all features - saving is disabled
        </p>
      </div>

      {/* Role Switcher */}
      <div className="p-4 border-b">
        <p className="text-xs text-muted-foreground mb-2">View as:</p>
        <div className="flex gap-2">
          <Button
            variant={demoRole === 'teacher' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => handleRoleSwitch('teacher')}
          >
            Teacher
          </Button>
          <Button
            variant={demoRole === 'student' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => handleRoleSwitch('student')}
          >
            Student
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Exit Demo */}
      <div className="p-4 border-t space-y-2">
        <Button variant="outline" className="w-full" onClick={exitDemo}>
          <X className="h-4 w-4 mr-2" />
          Exit Demo
        </Button>
        <Button
          className="w-full"
          onClick={() => window.open('https://wa.me/6282293675164?text=Hi,%20I%20am%20interested%20in%20AjarinAja%20LMS!', '_blank')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact for Full Demo
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <DemoTour role={demoRole} />
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
          <NavContent />
        </aside>

        {/* Mobile Header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold">AjarinAja</span>
              <Badge variant="secondary" className="text-xs">Demo</Badge>
            </div>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
