import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, Utensils, Flame, Popcorn, Truck, GlassWater } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  'Meals': Utensils, 'Chinese': Flame, 'Snacks': Popcorn, 'Fast Food': Truck, 'Coolers': GlassWater,
};
const CATEGORY_GRADIENTS: Record<string, string> = {
  'Meals': 'from-orange-500 to-amber-500', 'Chinese': 'from-red-500 to-rose-500',
  'Snacks': 'from-yellow-500 to-orange-400', 'Fast Food': 'from-blue-500 to-indigo-500',
  'Coolers': 'from-cyan-500 to-teal-500',
};

export const CategoryView = () => {
  const { subCategoryId } = useParams<{ subCategoryId: string }>();
  const { products, cart, user, isLoading } = useStore();
  const navigate = useNavigate();

  const decodedId = decodeURIComponent(subCategoryId || '');

  // Smart filter: check sub_category first, then fall back to category
  const categoryProducts = useMemo(() => {
    const bySub = products.filter(p => p.sub_category === decodedId);
    if (bySub.length > 0) return bySub;
    return products.filter(p => p.category === decodedId);
  }, [products, decodedId]);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin mb-6"></div>
        <p className="text-gray-900 dark:text-white font-black text-xs uppercase tracking-[0.2em]">Loading Menu</p>
      </div>
    );
  }

  const isMainCategory = products.some(p => p.category === decodedId);
  const Icon = CATEGORY_ICONS[decodedId] || Utensils;
  const gradient = CATEGORY_GRADIENTS[decodedId] || 'from-gray-600 to-gray-700';

  return (
    <div className="flex flex-col h-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-800 dark:text-white" />
        </button>
        {isMainCategory ? (
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{decodedId}</h1>
              <p className="text-[10px] text-gray-400 font-semibold">{categoryProducts.length} items available</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{decodedId}</h1>
            <p className="text-[10px] text-gray-400 font-semibold">{categoryProducts.length} items available</p>
          </div>
        )}
      </div>

      {/* Products */}
      {categoryProducts.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No items found</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">This category is being updated</p>
          <button onClick={() => navigate('/')}
            className="mt-4 bg-brand-500 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-full shadow-md">
            Back to Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children pb-4">
          {categoryProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* ═══ Floating Cart Bar ═══ */}
      {cart.length > 0 && (
        <div className="fixed bottom-[72px] lg:bottom-4 left-0 lg:left-64 right-0 px-4 pb-3 lg:pb-0 z-40 animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => { if (!user) navigate('/profile?redirect=/cart'); else if (!user.phone) navigate('/profile'); else navigate('/cart'); }}
            className="w-full max-w-md mx-auto bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-[0_8px_30px_rgb(239,68,68,0.3)] transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={cart[cart.length - 1]?.image_url} 
                  className="w-10 h-10 rounded-lg object-cover border-2 border-white/20 shadow-inner"
                  alt=""
                />
                <div className="absolute -top-2 -right-2 bg-white text-red-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border border-red-100">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
              </div>
              <span className="font-black text-sm tracking-tight">{cart.reduce((s, i) => s + i.quantity, 0)} items added</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm border-r border-white/20 pr-3 uppercase tracking-widest text-[10px]">View cart</span>
              <ArrowLeft size={18} className="rotate-180" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
