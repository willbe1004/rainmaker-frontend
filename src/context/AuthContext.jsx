// src/context/AuthContext.jsx (로그인 버그 수정판)
import { createContext, useContext, useEffect, useState } from "react";
import { auth, loginWithGoogle, logout } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserRoleAPI } from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const roleInfo = await getUserRoleAPI(firebaseUser.email);

          if (roleInfo) {
            setUser({ ...firebaseUser, ...roleInfo });
          } else {
            alert("시스템 사용 권한이 없습니다. 관리자에게 문의하세요.");
            await logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("인증 에러:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    login: loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
