import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/mock';
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
  payment_screenshot_url: string | null;
  utr_number: string | null;
  created_at: string;
  delivery_location?: { lat: number, lng: number } | null;
}

// Known student email domains — if user's email ends with one of these, they're a student
export const STUDENT_DOMAINS = ['jkkn.ac.in', 'ssm.ac.in', 'excel.ac.in', 'jkkm.ac.in', 'vivekanandha.ac.in'];

export function isStudentEmail(email: string): boolean {
  return STUDENT_DOMAINS.some(domain => email.toLowerCase().endsWith(`@${domain}`) || email.toLowerCase().includes(`.${domain}`));
}

export const ADMIN_EMAILS = ['soundarahari050@gmail.com'];

export function isAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email);
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  is_student: boolean;
  college_name?: string;
}

export interface Promo {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
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
  created_at: string;
  last_login: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string;
  created_at?: string;
}

interface AppState {
  user: UserProfile | null;
  cart: CartItem[];
  products: Product[];
  orders: Order[];
  adminOrders: Order[];
  customers: Customer[];
  orderMode: 'delivery' | 'takeaway';
  promos: Promo[];
  appliedPromoCode: Promo | null;
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
  setAppliedPromoCode: (promo: Promo | null) => void;
  addPromo: (promo: Omit<Promo, 'id'>) => void;
  deletePromo: (promoId: string) => void;
  togglePromo: (promoId: string, isActive: boolean) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchUserOrders: (email: string) => Promise<void>;
  placeOrder: (paymentScreenshot: string, utrNumber: string, delivery_location?: {lat: number, lng: number}) => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  getTotalPrice: () => number;
  userPhones: Record<string, string>;
  lastOrderTime: number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      orders: [],
      adminOrders: [],
      customers: [],
      promos: [{ id: 'promo1', code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, is_active: true }],
      appliedPromoCode: null,
      orderMode: 'delivery',
      setOrderMode: (mode) => set({ orderMode: mode }),
      setUser: (user) => set({ user }),
      userPhones: {},
      lastOrderTime: 0,
      categories: [],
      fetchCategories: async () => {
        const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          set({ categories: data });
        } else {
          console.error('Error fetching categories:', error);
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
      loginWithEmail: async (email, name, avatarUrl) => {
        const state = get();
        let existingPhone = state.userPhones[email] || '';
        
        // Try to fetch existing phone from database if local state is missing
        if (!existingPhone) {
          const { data } = await supabase.from('customers').select('phone').eq('email', email).single();
          if (data?.phone) {
            existingPhone = data.phone;
          }
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
      logoutUser: () => set({ user: null, cart: [], orders: [], adminOrders: [], appliedPromoCode: null }),
      
      setAppliedPromoCode: (promo) => set({ appliedPromoCode: promo }),
      addPromo: (promo) => set((state) => ({ promos: [...state.promos, { ...promo, id: `promo_${Date.now()}` }] })),
      deletePromo: (promoId) => set((state) => ({ promos: state.promos.filter(p => p.id !== promoId) })),
      togglePromo: (promoId, is_active) => set((state) => ({ 
        promos: state.promos.map(p => p.id === promoId ? { ...p, is_active } : p) 
      })),

      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.id === product.id);
        if (existingItem) {
          return {
            cart: state.cart.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map(item =>
          item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      })),
      clearCart: () => set({ cart: [] }),
      products: [],
      fetchProducts: async () => {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          set({ products: data as Product[] });
        } else {
          console.error('Error fetching products:', error);
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
      placeOrder: async (paymentScreenshot, utrNumber, delivery_location) => {
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
            payment_screenshot_url: paymentScreenshot || null,
            utr_number: utrNumber || null,
            delivery_location: delivery_location || null,
          };

          const { data, error } = await supabase.from('orders').insert([newOrder]).select();
          
          if (error) throw error;
          if (!data || data.length === 0) throw new Error('Order was not created correctly.');

          set({ lastOrderTime: now });

          // 1. Send Email/Telegram Notification via Vercel API
          try {
            const apiSecret = import.meta.env.VITE_ORDER_NOTIFICATION_SECRET || 'test-secret-key';
            const apiUrl = import.meta.env.PROD 
              ? `${window.location.origin}/api/order-notification` 
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
                }
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
          const isStudentVerified = user?.is_student;
          const price = isStudentVerified ? item.student_price : item.base_price;
          return sum + (price * item.quantity);
        }, 0);
        
        if (appliedPromoCode && !user?.is_student) {
          if (appliedPromoCode.discount_type === 'percentage') {
            subtotal = subtotal - (subtotal * appliedPromoCode.discount_value / 100);
          } else {
            subtotal = Math.max(0, subtotal - appliedPromoCode.discount_value);
          }
        }
        
        return subtotal;
      }
    }),
    {
      name: 'jk-restaurant-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        orderMode: state.orderMode,
      }),
    }
  )
);
