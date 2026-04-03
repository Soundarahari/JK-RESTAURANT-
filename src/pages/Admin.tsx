import { useState, useMemo, useEffect } from 'react';
import { useStore, isAdmin as checkIsAdmin } from '../store';
import { Product } from '../data/mock';
import { X, TrendingUp, ShoppingBag, Plus, Edit2, Save, Search, ChevronDown, ChevronUp, ShieldAlert, Smartphone, Maximize2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Admin = () => {
  const { products, updateProduct, addProduct, fetchProducts, user, verifications, updateVerificationStatus, adminOrders, fetchOrders, updateOrderStatus } = useStore();
  const navigate = useNavigate();
  
  // 1. Admin Authorization check first
  const isAdmin = checkIsAdmin(user);

  // 2. Component State Hooks
  const [activeTab, setActiveTab] = useState<'orders' | 'verification' | 'menu' | 'users'>('orders');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDish, setNewDish] = useState<Partial<Product>>({ 
    is_available: true, 
    bestseller: false, 
    spicy: false, 
    is_veg: true, 
    rating: 0, 
    reviews: 0 
  });
  
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [hasInitializedAccordion, setHasInitializedAccordion] = useState(false);
  const [newDishCategory, setNewDishCategory] = useState('Chinese');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [newDishSubCategory, setNewDishSubCategory] = useState('');
  
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUserDetails] = useState<{name: string, email: string, phone: string, is_student: boolean} | null>(null);
  const [enlargedScreenshot, setEnlargedScreenshot] = useState<string | null>(null);

  // 3. Side Effects (Data Fetching)
  useEffect(() => {
    fetchProducts();
    if (isAdmin) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchProducts, fetchOrders, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShieldAlert size={40} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs leading-relaxed">
          This area is restricted to JK Restaurant staff only. Please log in with an admin account to proceed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider"
        >
          Return to Hub
        </button>
      </div>
    );
  }
  
  // Admin search & category filter

  // Derive categories from products
  const menuCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  // Filter products for admin menu
  const filteredMenuProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = menuCategoryFilter === 'All' || p.category === menuCategoryFilter;
      const matchSearch = p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        (p.sub_category || '').toLowerCase().includes(menuSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, menuCategoryFilter, menuSearch]);

  // Group filtered products by category
  const groupedMenuProducts = useMemo(() => {
    const groupOrder = ['Meals', 'Chinese', 'Snacks', 'Fast Food', 'Coolers'];
    const groups = new Map<string, Product[]>();

    filteredMenuProducts.forEach(p => {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category)!.push(p);
    });

    const sorted: { category: string; items: Product[] }[] = [];
    groupOrder.forEach(cat => {
      if (groups.has(cat)) {
        sorted.push({ category: cat, items: groups.get(cat)! });
        groups.delete(cat);
      }
    });
    groups.forEach((items, cat) => {
      sorted.push({ category: cat, items });
    });

    return sorted;
  }, [filteredMenuProducts]);

  // Initial Accordion State: Close all except the last one
  useEffect(() => {
    if (groupedMenuProducts.length > 0 && !hasInitializedAccordion) {
      const allCategories = groupedMenuProducts.map(g => g.category);
      if (allCategories.length > 1) {
        // Close everything except the last category
        const initialCollapsed = new Set(allCategories.slice(0, -1));
        setCollapsedCategories(initialCollapsed);
      }
      setHasInitializedAccordion(true);
    }
  }, [groupedMenuProducts, hasInitializedAccordion]);

  const toggleCollapse = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  
  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const activeOrders = adminOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const totalRevenue = adminOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Derived Users List
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, {name: string, email: string, phone: string, is_student: boolean, orderCount: number}>();
    
    adminOrders.forEach(order => {
      if (!userMap.has(order.user_email)) {
        userMap.set(order.user_email, {
          name: order.user_name,
          email: order.user_email,
          phone: order.user_phone,
          is_student: order.user_email.includes('.ac.in') || order.user_email.includes('jkkn') || order.user_email.includes('ssm'), // Simplified check
          orderCount: 1
        });
      } else {
        const u = userMap.get(order.user_email)!;
        u.orderCount += 1;
      }
    });

    return Array.from(userMap.values());
  }, [adminOrders]);

  const filteredUsers = useMemo(() => {
    return uniqueUsers.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [uniqueUsers, userSearch]);

  const studentUsers = filteredUsers.filter(u => u.is_student);
  const regularUsers = filteredUsers.filter(u => !u.is_student);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'preparing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="pb-24">
      
      {/* Merchant Insights */}
      <div className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar">
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-4 min-w-[140px] text-white shadow-sm flex-1">
          <div className="flex items-center gap-1.5 mb-1 opacity-90"><TrendingUp size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Revenue</span></div>
          <p className="text-2xl font-black">₹{totalRevenue}</p>
          <p className="text-[10px] mt-1 opacity-80">{adminOrders.filter(o => o.status === 'completed').length} completed sales</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 min-w-[140px] shadow-sm flex-1 transition-colors">
          <div className="flex items-center gap-1.5 mb-1 text-gray-500 dark:text-gray-400"><ShoppingBag size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Orders</span></div>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{activeOrders.length}</p>
          <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-500 font-medium">{adminOrders.length} total ever</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Dashboard</h2>
      
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          ORDERS
        </button>
        <button 
          onClick={() => setActiveTab('verification')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors relative ${activeTab === 'verification' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          VERIFY
          {pendingVerifications.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 font-black shadow-sm">
              {pendingVerifications.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'menu' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          MENU
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'users' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          USERS
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {adminOrders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No orders yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">New orders will appear here in real-time</p>
            </div>
          ) : (
            adminOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm transition-all hover:border-brand-200 dark:hover:border-brand-900/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-[15px] dark:text-white leading-none mb-1.5 uppercase tracking-tight">{order.user_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md uppercase tracking-wider">#ID-{order.id.slice(0,4)}</span>
                      <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border animate-pulse-slow ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-3 mb-4 space-y-2 border border-gray-100 dark:border-gray-800/50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        <span className="font-black text-gray-900 dark:text-white mr-1.5">{item.quantity}x</span> {item.name}
                      </p>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Grand Total</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">₹{order.total_amount}</span>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                   <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      <Smartphone size={12} /> {order.user_phone}
                   </div>
                   <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {order.order_mode === 'takeaway' ? '🥡 Counter Pick' : '🛵 Door Delivery'}
                   </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Payment Reference</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">UTR: {order.utr_number || 'N/A'}</p>
                    </div>
                    {order.payment_screenshot_url && (
                      <button 
                        onClick={() => setEnlargedScreenshot(order.payment_screenshot_url)}
                        className="flex items-center gap-1.5 text-[10px] font-black text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                      >
                        <Maximize2 size={12} /> VIEW PROOF
                      </button>
                    )}
                  </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-black py-2.5 rounded-xl text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                    >
                      Process Order
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                    >
                      Mark Completed
                    </button>
                  )}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                     <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="w-12 h-10 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 flex items-center justify-center rounded-xl transition-colors border border-gray-100 dark:border-gray-700"
                      >
                        <X size={18} />
                      </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="space-y-4">
          {pendingVerifications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-5xl mb-3">🎓</div>
              <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">Clear Coast!</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No pending student ID verifications</p>
            </div>
          ) : (
            pendingVerifications.map(req => (
              <div key={req.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm animate-fade-in translate-y-0 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-sm">{req.user_name}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter mt-1">{req.user_email}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-black uppercase rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                    Pending
                  </div>
                </div>

                <div className="relative group mb-4">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">ID Card Evidence</p>
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner border border-gray-100 dark:border-gray-800">
                    <img 
                      src={req.id_card_url} 
                      alt="Student ID Card" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateVerificationStatus(req.id, 'confirmed')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateVerificationStatus(req.id, 'rejected')}
                    className="flex-1 bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-black py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-4">
          {/* Search Bar & Controls */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search menu items..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-brand-500 text-white px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-brand-600 shadow-sm flex-shrink-0"
            >
              <Plus size={14} /> NEW
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {menuCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setMenuCategoryFilter(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  menuCategoryFilter === cat
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Category-wise collapsible sections */}
          {groupedMenuProducts.map(({ category, items }) => (
            <div key={category}>
              {/* Category Header (collapsible) */}
              <button
                onClick={() => toggleCollapse(category)}
                className="w-full flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl mb-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-gray-800 dark:text-white">{category}</h3>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{items.length} items</span>
                </div>
                {collapsedCategories.has(category) ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronUp size={18} className="text-gray-500" />}
              </button>
              
              {/* Items (collapsible) */}
              {!collapsedCategories.has(category) && (
                <div className="space-y-3 mb-4">
                  {items.map(product => (
                    <div key={product.id} className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-4 transition-colors ${product.is_available ? 'border-gray-100 dark:border-gray-800' : 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/5'}`}>
                      <div className="flex gap-3 mb-3">
                        <div className="relative flex-shrink-0 group">
                          <img src={product.image_url} className="w-16 h-16 rounded-lg object-cover" alt="" />
                          <label className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Edit2 size={14} className="text-white" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => {
                                if(e.target.files && e.target.files[0]) {
                                  updateProduct(product.id, { image_url: URL.createObjectURL(e.target.files[0]) });
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`font-bold text-sm ${product.is_available ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{product.name}</h4>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{product.sub_category}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={product.is_available} onChange={(e) => updateProduct(product.id, { is_available: e.target.checked })} />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Base Price</label>
                          <div className="flex items-center mt-1">
                            <span className="text-gray-500 text-sm font-bold mr-1">₹</span>
                            <input 
                              type="number" 
                              value={product.base_price} 
                              onChange={(e) => updateProduct(product.id, { base_price: Number(e.target.value) })}
                              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded py-1 px-2 text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-brand-600 dark:text-brand-400 uppercase font-bold tracking-wider">Student Price</label>
                          <div className="flex items-center mt-1">
                            <span className="text-brand-600 dark:text-brand-400 text-sm font-bold mr-1">₹</span>
                            <input 
                              type="number" 
                              value={product.student_price} 
                              onChange={(e) => updateProduct(product.id, { student_price: Number(e.target.value) })}
                              className="w-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border-none rounded py-1 px-2 text-sm font-bold outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredMenuProducts.length === 0 && (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No items match "{menuSearch}"</p>
              <button onClick={() => { setMenuSearch(''); setMenuCategoryFilter('All'); }} className="mt-2 text-brand-600 dark:text-brand-400 font-bold text-sm">Clear Search</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 sticky top-[100px] z-20 pt-2 bg-gray-50 dark:bg-gray-950/80 backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search customers by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-500 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-8">
            {/* Students Section */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Student Community ({studentUsers.length})</h3>
              </div>
              <div className="grid gap-3">
                {studentUsers.length > 0 ? studentUsers.map(u => (
                  <button 
                    key={u.email}
                    onClick={() => setSelectedUserDetails(u)}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm text-left active:scale-[0.98] transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">{u.name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                    </div>
                    <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 p-2 rounded-lg">
                      <ChevronDown size={14} className="-rotate-90" />
                    </div>
                  </button>
                )) : (
                  <p className="text-xs text-gray-400 italic px-1">No students found matching your search.</p>
                )}
              </div>
            </section>

            {/* Regulars Section */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Regular Customers ({regularUsers.length})</h3>
              </div>
              <div className="grid gap-3">
                {regularUsers.length > 0 ? regularUsers.map(u => (
                  <button 
                    key={u.email}
                    onClick={() => setSelectedUserDetails(u)}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm text-left active:scale-[0.98] transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">{u.name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 text-gray-400 p-2 rounded-lg">
                      <ChevronDown size={14} className="-rotate-90" />
                    </div>
                  </button>
                )) : (
                  <p className="text-xs text-gray-400 italic px-1">No regular customers found matching your search.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Screenshot Enlarger Modal */}
      {enlargedScreenshot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setEnlargedScreenshot(null)}></div>
          <div className="relative w-full max-w-sm animate-in zoom-in duration-300">
            <button 
              onClick={() => setEnlargedScreenshot(null)}
              className="absolute -top-12 right-0 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </button>
            <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payment Proof Verification</span>
              </div>
              <img src={enlargedScreenshot} alt="Payment Receipt" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUserDetails(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-gray-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 outline-none">
            <button onClick={() => setSelectedUserDetails(null)} className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-400"><X size={20}/></button>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-brand-500 text-white rounded-3xl mx-auto flex items-center justify-center text-3xl font-black shadow-xl shadow-brand-500/20 mb-4 uppercase">
                {selectedUser.name.charAt(0)}
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedUser.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${selectedUser.is_student ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 border border-indigo-100 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'}`}>
                  {selectedUser.is_student ? '🎓 STUDENT' : '👤 REGULAR'}
                </span>
                <span className="text-[10px] font-bold text-gray-400">Loyalty Member</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Primary Email</p>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedUser.email}</span>
                  <ExternalLink size={14} className="text-gray-300" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Contact Number</p>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">{selectedUser.phone || 'Not Provided'}</span>
                  <Smartphone size={14} className="text-gray-300" />
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserDetails(null)}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest mt-4 shadow-xl active:scale-95 transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-5 shadow-xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-white">Add New Dish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Dish Name</label>
                <input type="text" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="E.g. Garlic Naan" onChange={e => setNewDish({...newDish, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500 h-20" placeholder="Delicious soft naan..." onChange={e => setNewDish({...newDish, description: e.target.value})}></textarea>
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  {!isAddingNewCategory ? (
                    <select 
                      value={newDishCategory} 
                      onChange={e => {
                        if (e.target.value === 'NEW') {
                          setIsAddingNewCategory(true);
                        } else {
                          setNewDishCategory(e.target.value);
                        }
                      }}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500"
                    >
                      {menuCategories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="NEW" className="text-brand-500 font-bold">➕ Add New Category</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text" 
                        autoFocus
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        placeholder="Enter category name"
                        className="w-full border border-brand-300 dark:border-brand-900/50 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500"
                      />
                      <button 
                        onClick={() => setIsAddingNewCategory(false)}
                        className="absolute right-2 top-2 text-[10px] font-black text-gray-400 uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Sub Category</label>
                  <input type="text" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="E.g. Fried Rice" value={newDishSubCategory} onChange={e => setNewDishSubCategory(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Base Price (₹)</label>
                  <input type="number" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="100" onChange={e => setNewDish({...newDish, base_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">Student Price (₹)</label>
                  <input type="number" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="80" onChange={e => setNewDish({...newDish, student_price: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Dish Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewDish({...newDish, image_url: URL.createObjectURL(e.target.files[0])});
                    }
                  }}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm dark:bg-gray-800 dark:text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" 
                />
                {newDish.image_url && (
                   <img src={newDish.image_url} className="mt-2 w-16 h-16 object-cover rounded-lg" alt=""/>
                )}
              </div>
              <button 
                onClick={() => {
                  if(newDish.name && newDish.base_price) {
                    const finalCategory = isAddingNewCategory ? customCategory : newDishCategory;
                    if (!finalCategory) return alert('Please enter or select a category');

                    addProduct({
                      ...newDish,
                      category: finalCategory,
                      sub_category: newDishSubCategory || newDish.name || '',
                    } as Omit<Product, 'id'>);
                    setShowAddModal(false);
                    setNewDish({ is_available: true, bestseller: false, spicy: false, is_veg: true, rating: 0, reviews: 0 });
                    setNewDishSubCategory('');
                    setIsAddingNewCategory(false);
                    setCustomCategory('');
                  }
                }}
                className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
