// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, loginWithGoogle, logout } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // GAS 서버에 직급 조회 요청
  const fetchUserRole = async (email) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ type: 'GET_USER_ROLE', data: { email } })
      });
      const result = await response.json();
      return result.status === 'success' ? result.data : null;
    } catch (e) {
      console.error("권한 조회 실패:", e);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. 구글 로그인 성공 -> 2. GAS에서 직급 조회
        const roleInfo = await fetchUserRole(firebaseUser.email);
        
        if (roleInfo) {
          setUser({ ...firebaseUser, ...roleInfo }); // 정보 합치기
        } else {
          alert("등록된 사용자가 아닙니다. 관리자(Users시트)에게 문의하세요.");
          await logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login: loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);