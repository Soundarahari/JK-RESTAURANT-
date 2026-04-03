import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Search, Flame, Utensils, Popcorn, Truck, GlassWater, ArrowUp } from 'lucide-react';
import { useStore } from '../store';

const CATEGORY_ICONS: Record<string, any> = {
  'Meals': Utensils,
  'Chinese': Flame,
  'Snacks': Popcorn,
  'Fast Food': Truck,
  'Coolers': GlassWater,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Meals': 'from-orange-500 to-amber-500',
  'Chinese': 'from-red-500 to-rose-500',
  'Snacks': 'from-yellow-500 to-orange-400',
  'Fast Food': 'from-blue-500 to-indigo-500',
  'Coolers': 'from-cyan-500 to-teal-500',
};

export const Home = () => {
  const { products, fetchProducts, cart, getTotalPrice, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getTotalPrice();

  const baseCategories = Array.from(new Set(products.map(p => p.category)));
  const orderedCategories = ['Meals', 'Chinese', 'Snacks', 'Fast Food', 'Coolers'].filter(c => baseCategories.includes(c));
  const categories = ['All', ...orderedCategories, ...baseCategories.filter(c => !orderedCategories.includes(c))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const categoryGroups = useMemo(() => {
    const groupOrder = ['Meals', 'Chinese', 'Snacks', 'Fast Food', 'Coolers'];
    const groups = new Map<string, typeof filteredProducts>();

    filteredProducts.forEach(p => {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category)!.push(p);
    });

    const sorted: { category: string; items: typeof filteredProducts }[] = [];
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
  }, [filteredProducts]);

  return (
    <div className="flex flex-col h-full">

      {/* Hero Banner */}
      <div className="relative -mx-4 -mt-4 mb-4 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-emerald-500 px-5 py-6">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">Welcome to</p>
          <h1 className="text-white text-2xl font-black tracking-tight">JK Restaurant 🍽️</h1>
          <p className="text-white/70 text-xs mt-1 font-medium">Highway & Student-Friendly Pricing</p>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search 'Paneer', 'Noodles', 'Falooda'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/95 dark:bg-gray-900/95 border-0 text-gray-900 dark:text-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none shadow-lg text-sm font-medium placeholder:text-gray-400"
            />
            <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-4 bg-gray-50 dark:bg-gray-950 rounded-t-[20px]"></div>
      </div>

      {/* Category Pills */}
      <div className="mb-4">
        <div className="flex overflow-x-auto hide-scrollbar gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-bold transition-all ${activeCategory === cat
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-400'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="pb-6">
        {searchQuery && (
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-3">
            Results for "<span className="text-brand-500">{searchQuery}</span>"
          </h2>
        )}

        {activeCategory === 'All' && !searchQuery ? (
          categoryGroups.map(({ category, items }) => {
            const IconComp = CATEGORY_ICONS[category] || Utensils;
            const gradient = CATEGORY_COLORS[category] || 'from-gray-500 to-gray-600';
            
            return (
              <div key={category} className="mb-6 animate-fade-in">
                {/* Category Section Header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                    <IconComp size={15} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-gray-800 dark:text-white leading-tight">{category}</h2>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{items.length} items available</p>
                  </div>
                </div>

                <div className="space-y-8 stagger-children pb-4">
                  {items.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <>
            {!searchQuery && (
              <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 uppercase tracking-wider">{activeCategory}</h2>
            )}
            <div className="space-y-8 stagger-children">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No dishes found</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try a different search</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
            className="mt-4 bg-brand-500 text-white font-bold text-xs uppercase px-6 py-2 rounded-full shadow-md hover:bg-brand-600 transition-colors tracking-wider"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-3 z-40">
          <button
            onClick={() => {
              if (!user || !user.phone) {
                navigate('/profile');
                return;
              } else {
                navigate('/cart');
              }
            }}
            className="w-full max-w-md mx-auto bg-brand-500 hover:bg-brand-600 text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-xl shadow-brand-500/30 transition-all active:scale-[0.98] block"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-black">{cartCount}</div>
              <span className="font-bold text-sm">View Cart</span>
            </div>
            <span className="font-black text-sm">₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Back to Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className={`fixed right-4 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all animate-in fade-in zoom-in hover:scale-110 ${cart.length > 0 ? 'bottom-[160px]' : 'bottom-[100px]'}`}
          aria-label="Back to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};
