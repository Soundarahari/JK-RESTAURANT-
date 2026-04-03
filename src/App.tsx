import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { CategoryView } from './pages/CategoryView';
import { useState, useEffect } from 'react';
import { Moon, Sun, Download } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 pb-20 selection:bg-brand-200 transition-colors">
        <header className="bg-white dark:bg-gray-900 p-4 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto flex items-center justify-between">
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
        </header>

        <main className="max-w-md mx-auto p-4 animate-in fade-in duration-300 min-h-[calc(100vh-140px)]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:subCategoryId" element={<CategoryView />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        
        <Navbar />
      </div>
    </Router>
  );
}

export default App;
