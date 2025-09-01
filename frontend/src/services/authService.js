// src/services/authService.js (complete version)
import { db, auth } from '../firebaseconfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Get user profile from Firestore
export const getMyProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting profile from Firestore:", error);
    return null;
  }
};

// Create user profile document in Firestore
export const createUserProfileDocument = async (user) => {
  try {
    const userProfile = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      is_admin: false,
      membership: 'free',
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    return userProfile;
  } catch (error) {
    console.error("Error creating user profile in Firestore:", error);
    // Return the profile object even if Firestore fails
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      is_admin: false,
      membership: 'free'
    };
  }
};

// UPDATE USER PROFILE - Add this function
export const updateMyProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });

    // Return the updated profile
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return { id: updatedDoc.id, ...updatedDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};