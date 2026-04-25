import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, MOCK_PRODUCTS } from '../data/mock';
import { supabase } from '../lib/supabase';

export interface CartItem extends Product {
  quantity: number;
}

// Order interface for Supabase matching
export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  items: CartItem[];
  total_amount: number;
  order_mode: 'delivery' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'out_for_delivery';
  payment_screenshot_url: string | null; // stores razorpay_order_id for new orders
  utr_number: string | null; // stores razorpay_payment_id for new orders
  created_at: string;
  delivery_address?: string;
  delivery_location?: { lat: number, lng: number } | null;
  telegram_manager_msg_id?: string | null;
  telegram_driver_msg_id?: string | null;
  driver_id?: string | null;
  driver_name?: string | null;
}

// Known student email domains — if user's email ends with one of these, they're a student
export const STUDENT_DOMAINS = ['jkkn.ac.in', 'ssm.ac.in', 'excel.ac.in', 'jkkm.ac.in', 'vivekanandha.ac.in'];

export function isStudentEmail(email: string): boolean {
  return STUDENT_DOMAINS.some(domain => email.toLowerCase().endsWith(`@${domain}`) || email.toLowerCase().includes(`.${domain}`));
}

export const ADMIN_EMAILS = ['soundarahari050@gmail.com', 'jkrestaurant2026@gmail.com'];

export function isAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email);
}

export function isRoleManager(user: UserProfile | null): boolean {
  if (!user) return false;
  return !!user.is_role_manager;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  is_student: boolean;
  is_driver: boolean;
  is_role_manager: boolean;
  college_name?: string;
}

export interface Promo {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat' | 'student_offer';
  discount_value: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar_url?: string;
  is_student: boolean;
  is_driver: boolean;
  is_role_manager: boolean;
  created_at: string;
  last_login: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string;
  created_at?: string;
  display_order?: number;
}

export interface AppNotification {
  id: string;
  created_at: string;
  user_email: string | null;
  target_role: string | null;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
}

export interface SiteSettings {
  platform_fee: number;
  gst_rate: number;
  delivery_fee_near: number;
  delivery_fee_far: number;
  delivery_fee_threshold_km: number;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  platform_fee: 5,
  gst_rate: 5,
  delivery_fee_near: 20,
  delivery_fee_far: 40,
  delivery_fee_threshold_km: 3,
};

