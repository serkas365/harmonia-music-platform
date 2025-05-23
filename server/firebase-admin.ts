import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let auth: Auth;

// Initialize the Firebase Admin SDK
// Note: In production, you should use service account credentials
// For Replit, we're using the application default credentials method
try {
  const app = initializeApp({
    projectId: "harmonia-music-e2a73",
  });
  auth = getAuth(app);
  console.log('Firebase Admin SDK initialized successfully with project ID: harmonia-music-e2a73');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // Provide a fallback for auth to prevent null reference errors
  auth = {} as Auth;
}

export { auth };