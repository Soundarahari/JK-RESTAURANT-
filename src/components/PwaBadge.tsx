import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';

export function PwaBadge() {
  // ── Update Logic ──
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('SW Registered:', swUrl);
      // Check for updates every hour
      r && setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // ── Install Logic ──
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleUpdateClick = () => {
    updateServiceWorker(true);
  };

  const closeUpdate = () => {
    setNeedRefresh(false);
  };

  const closeInstall = () => {
    setShowInstallPrompt(false);
  };

  // ── Render Update Banner ──
  if (needRefresh) {
    return (
      <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-r from-brand-500 to-emerald-500 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">New update available!</p>
            <p className="text-xs text-white/90">Click to refresh and get the latest version</p>
          </div>
          <button
            onClick={handleUpdateClick}
            className="px-4 py-2 bg-white text-brand-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            Update
          </button>
          <button
            onClick={closeUpdate}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── Render Install Banner ──
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Install JK Restaurant</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get quick access from your home screen</p>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg font-bold text-sm hover:bg-brand-600 transition-colors flex-shrink-0"
          >
            Install
          </button>
          <button
            onClick={closeInstall}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
