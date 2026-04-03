import { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Navigation, Upload, CheckCircle2, Edit3, Ticket, ShoppingBag, Package, Copy } from 'lucide-react';
import { calculateDistance, RESTAURANT_COORDS, MAX_DELIVERY_RADIUS_KM } from '../utils/geo';

export const Cart = () => {
  const { cart, user, orderMode, setOrderMode } = useStore();
  const navigate = useNavigate();
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const isStudentVerified = user?.is_student && user?.verification_status === 'verified';

  const itemTotal = cart.reduce((sum, item) => {
    const price = isStudentVerified ? item.student_price : item.base_price;
    return sum + (price * item.quantity);
  }, 0);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME50') {
      setIsCouponApplied(true);
    } else {
      alert('Invalid Coupon Code');
      setIsCouponApplied(false);
    }
  };

  const platformFee = 5;
  const gstAndCharges = Math.round(itemTotal * 0.05);
  const isTakeaway = orderMode === 'takeaway';
  const isTooFar = !isTakeaway && distance !== null && distance > MAX_DELIVERY_RADIUS_KM;
  const deliveryFee = isTakeaway ? 0 : (distance !== null && distance <= MAX_DELIVERY_RADIUS_KM ? (distance > 3 ? 40 : 20) : 0);
  const discount = isCouponApplied ? 50 : 0;
  const grandTotal = itemTotal + (isTakeaway ? 0 : platformFee) + gstAndCharges + deliveryFee - discount;

  const handleLocate = () => {
    setIsLocating(true);
    setGeoError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = calculateDistance(position.coords.latitude, position.coords.longitude, RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng);
          setDistance(dist);
          setIsLocating(false);
        },
        () => {
          setGeoError('Could not access your location. Please enable GPS and try again.');
          setIsLocating(false);
        }
      );
    } else {
      setGeoError('Your browser does not support location services.');
      setIsLocating(false);
    }
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCheckout = async () => {
    if (!user || !user.phone) {
      navigate('/profile');
      return;
    }
    
    setIsPlacingOrder(true);
    const { success, error } = await useStore.getState().placeOrder(paymentScreenshot || '');
    
    if (success) {
      setOrderComplete(true);
    } else {
      alert(`Order Failed: ${error || 'Please try again later'}`);
    }
    setIsPlacingOrder(false);
  };

  // Can place order if: takeaway OR (delivery + in range + location checked)
  const canPlaceOrder = isTakeaway
    ? paymentScreenshot !== null
    : (distance !== null && !isTooFar && paymentScreenshot !== null);

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">🎉</div>
        <CheckCircle2 size={56} className="text-brand-500 mb-3" />
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Order Placed!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {isTakeaway ? 'Head to the counter to collect your order.' : 'Your food is being prepared and will be delivered soon.'}
        </p>
      </div>
    );
  }

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
    <div className="pb-24">
      <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-4">Review Order</h2>

      {/* Order Mode Toggle: Delivery vs Takeaway */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-1.5 mb-4 flex gap-1.5">
        <button
          onClick={() => setOrderMode('delivery')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            orderMode === 'delivery'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <ShoppingBag size={16} /> Delivery
        </button>
        <button
          onClick={() => setOrderMode('takeaway')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            orderMode === 'takeaway'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Package size={16} /> Take Away
        </button>
      </div>

      {/* Cart Items */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4">
        {cart.map(item => (
          <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.name}</p>
              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
            </div>
            <div className="flex items-center gap-2">
              {isStudentVerified ? (
                <>
                  <span className="font-bold text-gray-800 dark:text-white text-sm">₹{item.student_price * item.quantity}</span>
                  <span className="text-[10px] text-gray-400 line-through">₹{item.base_price * item.quantity}</span>
                </>
              ) : (
                <span className="font-bold text-gray-800 dark:text-white text-sm">₹{item.base_price * item.quantity}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Location (only for delivery mode) */}
      {!isTakeaway && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white mb-3 text-sm"><Navigation size={16} /> Delivery Location</h3>
          {distance === null ? (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">We need to check if you're within our {MAX_DELIVERY_RADIUS_KM}km delivery radius.</p>
              <button
                onClick={handleLocate}
                disabled={isLocating}
                className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
              >
                {isLocating ? 'Locating...' : '📍 Check My Location'}
              </button>
              {geoError && <p className="text-xs text-red-500 mt-2">{geoError}</p>}
            </div>
          ) : (
            <div className={`p-4 rounded-xl ${isTooFar ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50'}`}>
              <p className={`font-bold text-sm ${isTooFar ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                📍 Distance: {distance.toFixed(1)} km
              </p>
              {isTooFar ? (
                <div className="mt-2">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                    😔 Oops! It looks like you're outside our delivery zone ({MAX_DELIVERY_RADIUS_KM}km radius).
                    We're unable to deliver to your location at this time.
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400/80 mt-2">
                    💡 <strong>Suggestions:</strong>
                  </p>
                  <ul className="text-xs text-red-500 dark:text-red-400/80 mt-1 list-disc ml-4 space-y-1">
                    <li>Try checking from a location closer to the restaurant</li>
                    <li>Switch to <strong>Take Away</strong> and pick up from the counter — no distance limit!</li>
                  </ul>
                  <button
                    onClick={() => setOrderMode('takeaway')}
                    className="mt-3 w-full bg-brand-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md"
                  >
                    🛍️ Switch to Take Away
                  </button>
                </div>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">✅ Great! You are within the delivery zone.</p>
              )}
              <button onClick={handleLocate} className="text-xs underline text-gray-500 dark:text-gray-400 mt-2 block">Update Location</button>
            </div>
          )}
        </div>
      )}

      {/* Takeaway notice */}
      {isTakeaway && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <Package size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm text-amber-800 dark:text-amber-300">Take Away Selected</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your order will be ready for pickup at JK Restaurant counter. No delivery fee applies!</p>
          </div>
        </div>
      )}

      {/* Cooking Instructions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Edit3 size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 mb-2">Cooking Instructions</h3>
            <input
              type="text"
              placeholder="E.g. Make it spicy, no onion..."
              value={cookingInstructions}
              onChange={(e) => setCookingInstructions(e.target.value)}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 outline-none focus:ring-1 focus:ring-brand-500 text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4">
        <div className="flex items-center gap-3">
          <Ticket size={18} className="text-brand-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">Apply Coupon</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Use WELCOME50 for ₹50 off</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="Enter Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={isCouponApplied}
            className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none uppercase font-bold text-gray-800 dark:text-gray-200"
          />
          <button
            onClick={isCouponApplied ? () => setIsCouponApplied(false) : handleApplyCoupon}
            className={`px-4 rounded-lg text-xs font-bold transition-colors ${isCouponApplied ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'}`}
          >
            {isCouponApplied ? 'REMOVE' : 'APPLY'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16"></div>
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <Ticket size={20} className="text-brand-400" /> Order Summary
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center opacity-70">
            <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
            <span className="text-sm font-black">₹{itemTotal}</span>
          </div>
          {!isTakeaway && (
            <div className="flex justify-between items-center opacity-70">
              <span className="text-xs font-bold uppercase tracking-widest">Delivery Fee</span>
              <span className="text-sm font-black">₹{deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-white/10 dark:border-gray-200 pt-6 mt-4">
            <span className="text-lg font-black tracking-tight uppercase">Grand Total</span>
            <span className="text-3xl font-black text-brand-400 dark:text-brand-600 tracking-tighter">₹{grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 p-6 mb-12">
        <h3 className="font-black text-sm mb-2 text-gray-900 dark:text-white uppercase tracking-wider">Payment via UPI</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-6 font-bold uppercase tracking-widest">Pay securely using any UPI app</p>

        <a
          href={`upi://pay?pa=soundarahari@fam&pn=JKRestaurant&am=${grandTotal}&cu=INR`}
          className="w-full bg-[#6528df] text-white font-black py-4 rounded-2xl flex items-center justify-center mb-4 cursor-pointer hover:bg-opacity-90 shadow-xl shadow-[#6528df]/20 transition-all active:scale-95 text-sm"
        >
          Pay ₹{grandTotal} with UPI App
        </a>

        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 mb-6">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">soundarahari@fam</p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText('soundarahari@fam');
              alert('UPI ID copied to clipboard!');
            }}
            className="flex items-center gap-1.5 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 active:scale-95 transition-all outline-none"
          >
            <Copy size={12} />
            Copy
          </button>
        </div>

        <div className="border-t border-gray-50 dark:border-gray-800 pt-6">
          <p className="text-[10px] font-black mb-3 text-gray-400 uppercase tracking-widest">Upload Screenshot</p>
          {!paymentScreenshot ? (
            <button
              onClick={() => setPaymentScreenshot('mock_screenshot_url.jpg')}
              className="w-full border-2 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 py-6 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 hover:border-brand-500 hover:text-brand-500 transition-all hover:bg-white dark:hover:bg-gray-800"
            >
              <Upload size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">Tap to upload</span>
            </button>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 py-4 px-5 rounded-2xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30 animate-in zoom-in duration-300">
              <CheckCircle2 size={20} />
              <span className="text-sm font-black">Transfer Completed ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all z-40">
        <div className="flex items-center gap-6 max-w-md mx-auto">
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{orderMode === 'takeaway' ? 'Take Away' : 'Final'} Amount</p>
            <p className="font-black text-2xl text-gray-900 dark:text-white tracking-tighter">₹{grandTotal}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={!canPlaceOrder || isPlacingOrder}
            className={`h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest flex-shrink-0 transition-all active:scale-95 flex items-center justify-center gap-2 ${
              !canPlaceOrder || isPlacingOrder
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'bg-brand-500 text-white shadow-2xl shadow-brand-500/30'
            }`}
          >
            {isPlacingOrder ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                PLACING...
              </>
            ) : (
              !user?.phone ? 'LOGIN FIRST' : 'PLACE ORDER →'
            )}
          </button>
        </div>
      </div>

      <div className="h-10"></div>
    </div>
  );
};
