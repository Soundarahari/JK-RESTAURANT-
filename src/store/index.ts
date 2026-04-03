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
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  payment_screenshot_url: string | null;
  utr_number: string | null;
  created_at: string;
}

// Known student email domains — if user's email ends with one of these, they're a student
export const STUDENT_DOMAINS = ['jkkn.ac.in', 'ssm.ac.in', 'excel.ac.in', 'jkkm.ac.in', 'vivekanandha.ac.in'];

export function isStudentEmail(email: string): boolean {
  return STUDENT_DOMAINS.some(domain => email.toLowerCase().endsWith(`@${domain}`) || email.toLowerCase().includes(`.${domain}`));
}

export const ADMIN_EMAILS = ['soundarahari050@gmail.com'];

export function isAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email) || user.email.startsWith('admin@');
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  is_student: boolean;
  college_name?: string;
  id_card_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'none';
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  id_card_url: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

interface AppState {
  user: UserProfile | null;
  cart: CartItem[];
  products: Product[];
  orders: Order[];
  adminOrders: Order[];
  verifications: VerificationRequest[];
  orderMode: 'delivery' | 'takeaway';
  setOrderMode: (mode: 'delivery' | 'takeaway') => void;
  setUser: (user: UserProfile | null) => void;
  loginWithEmail: (email: string, name: string, avatarUrl?: string) => void;
  updatePhone: (phone: string) => void;
  logoutUser: () => void;
  submitVerification: (idCardUrl: string) => void;
  updateVerificationStatus: (requestId: string, status: 'confirmed' | 'rejected') => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchUserOrders: (email: string) => Promise<void>;
  placeOrder: (paymentScreenshot: string, utrNumber: string) => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  getTotalPrice: () => number;
  userPhones: Record<string, string>; // Maps email to last used phone
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      orders: [],
      adminOrders: [],
      verifications: [],
      orderMode: 'delivery',
      setOrderMode: (mode) => set({ orderMode: mode }),
      setUser: (user) => set({ user }),
      userPhones: {},
      loginWithEmail: (email, name, avatarUrl) => {
        const state = get();
        // Look up phone from our record map
        const existingPhone = state.userPhones[email] || '';
        
        const studentDetected = isStudentEmail(email);
        set({
          user: {
            id: (state.user && state.user.email === email) ? state.user.id : `u_${Date.now()}`,
            full_name: name,
            email,
            phone: existingPhone,
            avatar_url: avatarUrl,
            is_student: studentDetected,
            verification_status: studentDetected ? 'verified' : 'none',
          }
        });
      },
      updatePhone: (phone) => set((state) => ({
        user: state.user ? { ...state.user, phone } : null,
        userPhones: state.user ? { ...state.userPhones, [state.user.email]: phone } : state.userPhones
      })),
      logoutUser: () => set({ user: null, cart: [], orders: [], adminOrders: [] }),
      
      submitVerification: (idCardUrl) => set((state) => {
        if (!state.user) return state;
        const newRequest: VerificationRequest = {
          id: `v_${Date.now()}`,
          user_id: state.user.id,
          user_name: state.user.full_name,
          user_email: state.user.email,
          id_card_url: idCardUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        return {
          user: { ...state.user, verification_status: 'pending', id_card_url: idCardUrl },
          verifications: [newRequest, ...state.verifications],
        };
      }),

      updateVerificationStatus: (requestId, status) => set((state) => {
        const request = state.verifications.find(v => v.id === requestId);
        if (!request) return state;
        
        const isConfirmed = status === 'confirmed';
        const updatedVerifications = state.verifications.map(v => 
          v.id === requestId ? { ...v, status } : v
        );

        // If this is the current user being verified, update their profile too
        const isCurrentUser = state.user?.id === request.user_id;

        return {
          verifications: updatedVerifications,
          user: isCurrentUser ? { 
            ...state.user!, 
            verification_status: isConfirmed ? 'verified' : 'rejected',
            is_student: isConfirmed
          } : state.user
        };
      }),

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
      fetchUserOrders: async (email) => {
        const { data, error } = await supabase.from('orders').select('*').eq('user_email', email).order('created_at', { ascending: false });
        if (!error && data) {
          set({ orders: data as Order[] });
        } else {
          console.error('Error fetching user orders:', error);
        }
      },
      placeOrder: async (paymentScreenshot, utrNumber) => {
        const { user, cart, orderMode, getTotalPrice } = get();
        if (!user || cart.length === 0) return { success: false, error: 'No user or empty cart' };

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
        };

        const { data, error } = await supabase.from('orders').insert([newOrder]).select();
        
        if (!error && data) {
          // Trigger Admin Notification (via Twilio Edge Function)
          try {
            await fetch("https://hquuimozjttqfyloskhf.supabase.co/functions/v1/send-otp", {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                phone: "+917603814898", // Admin number for notification
                otp: `🚨 NEW ORDER FROM ${user.full_name.toUpperCase()}! Total: ₹${newOrder.total_amount}. Check Admin Panel.` 
              })
            });
          } catch (e) { console.error("Notification failed:", e); }

          set((state) => ({ 
            orders: [data[0] as Order, ...state.orders],
            cart: [] 
          }));
          return { success: true };
        } else {
          console.error('Error placing order:', error);
          return { success: false, error: error?.message };
        }
      },
      updateOrderStatus: async (orderId, status) => {
        // Optimistic update for both lists
        set((state) => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o),
          adminOrders: state.adminOrders.map(o => o.id === orderId ? { ...o, status } : o)
        }));

        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId);

        if (error) {
          console.error('Error updating status:', error);
        }
      },
      getTotalPrice: () => {
        return get().cart.reduce((sum, item) => {
          const isStudentVerified = get().user?.verification_status === 'verified';
          const price = isStudentVerified ? item.student_price : item.base_price;
          return sum + (price * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'jk-restaurant-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        verifications: state.verifications,
        orderMode: state.orderMode,
      }),
    }
  )
);
