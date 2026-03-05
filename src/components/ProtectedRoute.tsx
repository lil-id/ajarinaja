import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'teacher' | 'student' | 'parent' | 'operator';
}

/**
 * Higher-order component to protect routes based on authentication and role.
 * Redirects to login if unauthenticated or appropriate dashboard if unauthorized.
 * Preserves the current route when redirecting to login for post-auth navigation.
 * 
 * @param {ProtectedRouteProps} props - Component props.
 * @returns {JSX.Element | null} The protected content or null while redirecting/loading.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Pass current location so Login can redirect back after auth
        navigate('/login', { state: { from: location.pathname }, replace: true });
      } else if (requiredRole && role && role !== requiredRole) {
        // Redirect to appropriate dashboard based on user's role
        const redirectPath =
          role === 'teacher' ? '/teacher' :
            role === 'student' ? '/student' :
              role === 'parent' ? '/parent' :
                role === 'operator' ? '/operator' : '/';
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, role, isLoading, requiredRole, navigate, location.pathname]);

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
