'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
  useCallback,
} from 'react';
import type { ReactNode, ComponentType } from 'react';
import { onIdTokenChanged, type User, getAdditionalUserInfo, signInWithCustomToken as firebaseSignInWithCustomToken } from 'firebase/auth';
import { doc, onSnapshot, type Firestore } from 'firebase/firestore';
import type { AuthDialogProps } from '@/components/auth/AuthDialog';
import Cookies from 'js-cookie';
import { GlobalLoadingSpinner } from '@/components/common/GlobalLoadingSpinner';
import { useToast } from './use-toast';
import { getAuthErrorMessage } from '@/lib/auth-actions';
import { getFirebaseAuth, getFirebaseFirestore, getFirebaseAnalytics } from '@/lib/firebase/firebase';
import { logEvent as logAnalyticsEvent, setUserProperties, setUserId } from 'firebase/analytics';

// Defines the cookie name for the Firebase ID token.
const FIREBASE_ID_TOKEN_COOKIE = 'firebaseIdToken';

// Defines the shape of the authentication context.
interface AuthContextType {
  user: User | null; // The current authenticated Firebase user.
  loading: boolean; // Indicates if authentication status is being checked.
  authError: string | null; // Stores any authentication-related error messages.
  hasPaid: boolean; // Indicates if the user has a paid subscription.
  signInWithGoogle: () => Promise<void>; // Function to initiate Google sign-in.
  signInWithDiscord: () => Promise<void>; // Function to initiate Discord sign-in.
  signInWithCustomToken: (token: string) => Promise<void>; // Function to sign in with a custom token.
  signInWithEmail: (email: string, password: string) => Promise<boolean>; // Function for email and password sign-in.
  signUpWithEmail: (name: string, email: string, password: string) => Promise<boolean>; // Function for email and password sign-up.
  resetPassword: (email: string) => Promise<boolean>; // Function to send a password reset email.
  logout: () => Promise<void>; // Function to sign the user out.
  clearAuthError: () => void; // Function to clear any authentication errors.
  openAuthDialog: () => void; // Function to open the authentication modal.
  addSignOutCleanup: (cleanup: () => void) => void; // Adds a cleanup function to be run on sign-out.
  removeSignOutCleanup: (cleanup: () => void) => void; // Removes a cleanup function.
}

