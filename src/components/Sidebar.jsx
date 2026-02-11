import { Link, useLocation } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: '대시보드' },
  { to: '/bids', label: '공고' },
  { to: '/report', label: '리포트' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">K</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-800">한국수안 영업관리</h1>
          <span className="text-[10px] text-gray-500">Smart Sales System</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {ITEMS.map(({ to, label }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-sky-100 text-sky-800' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
