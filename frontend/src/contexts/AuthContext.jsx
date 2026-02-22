import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

export const AuthContext = createContext();

const ALLOWED_DOMAIN = '@vvce.ac.in';

// Maps Firebase error codes to user-readable messages
const friendlyError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist user session across reloads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Student signup — restricted to @vvce.ac.in emails.
   * Creates the Firebase account and sends a verification email.
   */
  const signup = async (email, password) => {
    if (!email.endsWith(ALLOWED_DOMAIN)) {
      throw new Error(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`);
    }
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(newUser);
      // Sign out immediately — the user must verify before they can log in
      await signOut(auth);
      return newUser;
    } catch (err) {
      throw new Error(friendlyError(err.code));
    }
  };

  /**
   * Student login — restricted to @vvce.ac.in, blocks unverified accounts.
   */
  const login = async (email, password) => {
    if (!email.endsWith(ALLOWED_DOMAIN)) {
      throw new Error(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`);
    }
    try {
      const { user: signedInUser } = await signInWithEmailAndPassword(auth, email, password);
      if (!signedInUser.emailVerified) {
        await signOut(auth);
        throw new Error(
          'Please verify your college email before logging in. Check your inbox for the verification link.'
        );
      }
      return signedInUser;
    } catch (err) {
      // Re-throw our own errors as-is; translate Firebase errors
      if (err.message && !err.code) throw err;
      throw new Error(friendlyError(err.code));
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
