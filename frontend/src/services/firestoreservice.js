// frontend/src/services/firestoreService.js
// This file handles direct interactions with Firebase Firestore from the frontend.
// Use this for data that is NOT primarily managed by your FastAPI backend (e.g., specific user settings, real-time updates).

import {
    db, // Import the Firestore instance from firebaseConfig
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
} from '../firebaseconfig'; // Corrected casing

// Function to update user AI uses in Firestore
// This assumes AI uses are managed directly in Firestore, separate from the main user profile in MongoDB.
export const updateUserAiUses = async (userId, newAiUses) => {
    if (!db || !userId) {
        console.error("Firestore DB or User ID not available to update AI uses.");
        return;
    }
    const userRef = doc(db, 'users', userId); // Assuming 'users' collection for AI uses
    try {
        await updateDoc(userRef, { aiUsesLeft: newAiUses });
        console.log(`Firestore: User ${userId} AI uses updated to ${newAiUses}`);
    } catch (error) {
        console.error("Firestore: Error updating user AI uses:", error);
    }
};

// Example of how to listen to real-time updates on a user document in Firestore
// (e.g., if some user data is updated directly in Firestore by other Firebase services)
export const onFirestoreUserProfileUpdate = (userId, callback) => {
    if (!db || !userId) {
        console.error("Firestore DB or User ID not available for user profile updates listener.");
        return () => {}; // Return a no-op unsubscribe function
    }
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Firestore: Error listening to user profile updates:", error);
        callback(null);
    });
};

// You can export other direct Firestore SDK functions if needed by specific components
export { collection, query, where, doc, getDoc, setDoc, getDocs, onSnapshot, addDoc, serverTimestamp, deleteDoc, orderBy, updateDoc };
