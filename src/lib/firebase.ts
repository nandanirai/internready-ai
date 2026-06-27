import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqCvvZOYCnmdLuWYbNbMRjCJO_hk-5x_w",
  authDomain: "ferrous-duality-ts6r9.firebaseapp.com",
  projectId: "ferrous-duality-ts6r9",
  storageBucket: "ferrous-duality-ts6r9.firebasestorage.app",
  messagingSenderId: "355857144148",
  appId: "1:355857144148:web:4692144e7d1b9634cad0c1"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with our unique databaseId using the getFirestore overload
export const db = getFirestore(app, "ai-studio-5d7b4faa-4355-4801-868e-523d1dd8fbfc");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };
