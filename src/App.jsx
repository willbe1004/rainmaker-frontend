import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Bids from './pages/Bids';
import BidDetail from './pages/BidDetail';
import Report from './pages/Report';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">로딩중...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-gray-700">Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{user?.name ?? user?.email} {user?.role === 'manager' && '👑'}</p>
              <p className="text-xs text-gray-500">{user?.team ?? '-'}팀</p>
            </div>
            <button onClick={logout} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">로그아웃</button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/bids" element={<ProtectedRoute><AppLayout><Bids /></AppLayout></ProtectedRoute>} />
          <Route path="/bids/:id" element={<ProtectedRoute><AppLayout><BidDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><AppLayout><Report /></AppLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
