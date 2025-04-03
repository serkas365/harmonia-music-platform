import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth, loginWithEmailPassword, registerWithEmailPassword, signInWithGoogle, logout, handleRedirectResult } from "../lib/firebase";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";

// Extend Window interface to add our global methods
declare global {
  interface Window {
    cancelAuthenticationProcess?: () => void;
  }
}

// Using inline type definition instead of importing from shared/schema
type AppUser = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  role: 'user' | 'artist' | 'admin';
  artistId?: number;
  subscriptionTier: 'free' | 'premium' | 'ultimate';
  subscriptionEndDate?: Date;
  firebaseUid?: string;
  createdAt: Date;
};

// Types for the auth context
interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  isLoading: boolean;
  isAuthenticating: boolean; // Added to distinguish between initial loading and ongoing auth
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Track ongoing authentication
  const [serverAuthInitiated, setServerAuthInitiated] = useState(false);
  const { toast } = useToast();

  // Process server authentication in a separate effect to avoid blocking UI
  useEffect(() => {
    let isMounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const performServerAuth = async () => {
      if (!auth.currentUser || !isMounted) return;
      
      // Set a timeout to prevent indefinite authentication state
      authTimeout = setTimeout(() => {
        if (isMounted && isAuthenticating) {
          setIsAuthenticating(false);
          setIsLoading(false);
          setServerAuthInitiated(false);
          // Emit an event that the auth page can listen for to show the auth failed message
          window.dispatchEvent(new CustomEvent('auth:timeout'));
          toast({
            title: "Authentication Timeout",
            description: "Authentication is taking longer than expected. Please try again.",
            variant: "destructive",
          });
        }
      }, 10000); // 10 second timeout
      
      try {
        const idToken = await auth.currentUser.getIdToken();
        
        const response = await apiRequest(
          "POST", 
          "/api/auth/verify-token", 
          { idToken }
        );
        
        if (response.ok && isMounted) {
          const userData = await response.json();
          setAppUser(userData);
        } else if (isMounted) {
          // If server authentication fails, log out from Firebase
          await auth.signOut();
          toast({
            title: "Authentication Error",
            description: "Could not authenticate with the server.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Server authentication error:", error);
        if (isMounted) {
          toast({
            title: "Authentication Error",
            description: "An error occurred during authentication.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          clearTimeout(authTimeout);
          setIsLoading(false);
          setIsAuthenticating(false);
          setServerAuthInitiated(false);
        }
      }
    };

    if (firebaseUser && !appUser && !serverAuthInitiated) {
      setServerAuthInitiated(true);
      performServerAuth();
    }

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
    };
  }, [firebaseUser, appUser, serverAuthInitiated, toast]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    let isMounted = true;
    
    // Quickly set initial loading to false so UI renders faster
    const initialLoadTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 500);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      
      // Update firebase user immediately to improve perceived performance
      setFirebaseUser(user);
      
      if (!user) {
        setAppUser(null);
        setIsLoading(false);
        setIsAuthenticating(false);
      }
      // Server auth is handled in the separate effect
    });

    // Check for redirect result on component mount - don't block on this
    handleRedirectResult()
      .then((user) => {
        if (user && isMounted) {
          setFirebaseUser(user);
        }
      })
      .catch((error) => {
        console.error("Error handling redirect:", error);
        if (isMounted) {
          setIsAuthenticating(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(initialLoadTimeout);
      unsubscribe();
    };
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setIsAuthenticating(true);
      
      // Set a timeout to automatically reset the authenticating state
      const authTimeout = setTimeout(() => {
        setIsAuthenticating(false);
        toast({
          title: "Login Timeout",
          description: "Login is taking longer than expected. You can try again.",
          variant: "destructive",
        });
      }, 8000); // 8 second timeout
      
      await loginWithEmailPassword(email, password);
      clearTimeout(authTimeout);
      // Firebase auth listener will update the state
    } catch (error: any) {
      setIsAuthenticating(false);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Register with email and password
  const register = async (email: string, password: string, username: string) => {
    try {
      setIsAuthenticating(true);
      
      // Set a timeout to automatically reset the authenticating state
      const authTimeout = setTimeout(() => {
        setIsAuthenticating(false);
        toast({
          title: "Registration Timeout",
          description: "Registration is taking longer than expected. You can try again.",
          variant: "destructive",
        });
      }, 8000); // 8 second timeout
      
      await registerWithEmailPassword(email, password);
      clearTimeout(authTimeout);
      // Firebase auth listener will update the state
    } catch (error: any) {
      setIsAuthenticating(false);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogleAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      // For Google login, we'll also set an authentication timeout
      // This may be cleared if the page is redirected away, but will help if there's an issue
      // before redirect occurs
      setTimeout(() => {
        setIsAuthenticating(false);
      }, 5000);
      
      signInWithGoogle();
      // Redirect will happen, and handleRedirectResult will be called on return
    } catch (error: any) {
      setIsAuthenticating(false);
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to login with Google. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Add a method to allow cancellation of authentication from outside
  window.cancelAuthenticationProcess = () => {
    setIsAuthenticating(false);
    setIsLoading(false);
    setServerAuthInitiated(false);
    
    // Emit event for auth-page to capture
    window.dispatchEvent(new CustomEvent('auth:cancelled'));
  };

  // Logout
  const logoutUser = async () => {
    try {
      setIsAuthenticating(true);
      await logout();
      setAppUser(null);
      // Firebase auth state listener will handle the rest
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const contextValue: AuthContextType = {
    firebaseUser,
    appUser,
    isLoading,
    isAuthenticating,
    login,
    register,
    loginWithGoogle: loginWithGoogleAuth,
    logoutUser,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication
export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within an AuthProvider");
  }
  return context;
};