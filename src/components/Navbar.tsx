import { ShoppingCart, User, Home, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore, isAdmin } from '../store';

export const Navbar = () => {
  const cart = useStore((state) => state.cart);
  const user = useStore((state) => state.user);
  const location = useLocation();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const userIsAdmin = isAdmin(user);

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex flex-col items-center p-2 ${isActive ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'}`}>
        <Icon size={24} />
        <span className="text-[10px] mt-1 font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50 transition-colors">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
        <NavItem to="/" icon={Home} label="Menu" />
        <Link to="/cart" className="relative flex flex-col items-center p-2 text-gray-500 dark:text-gray-400">
          <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
            {cartCount}
          </div>
          <ShoppingCart size={24} className={location.pathname === '/cart' ? 'text-brand-500' : ''} />
          <span className={`text-[10px] mt-1 font-medium ${location.pathname === '/cart' ? 'text-brand-500' : ''}`}>Cart</span>
        </Link>
        <NavItem to="/profile" icon={User} label="Profile" />
        {userIsAdmin && <NavItem to="/admin" icon={ShieldAlert} label="Admin" />}
      </div>
    </nav>
  );
};
