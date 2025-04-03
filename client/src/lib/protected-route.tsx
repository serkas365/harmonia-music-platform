import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";

// Short timeout before redirecting to login to allow authentication to complete
const AUTH_CHECK_TIMEOUT = 500; // ms

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { appUser, isLoading: firebaseLoading, isAuthenticating } = useFirebaseAuth();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const isAuthenticated = appUser || user;
  const isInitialLoading = firebaseLoading || authLoading;

  // Handle authentication status changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isInitialLoading) {
      if (isAuthenticated) {
        // User is authenticated, show content immediately
        setShowContent(true);
        setShouldRedirect(false);
      } else if (!isAuthenticating) {
        // User is not authenticated and not in the process of authenticating
        // Give a small timeout before redirecting to auth page
        timeoutId = setTimeout(() => {
          if (!isAuthenticated && !isAuthenticating) {
            setShouldRedirect(true);
          }
        }, AUTH_CHECK_TIMEOUT);
      }
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isInitialLoading, isAuthenticated, isAuthenticating]);

  // Redirect to auth page if needed
  useEffect(() => {
    if (shouldRedirect) {
      navigate('/auth');
    }
  }, [shouldRedirect, navigate]);

  // Show a loading spinner during initial load
  if (isInitialLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Show the content, but might redirect later if auth check fails
  return (
    <Route path={path}>
      {shouldRedirect ? (
        <Redirect to="/auth" />
      ) : (
        <>
          <Component />
          {/* Show loading indicator if we're still authenticating */}
          {!isAuthenticated && isAuthenticating && (
            <div className="fixed top-4 right-4 z-50">
              <div className="bg-background/80 backdrop-blur-sm shadow-lg rounded-full p-2 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span className="text-sm font-medium">Authenticating...</span>
              </div>
            </div>
          )}
        </>
      )}
    </Route>
  );
}
