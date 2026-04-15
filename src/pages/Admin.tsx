import { useState, useMemo, useEffect } from 'react';
import { useStore, isAdmin as checkIsAdmin, isRoleManager as checkIsManager, Category, ADMIN_EMAILS } from '../store';
import { Product } from '../data/mock';
import { X, TrendingUp, ShoppingBag, Plus, Edit2, Save, Search, ChevronDown, ChevronUp, ShieldAlert, Smartphone, Maximize2, ExternalLink, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ImageCropper } from '../components/ImageCropper';


export const Admin = () => {
  const { products, updateProduct, addProduct, deleteProduct, fetchProducts, user, adminOrders, fetchOrders, fetchCustomers, customers, updateOrderStatus, promos, addPromo, deletePromo, togglePromo, categories, addCategory, updateCategory, fetchCategories, toggleDriverRole, toggleRoleManagerRole, reorderCategories } = useStore();
  const navigate = useNavigate();
  
  // 1. Authorization check
  const isAdmin = checkIsAdmin(user);
  const isManager = checkIsManager(user);
  const isAuthorized = isAdmin || isManager;

  // 2. Component State Hooks
  const [activeTab, setActiveTab] = useState<'orders' | 'promos' | 'menu' | 'users'>('orders');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDish, setNewDish] = useState<Partial<Product>>({ 
    is_available: true, 
    bestseller: false, 
    spicy: false, 
    is_veg: true, 
    rating: 0, 
    reviews: 0,
    prep_time: 15
  });
  
  const [newPromo, setNewPromo] = useState({ code: '', discount_type: 'percentage' as 'percentage' | 'flat' | 'student_offer', discount_value: 10, is_active: true });
  
  const [isSyncingCategories, setIsSyncingCategories] = useState(false);
  
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [hasInitializedAccordion, setHasInitializedAccordion] = useState(false);
  const [newDishCategory, setNewDishCategory] = useState('Meals');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [newDishSubCategory, setNewDishSubCategory] = useState('Fried Rice');
  
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUserDetails] = useState<{name: string, email: string, phone: string, is_student: boolean, is_driver: boolean, is_role_manager: boolean} | null>(null);
  const [enlargedScreenshot, setEnlargedScreenshot] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [originalCategoryName, setOriginalCategoryName] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);


  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (isAdmin) {
      fetchOrders();
      fetchCustomers();
      const interval = setInterval(() => {
        fetchOrders();
        fetchCustomers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchProducts, fetchOrders, fetchCustomers, isAdmin]);

  if (!isAuthorized) {
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

  // Derive main categories from products (aligned with Home page "What's on your mind?")
  const derivedCategories = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number }>();
    products.forEach(p => {
      const key = p.sub_category || p.name;
      if (!map.has(key)) {
        // Find the image from any product in this group as fallback
        const catImg = products.find(prod => (prod.sub_category || prod.name) === key)?.image_url || '';
        map.set(key, { name: key, image: catImg, count: 0 });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  // Derive categories for filtering and grouping (matching Home page logic)
  const menuCategories = useMemo(() => {
    const names = categories.length > 0 
      ? categories.map(c => c.name) 
      : derivedCategories.map(sc => sc.name);
    return ['All', ...names];
  }, [categories, derivedCategories]);

  // Upload category image to Supabase Storage
  const uploadCategoryImage = async (file: File): Promise<{ publicUrl: string | null; error: string | null }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `category_${Date.now()}.${fileExt}`;
    const filePath = `categories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      const { error: fallbackError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (fallbackError) {
        console.error('Upload error:', uploadError, fallbackError);
        return { publicUrl: null, error: `Upload failed: ${uploadError.message} (Fallback failed: ${fallbackError.message})` };
      }
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      return { publicUrl: urlData.publicUrl, error: null };
    }

    const { data: urlData } = supabase.storage.from('category-images').getPublicUrl(filePath);
    return { publicUrl: urlData.publicUrl, error: null };
  };

  const uploadProductImage = async (file: File): Promise<{ publicUrl: string | null; error: string | null }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `product_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images') // Use 'images' as default bucket for products
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      // Fallback
      const { error: fallbackError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (fallbackError) {
        console.error('Upload Error:', uploadError, fallbackError);
        return { publicUrl: null, error: `Upload failed: ${uploadError.message} (Fallback failed: ${fallbackError.message}). Ensure you have a public 'images' bucket in Supabase.` };
      }
      const { data: urlData } = supabase.storage.from('category-images').getPublicUrl(filePath);
      return { publicUrl: urlData.publicUrl, error: null };
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
    return { publicUrl: urlData.publicUrl, error: null };
  };

  // Sync product-derived categories to DB
  const syncDerivedCategories = async () => {
    setIsSyncingCategories(true);
    let successCount = 0;
    let errorMsg = '';

    try {
      // Use useStore.getState() to get the live updated list of categories
      // and prevent multiple inserts if the store is updated concurrently.
      for (const sc of derivedCategories) {
        const currentCategories = useStore.getState().categories;
        const exists = currentCategories.some(c => c.name.toLowerCase() === sc.name.toLowerCase());
        
        if (!exists) {
          const result = await addCategory({ name: sc.name, image_url: sc.image });
          if (result.success) {
            successCount++;
          } else {
            errorMsg = result.error?.message || 'Database error occurred';
          }
        }
      }
      
      await fetchCategories();
      
      if (errorMsg) {
        alert(`Sync partially completed (${successCount} added). Error: ${errorMsg}`);
      } else if (successCount > 0) {
        alert(`Successfully synced ${successCount} new categories!`);
      }
    } catch (e: any) {
      console.error('Sync error:', e);
      alert('A critical error occurred while syncing: ' + e.message);
    }
    setIsSyncingCategories(false);
  };

  // Filter products for admin menu
  const filteredMenuProducts = useMemo(() => {
    return products.filter(p => {
      const pSub = p.sub_category || p.name;
      const matchCat = menuCategoryFilter === 'All' || pSub === menuCategoryFilter;
      const matchSearch = p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        (p.sub_category || '').toLowerCase().includes(menuSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, menuCategoryFilter, menuSearch]);

  // Group filtered products by specific category (sub_category)
  const groupedMenuProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();

    filteredMenuProducts.forEach(p => {
      const cat = p.sub_category || p.name;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(p);
    });

    const sorted: { category: string; items: Product[] }[] = [];
    
    // Sort groups to match the order in menuCategories (which follows DB order or count order)
    menuCategories.filter(c => c !== 'All').forEach(cat => {
      if (groups.has(cat)) {
        sorted.push({ category: cat, items: groups.get(cat)! });
        groups.delete(cat);
      }
    });

    // Add any remaining groups (in case a product has a category not in the derived list)
    groups.forEach((items, cat) => {
      sorted.push({ category: cat, items });
    });

    return sorted;
  }, [filteredMenuProducts, menuCategories]);

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

  // Auto-expand/collapse categories when filtering (search or category selection)
  useEffect(() => {
    if (menuCategoryFilter !== 'All' || menuSearch.trim() !== '') {
      setCollapsedCategories(new Set()); // Expand all when filtering or searching
    } else if (hasInitializedAccordion) {
      // Re-collapse when returning to 'All' list
      const allCategories = menuCategories.filter(c => c !== 'All');
      setCollapsedCategories(new Set(allCategories));
    }
  }, [menuCategoryFilter, menuSearch, menuCategories, hasInitializedAccordion]);


  
  const activeOrders = adminOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const totalRevenue = adminOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Users from dedicated customers table
  const uniqueUsers = useMemo(() => {
    return customers.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      is_student: c.is_student,
      is_driver: !!c.is_driver,
      is_role_manager: !!c.is_role_manager,
      orderCount: adminOrders.filter(o => o.user_email === c.email).length
    }));
  }, [customers, adminOrders]);

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
      case 'ready': return 'text-green-600 bg-green-50 border-green-200';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-50 border-purple-200';
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

      {/* Sticky Main Header */}
      <div className="sticky top-[73px] -mx-4 px-4 pt-2 sm:mx-0 sm:px-0 z-30 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 mb-6 pb-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Dashboard</h2>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex-shrink-0 whitespace-nowrap shadow-sm active:scale-95 ${activeTab === 'orders' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            ORDERS
          </button>
          <button 
            onClick={() => setActiveTab('promos')}
            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex-shrink-0 whitespace-nowrap shadow-sm active:scale-95 ${activeTab === 'promos' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            PROMOS
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex-shrink-0 whitespace-nowrap shadow-sm active:scale-95 ${activeTab === 'menu' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            MENU
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex-shrink-0 whitespace-nowrap shadow-sm active:scale-95 ${activeTab === 'users' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            USERS
          </button>
        </div>
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
                   <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                     order.utr_number === 'COD' 
                       ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                       : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                   }`}>
                      {order.utr_number === 'COD' ? '💵 COD' : '💳 Razorpay'}
                   </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Payment Reference</p>
                      {order.utr_number === 'COD' ? (
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">💵 Cash on Delivery — Collect ₹{order.total_amount}</p>
                      ) : order.utr_number?.startsWith('pay_') ? (
                        <p className="text-xs font-bold text-green-600 dark:text-green-400">✅ Razorpay: {order.utr_number}</p>
                      ) : (
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">UTR: {order.utr_number || 'N/A'}</p>
                      )}
                      {order.payment_screenshot_url?.startsWith('order_') && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Order: {order.payment_screenshot_url}</p>
                      )}
                    </div>
                    {order.payment_screenshot_url && !order.payment_screenshot_url.startsWith('order_') && (
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
                      onClick={() => updateOrderStatus(order.id, order.order_mode === 'delivery' ? 'ready' : 'completed')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-2.5 rounded-xl text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                    >
                      {order.order_mode === 'delivery' ? '✅ Food Ready' : 'Mark Completed'}
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-black py-2.5 rounded-xl text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                    >
                      🚗 Send to Driver
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                    >
                      Mark Delivered
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

      {activeTab === 'promos' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-black text-sm text-gray-800 dark:text-white mb-4 uppercase tracking-wider">Create Promo Code</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input 
                  type="text" 
                  value={newPromo.code} 
                  onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-1 uppercase"
                  placeholder="e.g., WINTER10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Discount Type</label>
                <select 
                  value={newPromo.discount_type} 
                  onChange={e => setNewPromo({...newPromo, discount_type: e.target.value as 'percentage' | 'flat' | 'student_offer'})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                  <option value="student_offer">Student Offer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Discount Value</label>
                <input 
                  type="number" 
                  value={newPromo.discount_value} 
                  onChange={e => setNewPromo({...newPromo, discount_value: Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none"
                  placeholder="Optional min amount"
                />
              </div>
            </div>
            <button 
              onClick={() => {
                if (newPromo.code && (newPromo.discount_type === 'student_offer' || newPromo.discount_value > 0)) {
                  addPromo({ ...newPromo });
                  setNewPromo({ code: '', discount_type: 'percentage', discount_value: 10, is_active: true });
                }
              }}
              className="bg-brand-500 text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-transform"
            >
              Add Promo Code
            </button>
          </div>

          <div className="space-y-3 mt-6">
            <h3 className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-wider mb-3">Active Promos ({promos.length})</h3>
            {promos.length === 0 ? (
               <p className="text-gray-500 text-sm">No promo codes created yet.</p>
            ) : (
              promos.map(promo => (
                <div key={promo.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm">
                  <div>
                    <h4 className="font-black text-brand-600 dark:text-brand-400 text-lg uppercase tracking-wider">{promo.code}</h4>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
                      {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : 
                       promo.discount_type === 'flat' ? `₹${promo.discount_value} FLAT RATE` : 
                       'STUDENT PRICES'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={promo.is_active} onChange={(e) => togglePromo(promo.id, e.target.checked)} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                    </label>
                    <button 
                      onClick={() => deletePromo(promo.id)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-4">
          
          {/* Sync Banner Integration (Moved from Categories Tab) */}
          {categories.length === 0 && derivedCategories.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top duration-500 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                  <RefreshCw size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-[13px] text-amber-800 dark:text-amber-300 uppercase tracking-wider">Sync Menu Categories</h4>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 leading-tight font-medium">
                    We found <strong>{derivedCategories.length}</strong> categories in your menu. Save them to the DB to enable images and editing.
                  </p>
                  <button
                    onClick={syncDerivedCategories}
                    disabled={isSyncingCategories}
                    className="mt-3 bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 px-6 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw size={12} className={isSyncingCategories ? 'animate-spin' : ''} />
                    {isSyncingCategories ? 'Syncing...' : `Sync ${derivedCategories.length} Items`}
                  </button>
                </div>
              </div>
            </div>
          )}

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
          {groupedMenuProducts.map(({ category, items }) => {
            // Find DB Category metadata
            const categoryData = categories.find(c => c.name.toLowerCase() === category.toLowerCase());
            const categoryImage = categoryData?.image_url || (derivedCategories.find((sc: any) => sc.name.toLowerCase() === category.toLowerCase())?.image);

            return (
              <div 
                key={category} 
                className={`group/cat transition-all duration-300 ${dragOverCategory === category ? 'opacity-50 scale-[0.98]' : 'opacity-100'} ${draggedCategory === category ? 'opacity-30' : ''}`}
                draggable={!!categoryData} // Can only drag if it's synced to DB
                onDragStart={(e) => {
                  setDraggedCategory(category);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedCategory && categoryData) {
                    setDragOverCategory(category);
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDragLeave={() => {
                  setDragOverCategory(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCategory(null);
                  if (!draggedCategory || draggedCategory === category || !categoryData) return;
                  
                  // Reorder DB categories array
                  const oldIndex = categories.findIndex(c => c.name === draggedCategory);
                  const newIndex = categories.findIndex(c => c.name === category);
                  
                  if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = [...categories];
                    const [moved] = newOrder.splice(oldIndex, 1);
                    newOrder.splice(newIndex, 0, moved);
                    reorderCategories(newOrder);
                  }
                  
                  setDraggedCategory(null);
                }}
                onDragEnd={() => setDraggedCategory(null)}
              >
                {/* Category Header (collapsible) */}
                <div className={`flex gap-2 items-stretch items-center mb-2 ${categoryData ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                  <button
                    onClick={() => toggleCollapse(category)}
                    className="flex-1 flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-2.5 rounded-2xl transition-all hover:border-brand-200 dark:hover:border-brand-900/50 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-50 dark:border-gray-800 bg-gray-100 dark:bg-gray-700 shadow-inner flex-shrink-0">
                        <img 
                          src={categoryImage} 
                          alt={category} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100'; }}
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight leading-none mb-0.5">{category}</h3>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{items.length} items on menu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-gray-400">
                        {collapsedCategories.has(category) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </div>
                  </button>
                  
                  {/* Category Action Buttons */}
                  <div className="flex gap-1">
                    <button 
                      onClick={async () => {
                        if (categoryData) {
                          setOriginalCategoryName(categoryData.name);
                          setEditingCategory(categoryData);
                        } else {
                          // Force quick create so we have an ID to edit
                          const { data, error } = await supabase.from('categories').insert([{ name: category, image_url: categoryImage || '' }]).select();
                          if (!error && data) {
                             await fetchCategories();
                             setOriginalCategoryName(data[0].name);
                             setEditingCategory(data[0]);
                          } else {
                            alert('Could not initialize category for editing. Please try the Sync button at the top.');
                          }
                        }
                      }}
                      className="w-11 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-500 hover:border-brand-200 transition-all shadow-sm active:scale-95"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
                
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
                              onChange={async (e) => {
                                if(e.target.files && e.target.files[0]) {
                                  const localUrl = URL.createObjectURL(e.target.files[0]);
                                  updateProduct(product.id, { image_url: localUrl });
                                  const { publicUrl, error } = await uploadProductImage(e.target.files[0]);
                                  if (publicUrl) {
                                    updateProduct(product.id, { image_url: publicUrl });
                                  } else {
                                    alert(error || 'Image upload failed. Please try again.');
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-bold text-sm truncate ${product.is_available ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{product.name}</h4>
                                {product.is_veg && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" title="Veg"></span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{product.sub_category}</span>
                                {product.bestseller && (
                                  <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Bestseller</span>
                                )}
                                {product.spicy && (
                                  <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">Spicy</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => setEditingProduct({ ...product })}
                                className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center hover:bg-brand-100 transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(product)}
                                className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={product.is_available} onChange={(e) => updateProduct(product.id, { is_available: e.target.checked })} />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
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
                        <div>
                          <label className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Prep (m)</label>
                          <div className="flex items-center mt-1">
                            <input 
                              type="number" 
                              value={product.prep_time || 15} 
                              onChange={(e) => updateProduct(product.id, { prep_time: Number(e.target.value) })}
                              className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-none rounded py-1 px-2 text-sm font-bold outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

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
                {selectedUser.is_driver && (
                   <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-100 dark:border-emerald-800">
                     🛵 STAFF
                   </span>
                )}
                {selectedUser.is_role_manager && (
                   <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-brand-50 dark:bg-brand-900/30 text-brand-600 border border-brand-100 dark:border-brand-900/30">
                     🔑 MANAGER
                   </span>
                )}
                {ADMIN_EMAILS.includes(selectedUser.email) && (
                   <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-gray-900 dark:bg-white text-white dark:text-gray-900 border border-gray-800 dark:border-gray-200 shadow-sm">
                     ⚡ ADMIN
                   </span>
                )}
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

              {/* Roles Management */}
              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Privileges & Roles</p>
                
                {/* Manager Role */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight mb-0.5">Manager Access</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-tight">Can manage orders, products, and most user roles.</p>
                  </div>
                  <label className={`relative inline-flex items-center cursor-pointer ml-4 ${ADMIN_EMAILS.includes(selectedUser.email) && !isAdmin ? 'opacity-30 cursor-not-allowed' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={selectedUser.is_role_manager} 
                      disabled={ADMIN_EMAILS.includes(selectedUser.email) && !isAdmin}
                      onChange={async (e) => {
                        const newStatus = e.target.checked;
                        await toggleRoleManagerRole(selectedUser.email, newStatus);
                        setSelectedUserDetails({ ...selectedUser, is_role_manager: newStatus });
                      }} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                {/* Delivery Role */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight mb-0.5">Staff Account</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-tight">Authorize this user to accept and deliver orders.</p>
                  </div>
                  <label className={`relative inline-flex items-center cursor-pointer ml-4 ${ADMIN_EMAILS.includes(selectedUser.email) && !isAdmin ? 'opacity-30 cursor-not-allowed' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={selectedUser.is_driver} 
                      disabled={ADMIN_EMAILS.includes(selectedUser.email) && !isAdmin}
                      onChange={async (e) => {
                        const newStatus = e.target.checked;
                        await toggleDriverRole(selectedUser.email, newStatus);
                        setSelectedUserDetails({ ...selectedUser, is_driver: newStatus });
                      }} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                  </label>
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-300 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tight">Edit Category</h3>
              <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Category Name</label>
                <input 
                  type="text" 
                  value={editingCategory.name} 
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">Category Image URL</label>
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={editingCategory.image_url} 
                    onChange={e => setEditingCategory({...editingCategory, image_url: e.target.value})}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                  <div className="relative">
                    <button className="h-full px-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 flex items-center justify-center">
                      <Upload size={18} />
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const { publicUrl, error } = await uploadCategoryImage(e.target.files[0]);
                          if (publicUrl) {
                             setEditingCategory({...editingCategory!, image_url: publicUrl});
                          } else {
                             alert(error || 'Category image upload failed.');
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {editingCategory.image_url && (
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <img src={editingCategory.image_url} className="w-14 h-14 rounded-xl object-cover shadow-sm bg-white" alt="" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-snug">Preview of how it appears on Home page</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!editingCategory) return;
                    setIsSavingCategory(true);
                    try {
                      // 1. Update the category itself
                      const result = await updateCategory(editingCategory.id, { name: editingCategory.name, image_url: editingCategory.image_url });
                      
                      if (!result.success) {
                        alert('Could not update category: ' + (result.error?.message || 'Unknown error'));
                        setIsSavingCategory(false);
                        return;
                      }
                      // 2. Propagate name change to all products if changed
                      if (editingCategory.name !== originalCategoryName) {
                        const productsToUpdate = products.filter(p => (p.sub_category || p.name) === originalCategoryName);
                        for (const product of productsToUpdate) {
                          await updateProduct(product.id, { sub_category: editingCategory.name });
                        }
                        await fetchProducts();
                      }
                      
                      setEditingCategory(null);
                    } catch (e) {
                      console.error('Error saving category:', e);
                      alert('Error saving category changes.');
                    }
                    setIsSavingCategory(false);
                  }}
                  className="flex-1 py-4 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingCategory ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-5 shadow-xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">

            {/* Cropper overlay within modal */}
            {cropperSrc ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-base dark:text-white uppercase tracking-wider">Crop Image</h3>
                  <button onClick={() => setCropperSrc(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>
                <ImageCropper
                  imageSrc={cropperSrc}
                  aspectRatio={16 / 10}
                  onCancel={() => setCropperSrc(null)}
                  onCropComplete={async (dataUrl) => {
                    setCropperSrc(null);
                    // Set local preview immediately
                    setEditingProduct(prev => prev ? { ...prev, image_url: dataUrl } : prev);
                    // Upload to Supabase
                    try {
                      const blob = await (await fetch(dataUrl)).blob();
                      const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
                      const { publicUrl, error } = await uploadProductImage(file);
                      if (publicUrl) {
                        setEditingProduct(prev => prev ? { ...prev, image_url: publicUrl } : prev);
                      } else {
                        alert(error || 'Upload failed');
                      }
                    } catch (e) {
                      console.error('Crop upload error:', e);
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-black text-base dark:text-white uppercase tracking-wider">Edit Dish</h3>
                  <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
                </div>

                {/* Image preview + crop/change buttons */}
                <div className="mb-4">
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={editingProduct.image_url}
                      alt={editingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setCropperSrc(editingProduct.image_url)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-wider border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors active:scale-95"
                    >
                      ✂️ Crop Existing
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-wider border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95">
                      <Upload size={13} /> Change Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setCropperSrc(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Dish Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Description</label>
                    <textarea
                      value={editingProduct.description}
                      rows={3}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Sub-Category</label>
                    <input
                      type="text"
                      value={editingProduct.sub_category}
                      onChange={e => setEditingProduct({ ...editingProduct, sub_category: e.target.value })}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Base ₹</label>
                      <input type="number" value={editingProduct.base_price} onChange={e => setEditingProduct({ ...editingProduct, base_price: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-600 mb-1 uppercase">Student ₹</label>
                      <input type="number" value={editingProduct.student_price} onChange={e => setEditingProduct({ ...editingProduct, student_price: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-600 mb-1 uppercase">Prep (m)</label>
                      <input type="number" value={editingProduct.prep_time || 15} onChange={e => setEditingProduct({ ...editingProduct, prep_time: Number(e.target.value) })} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingProduct.is_veg} onChange={e => setEditingProduct({ ...editingProduct, is_veg: e.target.checked })} className="w-4 h-4 accent-green-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Veg</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingProduct.bestseller} onChange={e => setEditingProduct({ ...editingProduct, bestseller: e.target.checked })} className="w-4 h-4 accent-brand-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Bestseller</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingProduct.spicy} onChange={e => setEditingProduct({ ...editingProduct, spicy: e.target.checked })} className="w-4 h-4 accent-red-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Spicy</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                    Cancel
                  </button>
                  <button
                    disabled={isSavingProduct}
                    onClick={async () => {
                      if (!editingProduct) return;
                      setIsSavingProduct(true);
                      await updateProduct(editingProduct.id, {
                        name: editingProduct.name,
                        description: editingProduct.description,
                        sub_category: editingProduct.sub_category,
                        base_price: editingProduct.base_price,
                        student_price: editingProduct.student_price,
                        prep_time: editingProduct.prep_time,
                        is_veg: editingProduct.is_veg,
                        bestseller: editingProduct.bestseller,
                        spicy: editingProduct.spicy,
                        image_url: editingProduct.image_url,
                      });
                      setIsSavingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-3 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingProduct ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">Delete Dish?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              You're about to permanently delete
            </p>
            <p className="font-black text-brand-600 dark:text-brand-400 mb-5">"{deleteConfirmProduct.name}"</p>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone. The item will be removed from the menu immediately.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteProduct(deleteConfirmProduct.id);
                  setDeleteConfirmProduct(null);
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                <input type="text" maxLength={100} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="E.g. Garlic Naan" onChange={e => setNewDish({...newDish, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea maxLength={500} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500 h-20" placeholder="Delicious soft naan..." onChange={e => setNewDish({...newDish, description: e.target.value})}></textarea>
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Main Category</label>
                  <select 
                    value={newDishCategory} 
                    onChange={e => setNewDishCategory(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="Meals">Meals</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Coolers">Coolers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Menu Group (Sub-Category)</label>
                  {!isAddingNewCategory ? (
                    <select 
                      value={newDishSubCategory} 
                      onChange={e => {
                        if (e.target.value === 'NEW') {
                          setIsAddingNewCategory(true);
                          setNewDishSubCategory('');
                        } else {
                          setNewDishSubCategory(e.target.value);
                        }
                      }}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500"
                    >
                      {menuCategories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="NEW" className="text-brand-500 font-bold">➕ Add New Group</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text" 
                        autoFocus
                        maxLength={50}
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 50))} // added basic sanitization
                        placeholder="Group name (e.g. Pasta)"
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Base Price</label>
                  <input type="number" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="100" onChange={e => setNewDish({...newDish, base_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">Student Price</label>
                  <input type="number" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="80" onChange={e => setNewDish({...newDish, student_price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Prep Time (min)</label>
                  <input type="number" value={newDish.prep_time} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:border-brand-500" placeholder="15" onChange={e => setNewDish({...newDish, prep_time: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Dish Image</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        // Local preview
                        const localUrl = URL.createObjectURL(e.target.files[0]);
                        setNewDish({...newDish, image_url: localUrl});
                        
                        // Store the file to upload on save OR upload now and store URL
                        // Let's upload now and store the resulting URL in state
                        const { publicUrl, error } = await uploadProductImage(e.target.files[0]);
                        if (publicUrl) {
                          setNewDish(prev => ({...prev, image_url: publicUrl}));
                        } else {
                          alert(error || 'Dish image upload failed.');
                        }
                      }
                    }}
                    className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm dark:bg-gray-800 dark:text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" 
                  />
                  {newDish.image_url && (
                    <img src={newDish.image_url} className="w-12 h-12 object-cover rounded-lg border border-gray-100 shadow-sm" alt=""/>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  if(newDish.name && newDish.base_price) {
                    const finalSubCategory = isAddingNewCategory ? customCategory : newDishSubCategory;
                    if (!finalSubCategory) return alert('Please enter or select a menu group (Sub-Category)');

                    addProduct({
                      ...newDish,
                      category: newDishCategory || 'Meals', // Keep a fallback category
                      sub_category: finalSubCategory,
                    } as Omit<Product, 'id'>);
                    setShowAddModal(false);
                    setNewDish({ is_available: true, bestseller: false, spicy: false, is_veg: true, rating: 0, reviews: 0, prep_time: 15 });
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

      {/* Enlarged Screenshot Modal */}
      {enlargedScreenshot && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setEnlargedScreenshot(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-[101]"
            onClick={(e) => { e.stopPropagation(); setEnlargedScreenshot(null); }}
          >
            <X size={24} />
          </button>
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img src={enlargedScreenshot} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500 border border-white/10" alt="Payment Proof" />
            <div className="absolute -bottom-12 left-0 right-0 text-center">
              <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Payment Proof Screenshot</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
