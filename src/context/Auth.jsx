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

import { auth, firebaseReady } from "../firebase";

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
        const token = await currentUser.getIdTokenResult(true);
        setIsAdmin(token.claims.admin === true);
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
    if (!firebaseReady || !auth) {
      throw new Error(
        "Firebase is not configured. Check the values in your .env file."
      );
    }

    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const token = await credential.user.getIdTokenResult(true);

    if (token.claims.admin !== true) {
      await signOut(auth);

      throw new Error(
        "This account is not authorised for the Moji's Heritage newsroom."
      );
    }

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
    }),
    [user, isAdmin, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}