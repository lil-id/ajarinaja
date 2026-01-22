import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * 404 Not Found page component.
 * 
 * Displays a 404 error message when a user attempts to access a non-existent route.
 * Logs the attempted path to the console for debugging purposes.
 * 
 * @returns {JSX.Element} The rendered 404 page.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
