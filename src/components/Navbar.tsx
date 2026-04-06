import { ShoppingCart, User, Home, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore, isAdmin } from '../store';

export const Navbar = () => {
  const cart = useStore((state) => state.cart);
  const user = useStore((state) => state.user);
  const location = useLocation();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const userIsAdmin = isAdmin(user);

  const navItems = [
    { to: '/', icon: Home, label: 'Menu' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { to: '/profile', icon: User, label: 'Profile' },
    ...(userIsAdmin ? [{ to: '/admin', icon: ShieldAlert, label: 'Admin' }] : []),
  ];

  return (
    <>
      {/* ── Mobile: fixed bottom bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50 transition-colors">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center p-2 ${isActive ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <Icon size={24} />
                {badge !== undefined && badge > 0 && (
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                    {badge}
                  </div>
                )}
                <span className="text-[10px] mt-1 font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop: left sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 sticky top-[65px] h-[calc(100vh-65px)] transition-colors">
        <nav className="flex flex-col gap-1 p-4 pt-6 flex-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all
                  ${isActive
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
                    {badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest text-center">
            JK Restaurant © 2025
          </p>
        </div>
      </aside>
    </>
  );
};
