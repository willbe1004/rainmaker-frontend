import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BidDetail from './pages/BidDetail';
import Report from './pages/Report';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      {children}
    </Link>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-slate-800">
          Rainmaker
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/">대시보드</NavLink>
          <NavLink to="/report">리포트</NavLink>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bids/:id" element={<BidDetail />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
