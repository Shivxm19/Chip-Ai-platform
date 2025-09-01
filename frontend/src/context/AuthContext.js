// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '../firebaseconfig';
import { getMyProfile, createUserProfileDocument } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    let profile = await getMyProfile();
                    
                    if (!profile) {
                        console.log("Creating new user profile in Firestore...");
                        profile = await createUserProfileDocument(currentUser);
                    }
                    
                    setUserProfile(profile);
                } catch (error) {
                    console.error("Error handling user profile:", error);
                    // Fallback minimal profile
                    setUserProfile({
                        uid: currentUser.uid,
                        email: currentUser.email || 'anonymous',
                        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Guest',
                        is_admin: false,
                        membership: 'free'
                    });
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    const value = { user, userProfile, authReady };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);