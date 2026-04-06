import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Search, ArrowUp, Star, Clock, MapPin, Flame, Utensils, Popcorn, Truck, GlassWater, Plus, Minus, ChevronRight } from 'lucide-react';
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
  const isStudentVerified = user?.is_student && user?.verification_status === 'verified';

  return (
    <div className="min-w-[250px] max-w-[280px] snap-start bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100/50 dark:border-gray-800/50 overflow-hidden flex-shrink-0 group">
      <div className="relative h-36 overflow-hidden">
        <img src={product.image_url} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
        />
        <div className="absolute top-2.5 left-2.5 bg-amber-400/90 backdrop-blur-sm text-gray-900 text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star size={8} fill="currentColor" /> BESTSELLER
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
            <div className="bg-brand-500 flex items-center h-8 rounded-xl px-0.5 shadow-md">
              <button onClick={() => cartItem.quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-7 flex justify-center items-center text-white active:scale-90 transition-transform">
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="w-6 text-center text-xs font-black text-white">{cartItem.quantity}</span>
              <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-7 flex justify-center items-center text-white active:scale-90 transition-transform">
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button onClick={() => addToCart(product)} disabled={!product.is_available}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 h-8 px-5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white transition-all active:scale-95 disabled:opacity-40">
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
export const Home = () => {
  const { products, fetchProducts, cart, getTotalPrice, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const [showTopBtn, setShowTopBtn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const h = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = getTotalPrice();

  /* ── Derived data ── */
  const subCategories = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number }>();
    products.forEach(p => {
      const key = p.sub_category || p.name;
      if (!map.has(key)) map.set(key, { name: key, image: p.image_url, count: 0 });
      map.get(key)!.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

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

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  }, []);

  const isSearching = searchQuery.length > 0;

  return (
    <div className="flex flex-col h-full">

      {/* ═══ Hero Banner ═══ */}
      <div className="relative -mx-4 lg:-mx-10 -mt-4 lg:-mt-8 mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-emerald-500 px-5 lg:px-10 py-6 lg:py-10">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">{greeting} 👋</p>
          <h1 className="text-white text-2xl lg:text-3xl font-black tracking-tight">JK Restaurant 🍽️</h1>
          <p className="text-white/60 text-xs mt-1 font-medium">Highway &amp; Student-Friendly Pricing</p>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Clock size={12} className="text-white/80" /><span className="text-white/90 text-[10px] font-bold">20-30 min</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <MapPin size={12} className="text-white/80" /><span className="text-white/90 text-[10px] font-bold">5km delivery</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-400/30 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-emerald-100 text-[10px] font-bold">Open Now</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-5">
            <input type="text" placeholder="Search 'Paneer', 'Noodles', 'Falooda'..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/95 dark:bg-gray-900/95 border-0 text-gray-900 dark:text-gray-100 rounded-2xl py-3.5 pl-11 pr-4 outline-none shadow-lg text-sm font-medium placeholder:text-gray-400"
            />
            <Search size={16} className="absolute left-4 top-4 text-gray-400" />
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-5 bg-gray-50 dark:bg-gray-950 rounded-t-[24px]"></div>
      </div>

      {isSearching ? (
        /* ═══ Search Results ═══ */
        <div className="pb-6">
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-4">
            Results for "<span className="text-brand-500">{searchQuery}</span>"
          </h2>
          {searchResults.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No dishes found</p>
              <button onClick={() => setSearchQuery('')} className="mt-4 bg-brand-500 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-full shadow-md">Clear Search</button>
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
          {/* ─── What's on your mind? ─── */}
          <section className="mb-8">
            <h2 className="text-[15px] lg:text-lg font-black text-gray-800 dark:text-white mb-4 uppercase tracking-wide">
              What's on your mind?
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-5">
              {subCategories.map((sc, i) => (
                <Link key={sc.name} to={`/category/${encodeURIComponent(sc.name)}`}
                  className="flex flex-col items-center group animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="w-[76px] h-[76px] lg:w-24 lg:h-24 rounded-full overflow-hidden border-[3px] border-white dark:border-gray-800 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-active:scale-95 bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-100 dark:ring-gray-700">
                    <img src={sc.image} alt={sc.name} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200'; }}
                    />
                  </div>
                  <span className="text-[11px] lg:text-xs font-bold text-gray-600 dark:text-gray-300 mt-2 text-center leading-tight max-w-[80px]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {sc.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ─── Bestsellers Carousel ─── */}
          {bestsellers.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[15px] lg:text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Star size={16} className="text-amber-400" fill="currentColor" /> Bestsellers
              </h2>
              <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x snap-mandatory pb-2">
                {bestsellers.map(p => <BestsellerCard key={p.id} product={p} />)}
              </div>
            </section>
          )}

          {/* ─── Browse by Category ─── */}
          <section className="mb-8 pb-4">
            <h2 className="text-[15px] lg:text-lg font-black text-gray-800 dark:text-white mb-4 uppercase tracking-wide">
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
                    <div className="absolute right-2 top-2 w-10 h-10 bg-white/10 rounded-full"></div>
                    <Icon size={28} className="text-white/90 mb-3" />
                    <h3 className="text-white font-black text-base leading-tight">{cat.name}</h3>
                    <p className="text-white/70 text-[10px] font-semibold mt-0.5">{cat.count} items</p>
                    <div className="flex items-center gap-1 mt-3 text-white/60 group-hover:text-white/90 transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
                      <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ═══ Floating Cart Bar ═══ */}
      {cart.length > 0 && (
        <div className="fixed bottom-[72px] lg:bottom-6 left-0 lg:left-60 right-0 px-4 pb-3 lg:pb-0 z-40">
          <button onClick={() => { if (!user || !user.phone) navigate('/profile'); else navigate('/cart'); }}
            className="w-full max-w-md mx-auto lg:max-w-sm lg:ml-auto lg:mr-8 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-xl shadow-brand-500/30 transition-all active:scale-[0.98] block">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-black">{cartCount}</div>
              <span className="font-bold text-sm">View Cart</span>
            </div>
            <span className="font-black text-sm">₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* ═══ Back to Top ═══ */}
      {showTopBtn && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed right-6 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all animate-in fade-in zoom-in hover:scale-110 ${cart.length > 0 ? 'bottom-[160px] lg:bottom-24' : 'bottom-[100px] lg:bottom-8'}`}
          aria-label="Back to top">
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};
