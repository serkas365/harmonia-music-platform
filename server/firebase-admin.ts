import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let auth;

// Initialize the Firebase Admin SDK
// Note: In production, you should use service account credentials
// For Replit, we're using the application default credentials method
try {
  const app = initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  auth = getAuth(app);
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

export { auth };