interface AppState {
  user: UserProfile | null;
  cart: CartItem[];
  products: Product[];
  siteSettings: SiteSettings;
  orders: Order[];
  adminOrders: Order[];
  customers: Customer[];
  orderMode: 'delivery' | 'takeaway';
  promos: Promo[];
  appliedPromoCode: Promo | null;
  notifications: AppNotification[];
  setOrderMode: (mode: 'delivery' | 'takeaway') => void;
  setUser: (user: UserProfile | null) => void;
  loginWithEmail: (email: string, name: string, avatarUrl?: string) => void;
  updatePhone: (phone: string) => void;
  logoutUser: () => void;
  categories: Category[];
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: any }>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<{ success: boolean; error?: any }>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (reorderedCategories: Category[]) => Promise<void>;
  fetchPromos: () => Promise<void>;
  setAppliedPromoCode: (promo: Promo | null) => void;
  addPromo: (promo: Omit<Promo, 'id'>) => Promise<void>;
  deletePromo: (promoId: string) => Promise<void>;
  togglePromo: (promoId: string, isActive: boolean) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchUserOrders: (email: string) => Promise<void>;
  placeOrder: (razorpayPaymentId: string, razorpayOrderId: string, delivery_address?: string, delivery_location?: {lat: number, lng: number}, payment_method?: 'razorpay' | 'cod') => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  getTotalPrice: () => number;
  userPhones: Record<string, string>;
  lastOrderTime: number;
  isLoading: boolean;
  error: string | null;
  seedDatabase: () => Promise<{ success: boolean; error?: string }>;
  clearOrders: () => Promise<{ success: boolean; error?: string }>;
  toggleDriverRole: (email: string, isDriver: boolean) => Promise<void>;
  toggleRoleManagerRole: (email: string, isManager: boolean) => Promise<void>;
  acceptJob: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addLocalNotification: (notification: AppNotification) => void;
  fetchSiteSettings: () => Promise<void>;
  updateSiteSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: (() => {
        try {
          const saved = localStorage.getItem('jk_restaurant_cart');
          return saved ? JSON.parse(saved) : [];
        } catch (e) {
          return [];
        }
      })(),
      orders: [],
      adminOrders: [],
      customers: [],
      notifications: [],
      promos: [],
      appliedPromoCode: null,
      siteSettings: { ...DEFAULT_SITE_SETTINGS },
      orderMode: 'delivery',
      setOrderMode: (mode) => set({ orderMode: mode }),
      setUser: (user) => {
        set({ user });
        if (user) get().fetchNotifications();
      },
      userPhones: {},
      lastOrderTime: 0,
      isLoading: false,
      error: null,
      categories: [],
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        let res = await supabase.from('categories').select('*').order('display_order', { ascending: true, nullsFirst: false });
        if (res.error) {
           res = await supabase.from('categories').select('*').order('created_at', { ascending: true });
        }
        if (!res.error && res.data) {
          set({ categories: res.data, isLoading: false });
        } else {
          console.error('Error fetching categories:', res.error);
          set({ error: res.error?.message || 'Failed to fetch categories', isLoading: false });
        }
      },
      seedDatabase: async () => {
        set({ isLoading: true });
        try {
          // 1. Check if we already have products
          const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
          if (count && count > 0) {
             set({ isLoading: false });
             return { success: false, error: 'Database already has products. Delete them first to seed.' };
          }

          // 2. Insert Default Categories
          const defaultCategories = [
            { name: 'Meals', image_url: 'https://images.unsplash.com/photo-1626082895617-2c6ad3ed3c82?auto=format&fit=crop&q=80&w=200' }, // Indian thali
            { name: 'Chinese', image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=200' }, // Noodles
            { name: 'Snacks', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568a70950?auto=format&fit=crop&q=80&w=200' }, // Samosa
            { name: 'Fast Food', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200' }, // Burger
            { name: 'Coolers', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=200' }, // Drink
          ];
          await supabase.from('categories').insert(defaultCategories);

          // 3. Insert Mock Products (stripping mock IDs to let Supabase generate UUIDs)
          const productsToSeed = MOCK_PRODUCTS.map(({ id, ...rest }) => ({
            ...rest,
            image_url: rest.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500'
          }));
          const { error: prodError } = await supabase.from('products').insert(productsToSeed);
          
          if (prodError) throw prodError;

          // 4. Reload everything
          await get().fetchProducts();
          await get().fetchCategories();
          
          set({ isLoading: false });
          return { success: true };
        } catch (err: any) {
          console.error('Seeding error:', err);
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },
      clearOrders: async () => {
        set({ isLoading: true });
        try {
          // Permanently delete only completed or cancelled orders as requested
          const { error } = await supabase.from('orders').delete().in('status', ['completed', 'cancelled']);
          if (error) throw error;
          
          // Refetch orders to sync local state
          await get().fetchOrders();
          set({ isLoading: false });
          return { success: true };
        } catch (err: any) {
          console.error('Clear orders error:', err);
          set({ isLoading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },
      addCategory: async (category) => {
        const { data, error } = await supabase.from('categories').insert([category]).select();
        if (!error && data) {
          set((state) => ({ categories: [...state.categories, data[0]] }));
          return { success: true };
        }
        console.error('Error adding category:', error);
        return { success: false, error };
      },
      updateCategory: async (id, updates) => {
        const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select();
        if (!error && data) {
          set((state) => ({ categories: state.categories.map(c => c.id === id ? data[0] : c) }));
          return { success: true };
        }
        console.error('Error updating category:', error);
        return { success: false, error };
      },
      deleteCategory: async (id) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) {
          set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        }
      },
      reorderCategories: async (reorderedCategories) => {
        set({ categories: reorderedCategories });
        const updates = reorderedCategories.map((c, index) => ({
          ...c,
          display_order: index,
        }));
        
        const { error } = await supabase.from('categories').upsert(updates);
        if (error) {
           console.error('Error reordering categories:', error);
           await get().fetchCategories();
        }
      },
      loginWithEmail: async (email, name, avatarUrl) => {
        const state = get();
        let existingPhone = state.userPhones[email] || '';
        
        // Try to fetch existing profile from database if local state is missing
        if (true) { // Always fetch to get latest roles
          const { data } = await supabase.from('customers').select('phone, is_driver, is_role_manager').eq('email', email).single();
          if (data?.phone) {
            existingPhone = data.phone;
          }
          var isDriver = data?.is_driver || false;
          var isRoleManagerVal = data?.is_role_manager || false;
        }
        
        const studentDetected = isStudentEmail(email);
        set({
          userPhones: { ...get().userPhones, [email]: existingPhone },
          user: {
            id: (state.user && state.user.email === email) ? state.user.id : `u_${Date.now()}`,
            full_name: name,
            email,
            phone: existingPhone,
            avatar_url: avatarUrl,
            is_student: studentDetected,
            is_driver: isDriver,
            is_role_manager: isRoleManagerVal,
          }
        });

        // Upsert into customers table for admin visibility (only upsert if phone exists or it will overwrite)
        const customerData: any = {
          email,
          name,
          avatar_url: avatarUrl || null,
          is_student: studentDetected,
          last_login: new Date().toISOString(),
        };
        if (existingPhone) customerData.phone = existingPhone;

        supabase.from('customers').upsert(customerData, { onConflict: 'email' }).then(({ error }) => {
          if (error) console.error('Error upserting customer:', error);
        });
      },
      updatePhone: (phone) => {
        const state = get();
        set({
          user: state.user ? { ...state.user, phone } : null,
          userPhones: state.user ? { ...state.userPhones, [state.user.email]: phone } : state.userPhones
        });

        // Sync phone to customers table so Admin can see it
        if (state.user) {
          supabase.from('customers')
            .update({ phone })
            .eq('email', state.user.email)
            .then(({ error }) => {
              if (error) console.error('Error updating customer phone:', error);
            });
        }
      },
      logoutUser: () => {
        set({ user: null, cart: [], orders: [], adminOrders: [], appliedPromoCode: null });
        localStorage.removeItem('jk_restaurant_cart');
      },
      
      setAppliedPromoCode: (promo) => set({ appliedPromoCode: promo }),

      fetchPromos: async () => {
        const { data, error } = await supabase.from('promos').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          set({ promos: data as Promo[] });
        } else {
          console.error('Error fetching promos:', error);
        }
      },

      addPromo: async (promo) => {
        const { data, error } = await supabase.from('promos').insert([promo]).select();
        if (!error && data) {
          set((state) => ({ promos: [data[0] as Promo, ...state.promos] }));
        } else {
          console.error('Error adding promo:', error);
          alert('Failed to add promo: ' + (error?.message || 'Unknown error'));
        }
      },

      deletePromo: async (promoId) => {
        // Optimistic UI update
        set((state) => ({ promos: state.promos.filter(p => p.id !== promoId) }));
        const { error } = await supabase.from('promos').delete().eq('id', promoId);
        if (error) {
          console.error('Error deleting promo:', error);
          await get().fetchPromos(); // Revert on failure
        }
      },

      togglePromo: async (promoId, is_active) => {
        // Optimistic UI update
        set((state) => ({ 
          promos: state.promos.map(p => p.id === promoId ? { ...p, is_active } : p) 
        }));
        const { error } = await supabase.from('promos').update({ is_active }).eq('id', promoId);
        if (error) {
           console.error('Error toggling promo:', error);
           await get().fetchPromos(); // Revert on failure
        }
      },

      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.id === product.id);
        let newCart;
        if (existingItem) {
          newCart = state.cart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          newCart = [...state.cart, { ...product, quantity: 1 }];
        }
        localStorage.setItem('jk_restaurant_cart', JSON.stringify(newCart));
        return { cart: newCart };
      }),
      removeFromCart: (productId) => set((state) => {
        const newCart = state.cart.filter(item => item.id !== productId);
        localStorage.setItem('jk_restaurant_cart', JSON.stringify(newCart));
        return { cart: newCart };
      }),
      updateQuantity: (productId, quantity) => set((state) => {
        const newCart = state.cart.map(item =>
          item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        );
        localStorage.setItem('jk_restaurant_cart', JSON.stringify(newCart));
        return { cart: newCart };
      }),
      clearCart: () => {
        set({ cart: [] });
        localStorage.removeItem('jk_restaurant_cart');
      },
      products: [],
      fetchProducts: async () => {
        set({ isLoading: true, error: null });
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          set({ products: data as Product[], isLoading: false });
        } else {
          console.error('Error fetching products:', error);
          set({ error: error?.message || 'Failed to fetch products', isLoading: false });
        }
      },
      addProduct: async (product) => {
        const uploadProduct = {
          ...product,
          image_url: product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500'
        };

        const { data, error } = await supabase.from('products').insert([uploadProduct]).select();
        if (!error && data) {
          set((state) => ({ products: [...state.products, data[0] as Product] }));
        } else {
          console.error('Error adding product:', error);
        }
      },
      updateProduct: async (productId, updates) => {
        set((state) => ({
          products: state.products.map(p => p.id === productId ? { ...p, ...updates } : p)
        }));

        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', productId);

        if (error) {
          console.error('Error updating product:', error);
        }
      },
      deleteProduct: async (productId) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (!error) {
          set((state) => ({ products: state.products.filter(p => p.id !== productId) }));
        } else {
          console.error('Error deleting product:', error);
        }
      },
      fetchOrders: async () => {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          set({ adminOrders: data as Order[] });
        } else {
          console.error('Error fetching orders:', error);
        }
      },
      fetchCustomers: async () => {
        const { data, error } = await supabase.from('customers').select('*').order('last_login', { ascending: false });
        if (!error && data) {
          set({ customers: data as Customer[] });
        } else {
          console.error('Error fetching customers:', error);
        }
      },
      fetchUserOrders: async (email) => {
        const { data, error } = await supabase.from('orders').select('*').eq('user_email', email).order('created_at', { ascending: false });
        if (!error && data) {
          set({ orders: data as Order[] });
        } else {
          console.error('Error fetching user orders:', error);
        }
      },
      placeOrder: async (razorpayPaymentId, razorpayOrderId, delivery_address, delivery_location, payment_method = 'razorpay') => {
        try {
          const { user, cart, orderMode, getTotalPrice, lastOrderTime } = get();
          if (!user || cart.length === 0) return { success: false, error: 'No user or empty cart' };

          // Rate limiting
          const now = Date.now();
          if (now - lastOrderTime < 30000) {
            return { success: false, error: 'Please wait 30 seconds before placing another order.' };
          }

          const newOrder = {
            user_id: user.id || `u_${Date.now()}`,
            user_name: user.full_name,
            user_email: user.email,
            user_phone: user.phone,
            items: cart,
            total_amount: getTotalPrice(),
            order_mode: orderMode,
            status: 'pending',
            payment_screenshot_url: razorpayOrderId || null, // Razorpay order ID
            utr_number: razorpayPaymentId || null, // Razorpay payment ID
            delivery_address: delivery_address || null,
            delivery_location: delivery_location || null,
          };

          const { data, error } = await supabase.from('orders').insert([newOrder]).select();
          
          if (error) throw error;
          if (!data || data.length === 0) throw new Error('Order was not created correctly.');

          set({ lastOrderTime: now });
          
          // Generate notification for admins
          try {
            await supabase.from('notifications').insert([{
              target_role: 'admin',
              title: 'New Order Received',
              message: `Order #${data[0].id.slice(0, 5)} - ₹${newOrder.total_amount} placed by ${newOrder.user_name} [${payment_method === 'cod' ? '💵 COD' : '💳 Online'}]`,
              link: '/admin'
            }]);
          } catch (e) { console.error('Error inserting notification', e); }

        try {
          const apiSecret = import.meta.env.VITE_ORDER_NOTIFICATION_SECRET || 'test-secret-key';
          const appUrl = window.location.origin;
          const apiUrl = import.meta.env.PROD 
            ? `${appUrl}/api/order-notification` 
            : 'http://localhost:3000/api/order-notification';
            
            fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiSecret}`
              },
              body: JSON.stringify({
                orderId: data[0].id,
                items: newOrder.items,
                totalAmount: newOrder.total_amount,
                customerContact: {
                  name: newOrder.user_name,
                  email: newOrder.user_email,
                  phone: newOrder.user_phone
                },
                deliveryAddress: newOrder.delivery_address,
                paymentMethod: payment_method
              })
            }).catch(err => console.warn('Notification API warning:', err));
          } catch (e) {
            console.error('Notification API trigger error:', e);
          }

          // 2. Trigger Admin Notification (via Edge Function)
          const notifyPhone = import.meta.env.VITE_ADMIN_PHONE;
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (notifyPhone && supabaseUrl) {
            try {
              fetch(`${supabaseUrl}/functions/v1/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  phone: notifyPhone,
                  otp: `🚨 NEW ORDER FROM ${user.full_name.toUpperCase()}! Total: ₹${newOrder.total_amount}. Check Admin Panel.` 
                })
              }).catch(err => console.warn('Edge function warning:', err));
            } catch (e) { console.error("Notification failed:", e); }
          }

          set((state) => ({ 
            orders: [data[0] as Order, ...state.orders],
            cart: [] 
          }));
          localStorage.removeItem('jk_restaurant_cart');
          return { success: true };
        } catch (error: any) {
          console.error('Error in placeOrder:', error);
          return { success: false, error: error.message || 'Network or Server Error' };
        }
      },
      updateOrderStatus: async (orderId, status) => {
        // Save previous state for rollback
        const prevOrders = get().orders;
        const prevAdminOrders = get().adminOrders;

        // Optimistic update for both lists
        set((state) => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o),
          adminOrders: state.adminOrders.map(o => o.id === orderId ? { ...o, status } : o)
        }));

        const { data, error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId)
          .select();

        if (error) {
          console.error('Error updating order status:', error);
          // Rollback optimistic update
          set({ orders: prevOrders, adminOrders: prevAdminOrders });
          alert(`Failed to update order: ${error.message}`);
        } else if (!data || data.length === 0) {
          console.error('Order update returned 0 rows — likely an RLS policy issue.');
          // Rollback optimistic update
          set({ orders: prevOrders, adminOrders: prevAdminOrders });
          alert('Order status update failed. Your Supabase "orders" table likely needs an UPDATE policy for authenticated users. Go to Supabase → Authentication → Policies → orders table → Add policy: allow UPDATE for authenticated role.');
        }
      },
      getTotalPrice: () => {
        const { cart, user, appliedPromoCode } = get();
        
        let subtotal = cart.reduce((sum, item) => {
          const isStudentVerified = user?.is_student || (appliedPromoCode?.discount_type === 'student_offer');
          const price = isStudentVerified ? item.student_price : item.base_price;
          return sum + (price * item.quantity);
        }, 0);
        
        if (appliedPromoCode && !user?.is_student && appliedPromoCode.discount_type !== 'student_offer') {
          if (appliedPromoCode.discount_type === 'percentage') {
            subtotal = subtotal - (subtotal * appliedPromoCode.discount_value / 100);
          } else {
            subtotal = Math.max(0, subtotal - appliedPromoCode.discount_value);
          }
        }
        
        return subtotal;
      },
      toggleDriverRole: async (email, isDriver) => {
        const { error } = await supabase.from('customers').update({ is_driver: isDriver }).eq('email', email);
        if (!error) {
          set((state) => ({ 
            customers: state.customers.map(c => c.email === email ? { ...c, is_driver: isDriver } : c),
            user: state.user?.email === email ? { ...state.user, is_driver: isDriver } : state.user
          }));
        }
      },
      toggleRoleManagerRole: async (email, isManager) => {
        const { error } = await supabase.from('customers').update({ is_role_manager: isManager }).eq('email', email);
        if (!error) {
          set((state) => ({ 
            customers: state.customers.map(c => c.email === email ? { ...c, is_role_manager: isManager } : c),
            user: state.user?.email === email ? { ...state.user, is_role_manager: isManager } : state.user
          }));
        }
      },

      acceptJob: async (orderId) => {
        const { user } = get();
        if (!user) return { success: false, error: 'Must be logged in' };
        
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status: 'out_for_delivery', 
            driver_id: user.id,
            driver_name: user.full_name
          })
          .eq('id', orderId)
          .eq('status', 'ready') // Ensure it's still available
          .select();

        if (error) return { success: false, error: error.message };
        if (!data || data.length === 0) return { success: false, error: 'Order already taken or unavailable' };

        // Trigger notification
        try {
          fetch('/api/driver-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, newStatus: 'out_for_delivery' })
          });
        } catch (e) { console.error('Accept job notification error:', e); }

        // Notify user via DB notification
        try {
          const o = get().adminOrders.find(x => x.id === orderId);
          if (o) {
            await supabase.from('notifications').insert([{
              user_email: o.user_email,
              title: 'Driver Assigned',
              message: `${user.full_name} is on the way with your order!`,
              link: `/track/${orderId}`
            }]);
          }
        } catch (e) {}

        set((state) => ({
          adminOrders: state.adminOrders.map(o => o.id === orderId ? { ...o, status: 'out_for_delivery', driver_id: user.id, driver_name: user.full_name } : o)
        }));

        return { success: true };
      },

      // Notification Actions
      fetchNotifications: async () => {
        const { user } = get();
        if (!user) return;
        
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        // Instead of complex OR, fetch everything potentially relevant and filter locally to simplify complex Postgres text array / OR matching across roles, or better, do an OR query.
        
        let orString = `user_email.eq.${user.email},target_role.eq.all`;
        if (isAdmin(user) || isRoleManager(user)) {
           orString += ',target_role.eq.admin';
        }
        if (user.is_driver) {
           orString += ',target_role.eq.driver';
        }
        query = query.or(orString).limit(50);
        
        const { data, error } = await query;
        if (!error && data) {
           set({ notifications: data as AppNotification[] });
        }
      },
      markNotificationAsRead: async (id) => {
        set((state) => ({
           notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
        }));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      },
      markAllNotificationsAsRead: async () => {
        const { notifications, user } = get();
        if (!user) return;
        
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        set((state) => ({
           notifications: state.notifications.map(n => ({ ...n, is_read: true }))
        }));
        
        // Mark all owned unread as true (this might update broadcast ones for everyone, which is acceptable for a small team, or we'd need read receipts. For now, it updates the row.)
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      },
      addLocalNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications]
        }));
      },

      fetchSiteSettings: async () => {
        try {
          const { data, error } = await supabase.from('site_settings').select('key, value');
          if (error) {
            console.error('Error fetching site_settings:', error);
            return;
          }
          if (data && data.length > 0) {
            const settings = { ...DEFAULT_SITE_SETTINGS };
            data.forEach((row: { key: string; value: string }) => {
              if (row.key in settings) {
                (settings as any)[row.key] = parseFloat(row.value) || 0;
              }
            });
            set({ siteSettings: settings });
          }
        } catch (err) {
          console.error('fetchSiteSettings error:', err);
        }
      },

      updateSiteSetting: async (key, value) => {
        try {
          // Use upsert to handle both insert and update in one call
          const { error } = await supabase
            .from('site_settings')
            .upsert(
              { key, value, updated_at: new Date().toISOString() },
              { onConflict: 'key' }
            )
            .select();

          if (error) {
            console.error('Error upserting site_setting:', error);
            return { success: false, error: error.message };
          }

          // Update local state immediately
          set((state) => ({
            siteSettings: {
              ...state.siteSettings,
              [key]: parseFloat(value) || 0,
            }
          }));
          return { success: true };
        } catch (err: any) {
          console.error('updateSiteSetting error:', err);
          return { success: false, error: err.message };
        }
      }
    }),
    {
      name: 'jk-restaurant-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        orderMode: state.orderMode,
        // No longer persisting promos in local storage since they are pulled from DB
      }),
    }
  )
);
