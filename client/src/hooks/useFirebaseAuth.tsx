import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth, loginWithEmailPassword, registerWithEmailPassword, signInWithGoogle, logout, handleRedirectResult } from "../lib/firebase";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";
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
  const { toast } = useToast();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAppUser(null);
        setIsLoading(false);
      } else {
        // When Firebase user is authenticated, verify with our backend
        handleServerAuth();
      }
    });

    // Check for redirect result on component mount
    handleRedirectResult()
      .then((user) => {
        if (user) {
          handleServerAuth();
        }
      })
      .catch((error) => {
        console.error("Error handling redirect:", error);
        setIsLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // Function to handle server authentication after Firebase auth
  const handleServerAuth = async () => {
    if (!auth.currentUser) return;
    
    try {
      const idToken = await auth.currentUser.getIdToken();
      
      const response = await apiRequest(
        "POST", 
        "/api/auth/verify-token", 
        { idToken }
      );
      
      if (response.ok) {
        const userData = await response.json();
        setAppUser(userData);
      } else {
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
      toast({
        title: "Authentication Error",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await loginWithEmailPassword(email, password);
      // handleServerAuth is called by the auth state listener
    } catch (error: any) {
      setIsLoading(false);
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
      setIsLoading(true);
      await registerWithEmailPassword(email, password);
      // handleServerAuth is called by the auth state listener
    } catch (error: any) {
      setIsLoading(false);
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
      setIsLoading(true);
      signInWithGoogle();
      // Redirect will happen, and handleRedirectResult will be called on return
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to login with Google. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout
  const logoutUser = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    firebaseUser,
    appUser,
    isLoading,
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