// Firebase configuration - Get these from Firebase Console
// https://console.firebase.google.com → Project Settings → Web App Config


export const firebaseConfig = {
  apiKey: "AIzaSyCm6AQ2kbyOaPGzcbhtaWY1EVd-bFrSDNM",
  authDomain: "effort-tracking-5cf3d.firebaseapp.com",
  projectId: "effort-tracking-5cf3d",
  storageBucket: "effort-tracking-5cf3d.firebasestorage.app",
  messagingSenderId: "262640926801",
  appId: "1:262640926801:web:57e55e1a0661fc3fabb870"
};

// Firestore Collections Structure
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',           // All users (admin, candidates)
  CANDIDATES: 'candidates',  // Candidate-specific details
  PROJECTS: 'projects',      // Projects
  TIMESHEETS: 'timesheets',  // Timesheet entries
  ASSIGNMENTS: 'assignments' // Project assignments
};
