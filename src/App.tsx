import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { CategoryView } from './pages/CategoryView';
import { useState, useEffect } from 'react';
import { Moon, Sun, Download } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('jk-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('jk-dark-mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // PWA Installation Hook
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We no longer need the prompt. Clear it up.
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <Router>
      <RouteTracker />
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-brand-200 transition-colors overflow-x-hidden">

        {/* ── Top Header (mobile: visible / desktop: visible spanning full width) ── */}
        <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
          {/* Mobile header — centred, max-w-md */}
          <div className="flex items-center justify-between p-4 max-w-md mx-auto lg:hidden">
            <div className="w-8 h-8 flex items-center justify-center">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center hover:bg-brand-200 transition-colors"
                  title="Install App"
                >
                  <Download size={18} />
                </button>
              )}
            </div>
            <h1 className="text-2xl font-black text-center text-brand-600 tracking-tight">JK Restaurant</h1>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Desktop header — full width */}
          <div className="hidden lg:flex items-center justify-between px-8 py-4">
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
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold hover:bg-brand-200 transition-colors"
                >
                  <Download size={16} /> Install App
                </button>
              )}
              <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        {/* ── Body: sidebar (desktop) + content ── */}
        <div className="lg:flex lg:min-h-[calc(100vh-65px)]">

          {/* Desktop sidebar nav — hidden on mobile */}
          <Navbar />

          {/* Main content */}
          <main className="
            flex-1
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
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
