import { useEffect, useState } from 'react';
import { useStore, isAdmin as checkIsAdmin } from '../store';
import { supabase } from '../lib/supabase';
import { CheckCircle, LogOut, GraduationCap, Shield, User, ArrowRight, Smartphone, Package, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user, loginWithEmail, logoutUser, updatePhone, orders, fetchUserOrders, promos, appliedPromoCode, setAppliedPromoCode } = useStore();

  // Phone collection state (Mandatory after Google login)
  const [phoneInput, setPhoneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [isEditingAltPhone, setIsEditingAltPhone] = useState(false);
  const [altPhoneValue, setAltPhoneValue] = useState('');

  // Fetch orders regularly for live updates
  useEffect(() => {
    if (user && user.email && !checkIsAdmin(user)) {
      fetchUserOrders(user.email);
      const interval = setInterval(() => fetchUserOrders(user.email), 15000); // 15s updates for users
      return () => clearInterval(interval);
    }
  }, [user]);

  // Check if Google auth returned a user on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !user) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
        const avatar = session.user.user_metadata?.avatar_url || '';
        loginWithEmail(email, name, avatar);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !user) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
        const avatar = session.user.user_metadata?.avatar_url || '';
        loginWithEmail(email, name, avatar);
      }
    });

    return () => subscription.unsubscribe();
  }, [user, loginWithEmail]);

  const handleSavePhone = async () => {
    if (phoneInput.length === 10) {
      setIsSaving(true);
      // Simulate small delay for UI feel
      await new Promise(resolve => setTimeout(resolve, 800));
      updatePhone(phoneInput);
      setIsSaving(false);
    }
  };

  // Google Sign In
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/profile' }
    });
    if (error) alert('Login failed: ' + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logoutUser();
    // Clear saved route so RouteTracker doesn't redirect back to /profile
    localStorage.removeItem('jk-last-route');
    // Force reload to the homepage for a clean state
    window.location.href = '/';
  };

  const isVerified = user?.is_student;
  const needsPhone = user && !user.phone;

  const [promoInput, setPromoInput] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'status' | 'account'>('orders');

  const handleApplyPromo = () => {
    const promo = promos.find(p => p.code.toUpperCase() === promoInput.toUpperCase() && p.is_active);
    if (!promo) {
      alert('Invalid or inactive promo code.');
      return;
    }
    setAppliedPromoCode(promo);
    setPromoInput('');
  };

  // ==========================================
  // NOT LOGGED IN — Show Google Login Screen
  // ==========================================
  if (!user) {
    return (
      <div className="pb-24 flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-600 to-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-500/20 rotate-3 transition-transform hover:rotate-0">
            <Shield size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">JK Restaurant</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-[240px] mx-auto leading-relaxed">Experience premium dining with exclusive student benefits.</p>
        </div>

        <div className="w-full max-w-sm animate-in slide-in-from-bottom duration-700">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100/50 dark:border-gray-800/50 p-8">
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/50 rounded-2xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <GraduationCap size={20} className="text-brand-600 dark:text-brand-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-brand-700 dark:text-brand-400">Student verified pricing!</p>
                  <p className="text-[11px] text-brand-600/70 dark:text-brand-500 mt-1 leading-normal font-medium">Use your college email (e.g. name@jkkn.ac.in) for automatic discounts.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="group w-full flex items-center justify-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-4.5 rounded-2xl transition-all text-sm shadow-xl hover:shadow-gray-900/30 dark:hover:shadow-white/10 active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="opacity-80"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" className="opacity-60"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="opacity-90"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHONE GATE — Simple Mandatory Number Collection
  // ==========================================
  if (needsPhone) {
    return (
      <div className="pb-24 px-4 min-h-[80vh] flex flex-col justify-center max-w-md mx-auto relative overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800 relative z-10 animate-in slide-in-from-bottom duration-700">
          
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-brand-500/20 rotate-6 transition-transform hover:rotate-0">
              <Smartphone size={36} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Almost there!</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-full inline-block">Contact Details Required</p>
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-10 leading-relaxed text-center">
            To ensure your food reaches you correctly, please provide your <span className="text-gray-900 dark:text-white font-black">10-digit mobile number</span> for order updates.
          </p>
          
          <div className="space-y-6">
            <div className="group relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <span className="text-gray-400 group-focus-within:text-brand-500 font-extrabold text-base pr-3 border-r border-gray-100 dark:border-gray-800 transition-colors">+91</span>
              </div>
              <input
                type="tel"
                placeholder="Mobile Number"
                maxLength={10}
                autoFocus
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-[1.5rem] h-16 pl-20 pr-6 outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-black text-xl tracking-wider shadow-inner"
              />
            </div>

            <button
              onClick={handleSavePhone}
              disabled={phoneInput.length !== 10 || isSaving}
              className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-gray-900/20 dark:shadow-white/10 active:scale-[0.98] disabled:opacity-30 transition-all group"
            >
              {isSaving ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  Save Details 
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button 
              onClick={handleLogout} 
              className="w-full text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-6 hover:text-rose-500 transition-all active:scale-95"
            >
              Sign out instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // FULLY LOGGED IN — Show Profile
  // ==========================================

  return (
    <div className="pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-brand-600 to-emerald-600 -mx-4 -mt-4 px-5 pt-8 pb-16 mb-[-48px] rounded-b-[3rem] shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-[1.5rem] border-2 border-white/30 shadow-xl" />
            ) : (
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border-2 border-white/30 text-2xl font-black text-white">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{user.full_name}</h2>
              <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl flex items-center justify-center hover:bg-rose-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="relative z-10 mx-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-1.5 rounded-[1.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-1">
          {[
            { id: 'orders', icon: Package, label: 'My Orders' },
            { id: 'status', icon: GraduationCap, label: 'Status' },
            { id: 'account', icon: User, label: 'Account' }
          ].map((tab) => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             return (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
               >
                 <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                 <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>{tab.label}</span>
               </button>
             );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={24} className="text-gray-400" />
                </div>
                <p className="font-black text-sm text-gray-800 dark:text-white mb-1">No orders yet</p>
                <p className="text-xs text-gray-500">Your recent orders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 relative overflow-hidden">
                    {order.status === 'out_for_delivery' && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 animate-pulse"></div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</span>
                        <h4 className="font-black text-lg text-gray-900 dark:text-white mt-0.5 tracking-tight">₹{order.total_amount}</h4>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        order.status === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' :
                        order.status === 'out_for_delivery' ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-lg shadow-brand-500/20 animate-pulse' :
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {order.status === 'out_for_delivery' ? '🚗 Out for Delivery' : order.status}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 mb-4 space-y-1.5">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center justify-between">
                          <span><span className="font-black text-gray-900 dark:text-white mr-1.5 w-4 inline-block">{item.quantity}x</span> {item.name}</span>
                          <span className="text-gray-400">₹{((user?.is_student ? item.student_price : item.base_price) || 0) * item.quantity}</span>
                        </p>
                      ))}
                    </div>
                    
                    {order.status === 'out_for_delivery' && (
                      <Link 
                        to={`/track/${order.id}`}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-4 rounded-[1.5rem] text-xs uppercase tracking-widest shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                      >
                        <MapPin size={16} className="animate-bounce" /> 
                        <span>Track Live Location</span>
                        <ArrowRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATUS TAB */}
        {activeTab === 'status' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-6 relative overflow-hidden">
             {isVerified && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>
             )}
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                  <GraduationCap size={20} className="text-brand-500" />
                </div>
                <div>
                  <h3 className="font-black text-lg dark:text-white tracking-tight">Student Status</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verification Center</p>
                </div>
             </div>

            {isVerified ? (
              <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 p-6 rounded-[2rem] flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-green-500/20">
                  <CheckCircle size={32} />
                </div>
                <p className="font-black text-lg text-green-700 dark:text-green-400">Verified Student</p>
                <p className="text-sm mt-2 text-green-600/80 dark:text-green-500/80 leading-relaxed font-medium">You have unlocked student-only pricing on all menu items automatically.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {appliedPromoCode ? (
                  <div className="bg-brand-50/50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-900/50 p-6 rounded-[2rem] text-center">
                    <p className="font-black text-brand-700 dark:text-brand-400 text-lg">{appliedPromoCode.code}</p>
                    <p className="text-sm mt-1 text-brand-600/80 dark:text-brand-500 font-medium">
                      {appliedPromoCode.discount_type === 'percentage' ? `${appliedPromoCode.discount_value}% OFF` : `₹${appliedPromoCode.discount_value} OFF`} active on your cart.
                    </p>
                    <button 
                      onClick={() => setAppliedPromoCode(null)}
                      className="mt-6 px-6 py-2 bg-white/50 dark:bg-black/20 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-white dark:hover:bg-black transition-colors"
                    >
                      Remove Code
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem]">
                    <div className="mb-6">
                      <p className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Regular Account</p>
                      <p className="text-xs mt-1 text-gray-500 leading-relaxed font-medium">Have a promo code? Enter it below to unlock special discounts.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="e.g. SAVE20"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-brand-500 tracking-wider placeholder:normal-case placeholder:font-medium text-center"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={!promoInput}
                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 font-black rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50 active:scale-95 shadow-xl transition-all"
                      >
                        Apply Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-black text-[15px] mb-6 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-gray-400" /> Details
            </h3>
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Full Name</span>
                <span className="text-sm font-black text-gray-900 dark:text-white">{user.full_name}</span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email Address</span>
                <span className="text-sm font-black text-gray-900 dark:text-white block truncate">{user.email}</span>
              </div>
              
              {/* Primary Phone */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Phone</span>
                  {!isEditingPhone ? (
                    <button onClick={() => { setIsEditingPhone(true); setEditPhoneValue(user.phone || ''); }} className="text-[10px] font-black text-brand-500 uppercase tracking-wider px-3 py-1 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                      {user.phone ? 'Edit' : '+ Add'}
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingPhone(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Cancel</button>
                  )}
                </div>
                {!isEditingPhone ? (
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                    {user.phone ? `+91 ${user.phone}` : <span className="text-gray-400 font-medium italic text-xs">Not added</span>}
                    {user.phone && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">+91</span>
                      <input
                        type="tel" maxLength={10} autoFocus
                        value={editPhoneValue} onChange={(e) => setEditPhoneValue(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold outline-none focus:border-brand-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (editPhoneValue.length === 10) { updatePhone(editPhoneValue); setIsEditingPhone(false); } else { alert('Valid 10-digit number required'); }
                      }}
                      className="bg-brand-500 text-white font-black text-xs px-4 rounded-xl active:scale-95 transition-all shadow-md"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Alternate Phone */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alternate Phone</span>
                  {!isEditingAltPhone ? (
                    <button onClick={() => { setIsEditingAltPhone(true); setAltPhoneValue(altPhone); }} className="text-[10px] font-black text-brand-500 uppercase tracking-wider px-3 py-1 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                      {altPhone ? 'Edit' : '+ Add'}
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingAltPhone(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Cancel</button>
                  )}
                </div>
                {!isEditingAltPhone ? (
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
                    {altPhone ? `+91 ${altPhone}` : <span className="text-gray-400 font-medium italic text-xs">Not added</span>}
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">+91</span>
                      <input
                        type="tel" maxLength={10} autoFocus
                        value={altPhoneValue} onChange={(e) => setAltPhoneValue(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-3 text-sm font-bold outline-none focus:border-brand-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (altPhoneValue.length === 10) { setAltPhone(altPhoneValue); setIsEditingAltPhone(false); } else { alert('Valid 10-digit number required'); }
                      }}
                      className="bg-brand-500 text-white font-black text-xs px-4 rounded-xl active:scale-95 transition-all shadow-md"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <button
               onClick={handleLogout}
               className="mt-8 w-full py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
            >
              Sign Out Securely
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
