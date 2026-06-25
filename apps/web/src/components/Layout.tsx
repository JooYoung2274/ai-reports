import { NavLink, Outlet } from 'react-router-dom';

const menu = [
  { to: '/', label: '개요' },
  { to: '/users', label: '사용자별' },
  { to: '/prompts', label: '프롬프트 이력' },
  { to: '/tokens', label: '토큰 사용량' },
];

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r bg-gray-50 p-4">
        <div className="font-bold mb-4">AI Usage</div>
        <nav className="flex flex-col gap-1">
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.to === '/'}
              className={({ isActive }) => `px-3 py-2 rounded ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  );
}
