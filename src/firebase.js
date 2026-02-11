// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCq91-vOcQXN7RrNM4x5OzN4mIQ5h9a2to",
    authDomain: "project-rainmaker-486817.firebaseapp.com",
    projectId: "project-rainmaker-486817",
    storageBucket: "project-rainmaker-486817.firebasestorage.app",
    messagingSenderId: "73326407281",
    appId: "1:73326407281:web:929c9db4aae5483417f5d0",
    measurementId: "G-NF53N2YM8P"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login Failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);