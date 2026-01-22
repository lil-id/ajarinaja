import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'teacher' | 'student';
}

/**
 * Higher-order component to protect routes based on authentication and role.
 * Redirects to login if unauthenticated or appropriate dashboard if unauthorized.
 * 
 * @param {ProtectedRouteProps} props - Component props.
 * @returns {JSX.Element | null} The protected content or null while redirecting/loading.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      } else if (requiredRole && role !== requiredRole) {
        // Redirect to correct dashboard based on actual role
        navigate(role === 'teacher' ? '/teacher' : '/student');
      }
    }
  }, [user, role, isLoading, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
