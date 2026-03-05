import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  User,
  Megaphone,
  FolderOpen,
  Award,
  ClipboardList,
  Bell,
  Menu,
  X,
  BarChart3,
  Calendar,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const StudentLayout = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: t('nav.dashboard'), href: '/student', icon: Home },
    { name: t('nav.courses'), href: '/student/courses', icon: BookOpen },
    { name: t('nav.exploreCourses'), href: '/student/explore', icon: GraduationCap },
    { name: t('nav.calendar'), href: '/student/calendar', icon: Calendar },
    { name: t('attendance.title') || 'Attendance', href: '/student/attendance', icon: ClipboardList },
    { name: t('nav.assignments'), href: '/student/assignments', icon: ClipboardList },
    { name: t('nav.exams'), href: '/student/exams', icon: FileText },
    { name: t('nav.materials'), href: '/student/materials', icon: FolderOpen },
    { name: t('nav.reportCards'), href: '/student/report-cards', icon: FileText },
    { name: t('nav.notifications'), href: '/student/notifications', icon: Bell },
    { name: t('nav.badges'), href: '/student/badges', icon: Award },
    { name: t('nav.analytics'), href: '/student/analytics', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-sidebar transform transition-all duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "lg:w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                sidebarCollapsed && "lg:justify-center"
              )}
              onClick={() => navigate('/student')}
            >
              {sidebarCollapsed ? (
                <img src="/ajarinaja-logo-square.png" alt="AjarinAja" className="w-10 h-10 flex-shrink-0 brightness-0 invert" />
              ) : (
                <img src="/ajarinaja-logo.png" alt="AjarinAja" className="h-10 w-auto brightness-0 invert" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-hidden scroll-smooth">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    sidebarCollapsed && "lg:justify-center lg:px-2"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-2 border-t border-sidebar-border">
            <button
              onClick={() => {
                navigate('/student/settings');
                setSidebarOpen(false);
              }}
              title={sidebarCollapsed ? t('common.settings') : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                location.pathname === '/student/settings'
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                sidebarCollapsed && "lg:justify-center lg:px-2"
              )}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{t('common.settings')}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell basePath="/student" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 h-auto py-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                        {profile?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-foreground">{profile?.name || t('auth.student')}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/student/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    {t('common.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/student/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t('common.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
