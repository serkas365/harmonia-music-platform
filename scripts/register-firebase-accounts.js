// This script registers sample users in Firebase Authentication
// Run with: node scripts/register-firebase-accounts.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHcBWA06tKTGx0CfjrK0ujW_PGMmSjgSM",
  authDomain: "harmonia-music-e2a73.firebaseapp.com",
  projectId: "harmonia-music-e2a73",
  storageBucket: "harmonia-music-e2a73.appspot.com",
  appId: "1:669057862941:web:6b56c72382a587952ee5f4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sample users to register
const users = [
  {
    email: 'melodycreator@artistmail.com',
    password: 'password123'
  },
  {
    email: 'beatsmith@artistmail.com',
    password: 'password123'
  }
];

async function registerUsers() {
  for (const user of users) {
    try {
      console.log(`Attempting to create user: ${user.email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`Successfully created user: ${userCredential.user.email} with UID: ${userCredential.user.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User already exists: ${user.email}`);
      } else {
        console.error(`Error creating user ${user.email}:`, error.code, error.message);
      }
    }
  }
}

registerUsers()
  .then(() => {
    console.log('User registration process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during registration:', error);
    process.exit(1);
  });