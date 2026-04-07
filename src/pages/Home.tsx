import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ArrowUp, Star, Flame, Utensils, Popcorn, Truck, GlassWater, Plus, Minus, ChevronRight, ChevronLeft, Mic, ShoppingBag } from 'lucide-react';
import { useStore } from '../store';
import { Product } from '../data/mock';

const CATEGORY_ICONS: Record<string, any> = {
  'Meals': Utensils, 'Chinese': Flame, 'Snacks': Popcorn, 'Fast Food': Truck, 'Coolers': GlassWater,
};
const CATEGORY_GRADIENTS: Record<string, string> = {
  'Meals': 'from-orange-500 to-amber-500', 'Chinese': 'from-red-500 to-rose-500',
  'Snacks': 'from-yellow-500 to-orange-400', 'Fast Food': 'from-blue-500 to-indigo-500',
  'Coolers': 'from-cyan-500 to-teal-500',
};

/* ── Compact Bestseller Card ── */
const BestsellerCard = ({ product }: { product: Product }) => {
  const { addToCart, cart, removeFromCart, updateQuantity, user } = useStore();
  const cartItem = cart.find(item => item.id === product.id);
  const isStudentVerified = user?.is_student;

  return (
    <div className="min-w-[250px] max-w-[280px] snap-start bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100/50 dark:border-gray-800/50 overflow-hidden flex-shrink-0 group">
      <div className="relative h-36 overflow-hidden">
        <img src={product.image_url} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <div className="bg-amber-400/90 backdrop-blur-sm text-gray-900 text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm self-start">
            <Star size={8} fill="currentColor" /> BESTSELLER
          </div>
          <div className="bg-white/90 backdrop-blur-sm text-gray-900 text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm self-start">
            <Star size={8} className="text-gray-400" /> {product.prep_time || 15} MIN
          </div>
        </div>
        <div className="absolute bottom-2.5 left-2.5">
          <div className={`p-1 rounded-md backdrop-blur-sm bg-white/90 border-2 ${product.is_veg ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${product.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Star size={10} className="text-amber-400" fill="currentColor" />
          <span className="text-white text-[10px] font-bold">{product.rating}</span>
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">{product.name}</h3>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.description}</p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="font-black text-base text-gray-900 dark:text-white">
            ₹{isStudentVerified ? product.student_price : product.base_price}
          </span>
          {cartItem ? (
            <div className="flex items-center h-8 bg-white dark:bg-gray-900 border-2 border-red-500 rounded-xl overflow-hidden shadow-lg shadow-red-500/10 transition-all">
              <button 
                onClick={() => cartItem.quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-8 h-full flex justify-center items-center text-red-500 hover:bg-red-50 transition-colors active:scale-90"
              >
                <Minus size={12} strokeWidth={4} />
              </button>
              <span className="w-6 text-center text-[11px] font-black text-red-600 dark:text-red-400">{cartItem.quantity}</span>
              <button 
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-8 h-full flex justify-center items-center text-red-500 hover:bg-red-50 transition-colors active:scale-90"
              >
                <Plus size={12} strokeWidth={4} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => addToCart(product)} 
              disabled={!product.is_available}
              className="bg-white dark:bg-gray-950 text-red-500 border-2 border-red-500 h-8 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shadow-md active:scale-95 disabled:border-gray-200 disabled:text-gray-300 flex items-center gap-1"
            >
              ADD 
              <Plus size={12} strokeWidth={4} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
export const Home = () => {
  const products = useStore(state => state.products);
  const fetchProducts = useStore(state => state.fetchProducts);
  const cart = useStore(state => state.cart);
  const user = useStore(state => state.user);
  const categories = useStore(state => state.categories);
  const fetchCategories = useStore(state => state.fetchCategories);
  const isLoading = useStore(state => state.isLoading);
  const navigate = useNavigate();

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const [showTopBtn, setShowTopBtn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const h = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* ── Derived data ── */
  const derivedSubCategories = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number }>();
    products.forEach(p => {
      const key = p.sub_category || p.name;
      if (!map.has(key)) map.set(key, { name: key, image: p.image_url, count: 0 });
      map.get(key)!.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  const displayCategories = categories.length > 0 
    ? categories.map(c => ({ name: c.name, image: c.image_url })) 
    : derivedSubCategories;

  const mainCategories = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    products.forEach(p => {
      if (!map.has(p.category)) map.set(p.category, { name: p.category, count: 0 });
      map.get(p.category)!.count++;
    });
    const order = ['Meals', 'Chinese', 'Snacks', 'Fast Food', 'Coolers'];
    return Array.from(map.values()).sort((a, b) => {
      const ai = order.indexOf(a.name), bi = order.indexOf(b.name);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }, [products]);

  const bestsellers = useMemo(() => products.filter(p => p.bestseller && p.is_available), [products]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) || (p.sub_category || '').toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const isSearching = searchQuery.length > 0;

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin mb-6 shadow-sm"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading Menu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 animate-in fade-in duration-700 pb-20">

      {/* ═══ Header / Search Bar ═══ */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md px-4 py-3 -mx-4 lg:-mx-10 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full py-2.5 pl-4 pr-12 shadow-sm focus-within:shadow-md transition-all duration-300">
          <ChevronLeft size={22} className="text-red-500 cursor-pointer" onClick={() => navigate(-1)} />
          <input
            type="text"
            placeholder="Restaurant name or a dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 text-gray-800 dark:text-gray-100 outline-none text-[15px] font-medium placeholder:text-gray-400 placeholder:font-normal"
          />
          <div className="absolute right-4 flex items-center">
             <Mic size={20} className="text-red-500 cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="pt-4 pb-6 px-1">
        {isSearching ? (
          /* ═══ Search Results ═══ */
          <div className="pb-6">
            <h2 className="text-lg font-black text-gray-800 dark:text-white mb-4">
              Results for "<span className="text-brand-500">{searchQuery}</span>"
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No dishes found</p>
                <button onClick={() => setSearchQuery('')} className="mt-4 bg-red-500 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-full shadow-md">Clear Search</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
                {searchResults.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        ) : (
          /* ═══ Default Home ═══ */
          <>
            {/* ─── WHAT'S ON YOUR MIND? ─── */}
            <section className="mb-10">
              <h2 className="text-[14px] font-extrabold text-[#5A6D8D] dark:text-gray-400 mb-6 uppercase tracking-[0.08em] px-1">
                What's on your mind?
              </h2>
              <div className="grid grid-cols-3 gap-x-4 gap-y-10 lg:grid-cols-6 stagger-children">
                {displayCategories.map((sc, i) => (
                  <Link
                    key={sc.name}
                    to={`/category/${encodeURIComponent(sc.name)}`}
                    className="flex flex-col items-center group animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="relative w-full aspect-square mb-2.5 px-1">
                       <img
                        src={sc.image}
                        alt={sc.name}
                        className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200";
                        }}
                      />
                    </div>
                    <span className="text-[12px] lg:text-[13px] font-black text-[#3D4B68] dark:text-gray-300 text-center leading-tight uppercase transition-colors group-hover:text-red-500 px-1">
                      {sc.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* ─── Bestsellers ─── */}
            {bestsellers.length > 0 && (
              <section className="mb-10">
                <h2 className="text-[14px] font-black text-[#5A6D8D] dark:text-gray-400 mb-6 uppercase tracking-wider px-1">
                   Bestsellers
                </h2>
                <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x snap-mandatory pb-2">
                  {bestsellers.map(p => <BestsellerCard key={p.id} product={p} />)}
                </div>
              </section>
            )}

            {/* ─── Explore Menu ─── */}
            <section className="mb-8 pb-4">
              <h2 className="text-[14px] font-black text-[#5A6D8D] dark:text-gray-400 mb-6 uppercase tracking-wider px-1">
                Explore Menu
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {mainCategories.map((cat, i) => {
                  const Icon = CATEGORY_ICONS[cat.name] || Utensils;
                  const grad = CATEGORY_GRADIENTS[cat.name] || 'from-gray-500 to-gray-600';
                  return (
                    <Link key={cat.name} to={`/category/${encodeURIComponent(cat.name)}`}
                      className={`group relative overflow-hidden rounded-2xl p-4 lg:p-5 bg-gradient-to-br ${grad} shadow-lg hover:shadow-xl transition-all active:scale-[0.97] animate-fade-in`}
                      style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                      <Icon size={28} className="text-white/90 mb-3" />
                      <h3 className="text-white font-black text-base leading-tight">{cat.name}</h3>
                      <p className="text-white/70 text-[10px] font-semibold mt-0.5">{cat.count} items</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ═══ Floating Cart Bar ═══ */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-[60] animate-in slide-in-from-bottom-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full max-w-lg mx-auto bg-red-500 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-2xl shadow-red-500/30 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
               <ShoppingBag size={22} className="text-white" />
               <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{cartCount} {cartCount === 1 ? 'item' : 'items'} added</span>
                  <span className="text-sm font-black uppercase tracking-tight italic">View cart</span>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-base">₹{cart.reduce((s, i) => s + ((user?.is_student ? i.student_price : i.base_price) * i.quantity), 0)}</span>
              <ChevronRight size={20} strokeWidth={3} />
            </div>
          </button>
        </div>
      )}

      {/* ═══ Back to Top ═══ */}
      {showTopBtn && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed right-6 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-xl transition-all animate-in zoom-in hover:scale-110 ${cart.length > 0 ? 'bottom-28' : 'bottom-8'}`}
          aria-label="Back to top">
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};
