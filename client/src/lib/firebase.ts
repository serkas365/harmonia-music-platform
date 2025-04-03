import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signInWithPopup, 
  getRedirectResult 
} from "firebase/auth";

// Firebase configuration - using provided values directly
console.log("Using hardcoded Firebase configuration");

const firebaseConfig = {
  apiKey: "AIzaSyBHcBWA06tKTGx0CfjrK0ujW_PGMmSjgSM",
  authDomain: "harmonia-music-e2a73.firebaseapp.com",
  projectId: "harmonia-music-e2a73",
  storageBucket: "harmonia-music-e2a73.appspot.com",
  appId: "1:669057862941:web:6b56c72382a587952ee5f4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Login with email and password
export const loginWithEmailPassword = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Register with email and password
export const registerWithEmailPassword = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

// Google authentication provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Sign in with Google using redirect (better for mobile)
export const signInWithGoogle = () => {
  signInWithRedirect(auth, googleProvider);
};

// Handle redirect result
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect:", error);
    throw error;
  }
};

// Logout function
export const logout = async () => {
  return await auth.signOut();
};