// Creates the authentication context.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provides authentication context to the application.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State for the current user.
  const [user, setUser] = useState<User | null>(null);
  // State for loading status.
  const [loading, setLoading] = useState(true);
  // State for authentication errors.
  const [authError, setAuthError] = useState<string | null>(null);
  // State for the user's payment status.
  const [hasPaid, setHasPaid] = useState(false);
  // State to control the visibility of the authentication dialog.
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  // State to hold the dynamically imported AuthDialog component.
  const [AuthDialog, setAuthDialog] = useState<ComponentType<AuthDialogProps> | null>(null);
  // Ref to store cleanup functions to be run on sign-out.
  const signOutCleanup = useRef<Array<() => void>>([]);
  // Custom hook for displaying toasts.
  const { toast } = useToast();
  // Ref to hold the Firestore instance.
  const dbRef = useRef<Firestore | null>(null);

  // Logs analytics events.
  const logEvent = useCallback(async (eventName: string, params = {}) => {
    try {
      const analytics = await getFirebaseAnalytics();
      if (analytics) {
        logAnalyticsEvent(analytics, eventName, params);
      }
    } catch {
      // This error is not critical to the user, so we can ignore it.
    }
  }, []);

  // Handles and formats authentication errors.
  const handleAuthError = useCallback((error: unknown): void => {
    const message = getAuthErrorMessage(error);
    setAuthError(message);
  }, []);

  // Clears the authentication error state.
  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Adds a cleanup function to the signOutCleanup ref.
  const addSignOutCleanup = useCallback(
    (cleanupFunc: () => void) => signOutCleanup.current.push(cleanupFunc),
    []
  );

  // Removes a specific cleanup function.
  const removeSignOutCleanup = useCallback(
    (cleanupFunc: () => void) => {
      signOutCleanup.current = signOutCleanup.current.filter(
        (fn) => fn !== cleanupFunc
      );
    },
    []
  );

  // Handles user authentication state changes.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        const auth = await getFirebaseAuth();

        // Listen for changes in the user's sign-in state.
        unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
          if (currentUser) {
            // User is signed in.
            const idTokenResult = await currentUser.getIdTokenResult();
            const paidStatus = idTokenResult.claims.hasPaid === true;

            // Update state with user info.
            setUser(currentUser);
            setHasPaid(paidStatus);
            Cookies.set(FIREBASE_ID_TOKEN_COOKIE, idTokenResult.token, { expires: 1 });

            try {
              const analytics = await getFirebaseAnalytics();
              if (analytics) {
                // Set user properties for analytics.
                setUserId(analytics, currentUser.uid);
                setUserProperties(analytics, { has_paid: paidStatus });
              }
            } catch {
              // Analytics errors are not critical to the user, so we can ignore them.
            }

          } else {
            // User is signed out.
            setUser(null);
            setHasPaid(false);
            Cookies.remove(FIREBASE_ID_TOKEN_COOKIE);
          }
          setLoading(false);
          setAuthError(null);
          setIsAuthDialogOpen(false);
        });
      } catch {
        setAuthError("Failed to connect to authentication service");
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup the listener on component unmount.
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [logEvent, handleAuthError]);

  // Listens for real-time changes to the user's payment status in Firestore.
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;

    const initializeFirestore = async () => {
      try {
        // Initialize Firestore if it hasn't been already.
        if (!dbRef.current) {
          dbRef.current = await getFirebaseFirestore();
        }
        const userDocRef = doc(dbRef.current, 'users', user.uid);
        // Listen for snapshot changes on the user's document.
        unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const serverHasPaid = docSnap.data().hasPaid === true;
            // Sync local `hasPaid` state if it differs from the server.
            if (hasPaid !== serverHasPaid) {
              setHasPaid(serverHasPaid);
              // Update user properties in analytics.
              getFirebaseAnalytics().then(analytics => {
                if(analytics) setUserProperties(analytics, { has_paid: serverHasPaid });
              })
            }
          }
        });

        // Add the unsubscribe function to the sign-out cleanup.
        addSignOutCleanup(unsubscribe);

      } catch {
        setAuthError("Failed to connect to user database");
      }
    }

    initializeFirestore();

    // Cleanup the listener on component unmount or when the user changes.
    return () => {
      if (unsubscribe) {
        unsubscribe(); 
        removeSignOutCleanup(unsubscribe);
      }
    };
  }, [user, hasPaid, addSignOutCleanup, removeSignOutCleanup]);

  // Handles Google sign-in.
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    clearAuthError();
    try {
      const { signInWithGoogle: signIn } = await import('@/lib/auth-actions');
      const userCredential = await signIn();
      const user = userCredential.user;
      const idTokenResult = await user.getIdTokenResult();
      const paidStatus = idTokenResult.claims.hasPaid === true;
      setUser(user);
      setHasPaid(paidStatus);
      Cookies.set(FIREBASE_ID_TOKEN_COOKIE, idTokenResult.token, { expires: 1 });
      const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser ?? false;
      logEvent(isNewUser ? 'sign_up' : 'login', { method: 'google' });
      setIsAuthDialogOpen(false);
    } catch (error) {
      handleAuthError(error);
    }
  }, [clearAuthError, handleAuthError, logEvent]);

  const signInWithDiscord = useCallback(async (): Promise<void> => {
    clearAuthError();
    try {
      // Dynamically import the handleSignInWithDiscord function only when needed.
      const { handleSignInWithDiscord } = await import('@/lib/discord-auth');
      const userCredential = await handleSignInWithDiscord();
      if (!userCredential) return;

      const user = userCredential.user;
      const idTokenResult = await user.getIdTokenResult();
      const paidStatus = idTokenResult.claims.hasPaid === true;
      setUser(user);
      setHasPaid(paidStatus);
      Cookies.set(FIREBASE_ID_TOKEN_COOKIE, idTokenResult.token, { expires: 1 });
      const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser ?? false;
      logEvent(isNewUser ? 'sign_up' : 'login', { method: 'discord' });
      setIsAuthDialogOpen(false);
    } catch (error) {
      handleAuthError(error);
    }
  }, [clearAuthError,handleAuthError, logEvent]);

  const signInWithCustomToken = useCallback(
    async (token: string): Promise<void> => {
      clearAuthError();
      try {
        const auth = await getFirebaseAuth();
        const userCredential = await firebaseSignInWithCustomToken(auth, token);
        const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser ?? false;
        logEvent(isNewUser ? 'sign_up' : 'login', { method: 'discord' }); // Log as Discord sign-in
        setIsAuthDialogOpen(false);
      } catch (error) {
        handleAuthError(error);
      }
    },
    [clearAuthError, handleAuthError, logEvent]
  );

  // Handles email and password sign-in.
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      clearAuthError();
      if (!email || !password) {
        setAuthError('Missing email or password');
        return false;
      }
      try {
        const { handleSignInWithEmail } = await import('@/lib/auth-actions');
        const userCredential = await handleSignInWithEmail(email, password);
        const user = userCredential.user;
        const idTokenResult = await user.getIdTokenResult();
        const paidStatus = idTokenResult.claims.hasPaid === true;
        setUser(user);
        setHasPaid(paidStatus);
        Cookies.set(FIREBASE_ID_TOKEN_COOKIE, idTokenResult.token, { expires: 1 });
        logEvent('login', { method: 'email' });
        setIsAuthDialogOpen(false);
        return true;
      } catch (error) {
        handleAuthError(error);
        return false;
      }
    },
    [clearAuthError, handleAuthError, logEvent]
  );

  // Handles new user sign-up.
  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      clearAuthError();
      if (!name.trim() || !email || !password) {
        setAuthError('Missing name, email or password');
        return false;
      }
      try {
        const { handleSignUpWithEmail } = await import('@/lib/auth-actions');
        const userCredential = await handleSignUpWithEmail(name, email, password);
        const user = userCredential.user;
        const idTokenResult = await user.getIdTokenResult();
        const paidStatus = idTokenResult.claims.hasPaid === true;
        setUser(user);
        setHasPaid(paidStatus);
        Cookies.set(FIREBASE_ID_TOKEN_COOKIE, idTokenResult.token, { expires: 1 });
        logEvent('sign_up', { method: 'email' });
        setIsAuthDialogOpen(false);
        return true;
      } catch (error) {
        handleAuthError(error);
        return false;
      }
    },
    [clearAuthError, handleAuthError, logEvent]
  );

  // Handles password reset requests.
  const resetPassword = useCallback(
    async (email: string): Promise<boolean> => {
      clearAuthError();
      if (!email) {
        setAuthError('Email is required');
        return false;
      }
      try {
        const { handleResetPassword } = await import('@/lib/auth-actions');
        await handleResetPassword(email);
        toast({
          title: 'Password reset email sent',
          description: 'Check your inbox for a link to reset your password',
        });
        return true;
      } catch (error) {
        handleAuthError(error);
        return false;
      }
    },
    [clearAuthError, handleAuthError, toast]
  );

  // Handles user sign-out.
  const logout = async (): Promise<void> => {
    try {
      // Run all registered cleanup functions.
      signOutCleanup.current.forEach((cleanup) => cleanup());
      signOutCleanup.current = [];
      const { handleSignOut } = await import('@/lib/auth-actions');
      await handleSignOut();
    } catch {
      toast({
        title: 'Sign-out failed',
        description: 'An error occurred while signing out',
        variant: 'destructive',
      });
    }
  };

  // Dynamically loads and opens the authentication dialog.
  const openAuthDialog = useCallback(() => {
    if (AuthDialog) {
      setIsAuthDialogOpen(true);
    } else {
      import('@/components/auth/AuthDialog').then((module) => {
        setAuthDialog(() => module.AuthDialog);
        setIsAuthDialogOpen(true);
      });
    }
  }, [AuthDialog]);

  // The value provided to the AuthContext.
  const value = {
    user,
    loading,
    authError,
    hasPaid,
    signInWithGoogle,
    signInWithDiscord,
    signInWithCustomToken,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    clearAuthError,
    openAuthDialog,
    addSignOutCleanup,
    removeSignOutCleanup,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show a global spinner while loading, otherwise show children. */}
      {loading ? <GlobalLoadingSpinner /> : children}
      {/* Dynamically render the AuthDialog when needed. */}
      {AuthDialog && <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Throw an error if useAuth is used outside of an AuthProvider.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};