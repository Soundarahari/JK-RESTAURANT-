import { Product } from '../data/mock';
import { useStore } from '../store';
import { Plus, Minus, Star, Heart, Flame, Clock } from 'lucide-react';

export const ProductCard = ({ product }: { product: Product }) => {
  const { user, cart, addToCart, removeFromCart, updateQuantity, appliedPromoCode } = useStore();
  const cartItem = cart.find(item => item.id === product.id);
  const isStudentVerified = user?.is_student || appliedPromoCode?.discount_type === 'student_offer';

  return (
    <div className={`group bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100/50 dark:border-gray-800/50 flex flex-col relative ${
      !product.is_available && 'opacity-60 grayscale-[0.5]'
    }`}>
      
      {/* 1. Large Immersive Image Section (16:9) */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';
          }}
        />
        
        {/* Glossy Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {product.bestseller && (
              <div className="bg-amber-400/90 backdrop-blur-md text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in slide-in-from-left">
                <Star size={10} fill="currentColor" /> BESTSELLER
              </div>
            )}
            {product.spicy && (
              <div className="bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in slide-in-from-left delay-75">
                <Flame size={10} fill="currentColor" /> SPICY
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-in slide-in-from-left delay-100">
              <Clock size={10} className="text-gray-500" /> {product.prep_time || 15} MIN
            </div>
          </div>
          
          <button className="w-9 h-9 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-colors shadow-lg active:scale-90">
            <Heart size={16} />
          </button>
        </div>

        {/* Veg/Non-Veg Corner */}
        <div className="absolute bottom-4 left-4">
          <div className={`p-1.5 rounded-lg backdrop-blur-md border-2 bg-white/90 ${product.is_veg ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${product.is_veg ? 'bg-green-500' : 'bg-red-500'} shadow-sm shadow-green-900/20`}></div>
          </div>
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-black text-xl text-gray-900 dark:text-white leading-[1.1] tracking-tight group-hover:text-brand-500 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            <span className="text-xs font-black text-gray-900 dark:text-white">{product.rating}</span>
          </div>
        </div>
        
        <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
          {product.description || 'Delicately prepared with handpicked ingredients and authentic spices for a rich, satisfying experience.'}
        </p>

        {/* 3. Action Row */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            {isStudentVerified ? (
              <>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400 tracking-tight">₹{product.student_price}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 line-through font-medium">₹{product.base_price}</span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Save {Math.round((1 - product.student_price/product.base_price)*100)}%</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">₹{product.base_price}</span>
                {product.student_price < product.base_price && (
                  <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">🎓 Students: ₹{product.student_price}</span>
                )}
              </>
            )}
          </div>

          <div>
            {cartItem ? (
              <div className="flex items-center h-10 bg-white dark:bg-gray-900 border-2 border-red-500 rounded-xl overflow-hidden shadow-lg shadow-red-500/10">
                <button 
                  onClick={() => cartItem.quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)}
                  className="w-9 h-full flex justify-center items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors active:scale-90"
                >
                  <Minus size={16} strokeWidth={4} />
                </button>
                <span className="w-8 text-center text-sm font-black text-red-600 dark:text-red-400">{cartItem.quantity}</span>
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  className="w-9 h-full flex justify-center items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors active:scale-90"
                >
                  <Plus size={16} strokeWidth={4} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(product)}
                disabled={!product.is_available}
                className="bg-white dark:bg-gray-950 text-red-500 border-2 border-red-500 h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-md active:scale-95 disabled:border-gray-200 disabled:text-gray-300 flex items-center gap-1.5"
              >
                ADD 
                <Plus size={14} strokeWidth={4} className="mb-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
