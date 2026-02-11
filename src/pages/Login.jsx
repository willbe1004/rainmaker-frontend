import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login();
      navigate('/');
    } catch (error) {
      alert("로그인 실패");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-96 text-center">
        <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
           <span className="text-white font-bold text-xl">K</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">한국수안 영업관리</h1>
        <p className="text-gray-500 mb-8 text-sm">Smart Sales System</p>
        <button onClick={handleLogin} className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-3 shadow-sm transition-all">
          <span className="font-bold">Google 계정으로 로그인</span>
        </button>
      </div>
    </div>
  );
}