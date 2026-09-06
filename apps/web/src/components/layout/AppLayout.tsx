import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../store/auth';
import { useMe } from '../../hooks/useMe';

// Menu dinâmico (prompt-mestre, seção 21): cada item só aparece se o módulo
// correspondente estiver habilitado para a organização (Module Engine, seção 3).
const MENU_ITEMS: { key: string; label: string; path: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: '📊' },
  { key: 'customers', label: 'Clientes', path: '/customers', icon: '🏢' },
  { key: 'prospects', label: 'Prospects', path: '/prospects', icon: '🎯' },
  { key: 'opportunities', label: 'Oportunidades', path: '/opportunities', icon: '📈' },
  { key: 'products', label: 'Produtos', path: '/products', icon: '📦' },
  { key: 'suppliers', label: 'Fornecedores', path: '/suppliers', icon: '🚚' },
  { key: 'tasks', label: 'Tarefas', path: '/tasks', icon: '✅' },
  { key: 'custom_objects', label: 'Objetos', path: '/custom-objects', icon: '🧩' },
];

export function AppLayout() {
  const { organization, user, enabledModules } = useAuthStore();
  const logout = useAuthStore((s) => s.logout);
  useMe();

  const visibleItems = MENU_ITEMS.filter((item) => item.key === 'dashboard' || enabledModules.includes(item.key));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="truncate text-sm font-semibold text-slate-800">{organization?.name ?? 'CRM'}</p>
          <p className="mt-0.5 text-xs capitalize text-slate-400">{organization?.segmentKey ?? 'core'}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="truncate text-xs font-medium text-slate-700">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <button onClick={logout} className="mt-2 text-xs font-medium text-red-500 hover:underline">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
