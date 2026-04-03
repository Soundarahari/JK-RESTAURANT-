import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export const Cart = () => {
  const { cart, user, getTotalPrice } = useStore();
  const navigate = useNavigate();

  const isStudentVerified = user?.is_student && user?.verification_status === 'verified';
  const itemTotal = getTotalPrice();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
        <div className="text-5xl mb-3">🛒</div>
        <h2 className="text-xl font-black text-gray-800 dark:text-white">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Browse the menu and add some tasty food!</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-brand-500 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-full shadow-md">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Your Cart</h2>
        <button 
          onClick={() => useStore.getState().clearCart()}
          className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
        {cart.map((item, index) => (
          <div key={item.id} className={`p-5 flex items-center justify-between ${index !== cart.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}>
            <div className="flex-1">
              <h4 className="font-black text-gray-800 dark:text-gray-200 text-sm">{item.name}</h4>
              <p className="text-xs text-gray-400 mt-0.5">₹{isStudentVerified ? item.student_price : item.base_price} / unit</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700/50">
                <button 
                  onClick={() => useStore.getState().updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-xs font-black text-gray-800 dark:text-white">{item.quantity}</span>
                <button 
                  onClick={() => useStore.getState().updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button 
                onClick={() => useStore.getState().removeFromCart(item.id)}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-rose-500 transition-colors bg-gray-50/50 dark:bg-gray-800/30 rounded-xl"
              >
                <Trash2 size={16} />
              </button>

              <div className="w-16 text-right">
                <p className="font-black text-gray-900 dark:text-white text-sm">₹{(isStudentVerified ? item.student_price : item.base_price) * item.quantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Summary (Brief) */}
      <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] p-6 shadow-xl mb-8">
        <div className="flex justify-between items-center mb-2 opacity-60">
          <span className="text-[10px] font-bold uppercase tracking-widest">Item Total</span>
          <span className="text-sm font-bold">₹{itemTotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-black uppercase tracking-tight">Estimated Total</span>
          <span className="text-2xl font-black text-brand-400 dark:text-brand-600">₹{itemTotal}</span>
        </div>
        <p className="text-[8px] opacity-40 uppercase tracking-[0.2em] mt-3 font-bold">* Delivery & platform fees added at checkout</p>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-40">
        <button
          onClick={() => {
            if (!user || user.phone === '') {
              navigate('/profile');
            } else {
              navigate('/checkout');
            }
          }}
          className="w-full max-w-md mx-auto h-14 bg-brand-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {user?.phone ? (
            <>Proceed to Checkout <ShoppingCart size={18} /></>
          ) : (
            'Complete Profile to Checkout'
          )}
        </button>
      </div>
    </div>
  );
};
