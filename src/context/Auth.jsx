import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  auth,
  firebaseReady,
  firebaseConfigError,
  missingFirebaseEnvKeys,
} from "../firebase.js";

import {
  UNAUTHORIZED_ADMIN_MESSAGE,
  hasAdminClaim,
  verifyAdminUser,
  authenticateAdminWithDeps,
} from "../utils/adminAuth.js";

export {
  UNAUTHORIZED_ADMIN_MESSAGE,
  hasAdminClaim,
  verifyAdminUser,
  authenticateAdminWithDeps,
};

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { authorized } = await verifyAdminUser(currentUser, {
          forceRefresh: true,
        });
        setIsAdmin(authorized);
      } catch (error) {
        console.error("Unable to verify administrator access:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    const credential = await authenticateAdminWithDeps({
      email,
      password,
      firebaseReadyFlag: firebaseReady,
      authInstance: auth,
      missingKeys: missingFirebaseEnvKeys,
      signInFn: signInWithEmailAndPassword,
      signOutFn: signOut,
    });

    setUser(credential.user);
    setIsAdmin(true);

    return credential;
  }

  async function logout() {
    if (auth) {
      await signOut(auth);
    }

    setUser(null);
    setIsAdmin(false);
  }

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      login,
      logout,
      firebaseReady,
      firebaseConfigError,
      missingFirebaseEnvKeys,
    }),
    [user, isAdmin, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
