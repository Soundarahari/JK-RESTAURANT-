import { Bell, Check } from 'lucide-react';
import { useStore } from '../store';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotificationDropdown() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-gray-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute -right-14 sm:right-0 mt-3 w-[310px] sm:w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between z-10">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }}
                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 uppercase tracking-widest"
              >
                <Check size={12} /> Mark All Read
              </button>
            )}
          </div>

          <div className="p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="text-center py-6 px-4">
                <Bell size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No notifications</p>
                <p className="text-[10px] text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => {
                    if (!notification.is_read) markNotificationAsRead(notification.id);
                  }}
                  className={`relative p-3 rounded-xl transition-colors cursor-pointer group ${notification.is_read ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'bg-brand-50/50 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}
                >
                  {!notification.is_read && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-brand-500 rounded-full" />
                  )}
                  <h4 className="font-black text-xs text-gray-900 dark:text-gray-100 pr-4 leading-tight mb-1">{notification.title}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-1.5">{notification.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {notification.link && (
                      <Link 
                        to={notification.link}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notification.is_read) markNotificationAsRead(notification.id);
                          setIsOpen(false);
                        }}
                        className="text-[10px] font-black text-brand-500 hover:text-brand-600 uppercase tracking-widest"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
