import { Link } from 'react-router-dom';
import { FileText, RotateCcw, Truck, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-8 pb-20 lg:pb-0">
      <div className="max-w-md lg:max-w-none mx-auto px-4 lg:px-10 py-8">
        
        {/* Policy Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link to="/terms" className="group flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-brand-50 dark:hover:bg-brand-900/10 rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 transition-all active:scale-[0.97]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
              <FileText size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide leading-tight">Terms &<br />Conditions</p>
            </div>
          </Link>

          <Link to="/refund-policy" className="group flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 transition-all active:scale-[0.97]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
              <RotateCcw size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide leading-tight">Refund &<br />Cancellation</p>
            </div>
          </Link>

          <Link to="/shipping-policy" className="group flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-[0.97]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
              <Truck size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide leading-tight">Shipping &<br />Delivery</p>
            </div>
          </Link>

          <Link to="/contact" className="group flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/10 rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 transition-all active:scale-[0.97]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
              <MessageCircle size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide leading-tight">Contact<br />Us</p>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800 mb-5"></div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs">🍽️</span>
            </div>
            <div>
              <p className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-tight">JK Restaurant</p>
              <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">Highway & Student-Friendly</p>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="flex items-center gap-4">
            <a href="mailto:jkrestaurant.orders@gmail.com" className="flex items-center gap-1.5 text-gray-400 hover:text-brand-500 transition-colors">
              <Mail size={12} />
              <span className="text-[10px] font-bold hidden sm:inline">jkrestaurant.orders@gmail.com</span>
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-1.5 text-gray-400 hover:text-brand-500 transition-colors">
              <Phone size={12} />
              <span className="text-[10px] font-bold hidden sm:inline">+91 98765 43210</span>
            </a>
            <div className="flex items-center gap-1.5 text-gray-400">
              <MapPin size={12} />
              <span className="text-[10px] font-bold hidden sm:inline">Komarapalayam, TN</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-[9px] text-gray-300 dark:text-gray-700 font-semibold uppercase tracking-widest mt-5">
          © {new Date().getFullYear()} JK Restaurant. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
