// frontend/src/firebaseConfig.js
// This file initializes the Firebase client-side SDK and exports all core services and SDK functions needed.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL, listAll } from 'firebase/storage';

// --- Firebase Configuration ---
// IMPORTANT: YOU MUST REPLACE THESE PLACEHOLDERS WITH YOUR ACTUAL Firebase project details
// This configuration is used as a fallback or for local development.
const firebaseConfig = {
    apiKey: "AIzaSyBwKIYu2agzEVP-Ow3112notX_fzR7pHRI", // <--- Your actual API key
    authDomain: "silicon-ai-7519b.firebaseapp.com", // <--- Your actual auth domain
    projectId: "silicon-ai-7519b", // <--- Your actual project ID
    storageBucket: "silicon-ai-7519b.appspot.com", // <--- Your actual storage bucket
    messagingSenderId: "482301743226", // <--- Your actual messaging sender ID
    appId: "1:482301743226:web:8002e9601b83a4ae2e2bc3" // <--- Your actual app ID
};

// --- Initialize Firebase App and Services (Ensures single initialization) ---
let appInstance;

// Check if a default app is already initialized
// The Canvas environment provides a special configuration via __firebase_config
// Use window object to check for global variables to avoid ESLint errors
const config = typeof window !== 'undefined' && window.__firebase_config 
  ? JSON.parse(window.__firebase_config) 
  : firebaseConfig;

if (!getApps().length) {
    appInstance = initializeApp(config);
    console.log("Firebase App initialized successfully.");
} else {
    appInstance = getApp();
    console.log("Firebase App already initialized (retrieved existing default app).");
}

export const app = appInstance;
export const auth = getAuth(appInstance);
export const db = getFirestore(appInstance);
export const storage = getStorage(appInstance);

// Export additional functions that are missing from your current file's exports
// These are needed by components like RTLEditor and others
export const updateUserAiUses = async (userId, newAiUses) => {
    if (!db || !userId) {
        console.error("Firestore DB or User ID not available to update AI uses.");
        return;
    }
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, { aiUsesLeft: newAiUses });
        console.log(`User ${userId} AI uses updated to ${newAiUses}`);
    } catch (error) {
        console.error("Error updating user AI uses:", error);
    }
};

export const getUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    } else {
        console.log("No such user document!");
        return null;
    }
};

export const initializeAuth = async () => {
  try {
    const initialAuthToken = typeof window !== 'undefined' && window.__initial_auth_token 
      ? window.__initial_auth_token 
      : null;
      
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
      console.log("Signed in with custom token.");
    } else {
      await signInAnonymously(auth);
      console.log("Signed in anonymously.");
    }
  } catch (error) {
    console.error("Error during Firebase initialization or authentication:", error);
  }
};

// The appIdentifier is a constant and should be exported.
export const appIdentifier = typeof window !== 'undefined' && window.__app_id 
  ? window.__app_id 
  : 'default-app-id';

export {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
};

export {
  collection,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  orderBy,
  updateDoc
};

export {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
  listAll,
};