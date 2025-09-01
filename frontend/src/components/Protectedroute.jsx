// frontend/src/components/ProtectedRoute.jsx

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, signOut } from '../firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getMyProfile } from '../services/authService';
import LoadingOverlay from './Loadingoverlay';

const ProtectedRoute = ({ allowedRoles = ['user'] }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    userProfile: null,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthState({
          loading: false,
          authenticated: false,
          userProfile: null,
          error: 'Not authenticated'
        });
        return;
      }

      try {
        const profile = await getMyProfile();

        const userIsAdmin = profile?.is_admin || false;
        const hasRole = allowedRoles.includes(userIsAdmin ? 'admin' : 'user');

        setAuthState({
          loading: false,
          authenticated: true,
          userProfile: profile,
          error: hasRole ? null : 'Unauthorized access'
        });
      } catch (error) {
        const errorMessage = error?.response?.data?.detail || error.message || 'Failed to load user profile';
        
        // CORRECTED: If the backend returns an invalid token error, sign out the user
        if (errorMessage === 'Invalid Firebase ID token.') {
            console.warn("Invalid token detected. Signing out user.");
            signOut(auth).then(() => {
                setAuthState({
                    loading: false,
                    authenticated: false,
                    userProfile: null,
                    error: 'Session expired. Please log in again.'
                });
            });
            return;
        }

        setAuthState({
          loading: false,
          authenticated: false,
          userProfile: null,
          error: errorMessage
        });
      }
    });

    return () => unsubscribe();
  }, [allowedRoles]);

  if (authState.loading) {
    return <LoadingOverlay />;
  }

  if (!authState.authenticated || authState.error) {
    return <Navigate to="/auth" state={{ error: authState.error }} replace />;
  }
  
  if (authState.userProfile && authState.error === 'Unauthorized access') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet context={{ user: authState.userProfile }} />;
};

export default ProtectedRoute;
