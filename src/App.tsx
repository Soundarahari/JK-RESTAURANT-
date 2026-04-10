import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PwaBadge } from './components/PwaBadge';
import { Home } from './pages/Home';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { TrackOrder } from './pages/TrackOrder';
import { DriverDelivery } from './pages/DriverDelivery';
import { DriverJobs } from './pages/DriverJobs';
import { CategoryView } from './pages/CategoryView';
import { useState, useEffect } from 'react';
import { Moon, Sun, User } from 'lucide-react';
import { useStore, isAdmin, isRoleManager } from './store';
import { supabase } from './lib/supabase';
import { NotificationDropdown } from './components/NotificationDropdown';

// Automatically scrolls to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Saves current route to localStorage so it persists across reloads
function RouteTracker() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current path whenever it changes
  useEffect(() => {
    localStorage.setItem('jk-last-route', location.pathname);
  }, [location.pathname]);

  // On first mount, restore the last saved route
  useEffect(() => {
    const savedRoute = localStorage.getItem('jk-last-route');
    if (savedRoute && savedRoute !== '/' && savedRoute !== location.pathname) {
      navigate(savedRoute, { replace: true });
    }
  }, []); // Only runs once on mount

  return null;
}

function App() {
  const { user, fetchProducts, fetchCategories } = useStore();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('jk-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    localStorage.setItem('jk-dark-mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
         const newNotification = payload.new as any;
         
         const isForUser = newNotification.user_email === user.email;
         const isForAll = newNotification.target_role === 'all';
         const isForAdmin = (isAdmin(user) || isRoleManager(user)) && newNotification.target_role === 'admin';
         const isForDriver = user.is_driver && newNotification.target_role === 'driver';
         
         if (isForUser || isForAll || isForAdmin || isForDriver) {
             useStore.getState().addLocalNotification(newNotification);
         }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Router>
      <RouteTracker />
      <ScrollToTop />
      <PwaBadge />
      <Routes>
        {/* ── Driver Delivery Page — standalone, no app chrome ── */}
        <Route path="/driver/:orderId" element={<DriverDelivery />} />

        {/* ── Main App Shell ── */}
        <Route path="*" element={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-brand-200 transition-colors">

            {/* ── Top Header (mobile: visible / desktop: visible spanning full width) ── */}
            <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
              {/* Mobile header — centred, max-w-md */}
              <div className="flex items-center justify-between p-4 max-w-md mx-auto lg:hidden">
                <div className="w-8 h-8 flex items-center justify-center">
                  {/* PWA Install/Update handled by PwaBadge component */}
                </div>
                <h1 className="text-2xl font-black text-center text-brand-600 tracking-tight">JK Restaurant</h1>
                <div className="flex items-center gap-2">
                  <NotificationDropdown />
                  <button onClick={() => setDarkMode(!darkMode)} className="p-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <Link to="/profile" className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700 shadow-sm active:scale-95 transition-transform">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-gray-500" />
                    )}
                  </Link>
                </div>
              </div>

              {/* Desktop header — full width */}
              <div className="hidden lg:flex items-center justify-between px-8 py-4 lg:pl-[260px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg">🍽️</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-brand-600 tracking-tight leading-none">JK Restaurant</h1>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Highway & Student-Friendly</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* PWA Install/Update handled by PwaBadge component */}
                  <NotificationDropdown />
                  <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <Link to="/profile" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700 hover:border-brand-500 transition-colors shadow-sm ml-2">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-gray-500" />
                    )}
                  </Link>
                </div>
              </div>
            </header>

            {/* ── Body: sidebar (desktop) + content ── */}
            <div className="lg:flex lg:items-start lg:min-h-[calc(100vh-73px)]">

              {/* Desktop sidebar nav — hidden on mobile */}
              <Navbar />

              {/* Main content */}
              <main className="
                flex-1 min-w-0
                pb-20 lg:pb-8
                px-4 lg:px-10
                pt-4 lg:pt-8
                max-w-md mx-auto w-full
                lg:max-w-none lg:mx-0
                animate-in fade-in duration-300
                min-h-[calc(100vh-140px)] lg:min-h-0
              ">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/category/:subCategoryId" element={<CategoryView />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/driver-jobs" element={<DriverJobs />} />
                  <Route path="/track/:orderId" element={<TrackOrder />} />
                </Routes>
              </main>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
