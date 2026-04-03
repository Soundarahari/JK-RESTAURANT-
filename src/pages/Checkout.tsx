import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Navigation, Upload, CheckCircle2, Edit3, Ticket, ShoppingBag, Package, Copy, ArrowLeft } from 'lucide-react';
import { calculateDistance, RESTAURANT_COORDS, MAX_DELIVERY_RADIUS_KM } from '../utils/geo';

export const Checkout = () => {
  const { cart, user, orderMode, setOrderMode, getTotalPrice } = useStore();
  const navigate = useNavigate();
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const itemTotal = getTotalPrice();
  const platformFee = 5;
  const gstAndCharges = Math.round(itemTotal * 0.05);
  const isTakeaway = orderMode === 'takeaway';
  const isTooFar = !isTakeaway && distance !== null && distance > MAX_DELIVERY_RADIUS_KM;
  const deliveryFee = isTakeaway ? 0 : (distance !== null && distance <= MAX_DELIVERY_RADIUS_KM ? (distance > 3 ? 40 : 20) : 0);
  
  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME50') {
      setIsCouponApplied(true);
    } else {
      alert('Invalid Coupon Code');
      setIsCouponApplied(false);
    }
  };

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

  const handlePlaceOrder = async () => {
    if (!user || user.phone === '') {
      navigate('/profile');
      return;
    }
    
    if (!paymentScreenshot) {
      alert('Please upload payment screenshot');
      return;
    }

    if (!utrNumber || utrNumber.length < 6) {
      alert('Please enter a valid UTR / Transaction Reference number');
      return;
    }
    
    setIsPlacingOrder(true);
    const { success, error } = await useStore.getState().placeOrder(paymentScreenshot, utrNumber);
    
    if (success) {
      setOrderComplete(true);
      useStore.getState().clearCart();
    } else {
      alert(`Order Failed: ${error || 'Please try again later'}`);
    }
    setIsPlacingOrder(false);
  };

  const canPlaceOrder = isTakeaway
    ? (paymentScreenshot !== null && utrNumber.length >= 6)
    : (distance !== null && !isTooFar && paymentScreenshot !== null && utrNumber.length >= 6);

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in px-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Order Placed Successfully!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
          {isTakeaway 
            ? 'Head to the counter to collect your order. Show your order ID to the staff.' 
            : 'Your food is being prepared and will be delivered soon. Stay close to your phone!'}
        </p>
        <button 
          onClick={() => navigate('/profile')}
          className="mt-8 bg-brand-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg active:scale-95 transition-all"
        >
          Track My Order
        </button>
      </div>
    );
  }

  // Effect to redirect if cart is empty on mount
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart.length, navigate]);

  if (cart.length === 0) return null;

  return (
    <div className="pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cart')} className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">Checkout</h2>
      </div>

      {/* Order Mode Toggle */}
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

      {/* Delivery Check */}
      {!isTakeaway && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white mb-3 text-sm"><Navigation size={16} /> Delivery Location</h3>
          {distance === null ? (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Check if you're within our {MAX_DELIVERY_RADIUS_KM}km delivery zone.</p>
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
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Outside delivery zone! Please switch to Takeaway.</p>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">✅ You are in the delivery zone.</p>
              )}
              <button onClick={handleLocate} className="text-xs underline text-gray-500 dark:text-gray-400 mt-2 block">Update Location</button>
            </div>
          )}
        </div>
      )}

      {/* Cooking Instructions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-4">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2"><Edit3 size={14} /> Cooking Instructions</h3>
        <input
          type="text"
          placeholder="E.g. No onion, make it extra spicy..."
          value={cookingInstructions}
          onChange={(e) => setCookingInstructions(e.target.value)}
          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 outline-none focus:ring-1 focus:ring-brand-500 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Payment Proof Section */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
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
              alert('UPI ID copied!');
            }}
            className="flex items-center gap-1.5 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300"
          >
            <Copy size={12} /> Copy
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest">1. Transaction UTR Number</p>
            <input
              type="text"
              placeholder="Enter 12-digit UTR Number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-1 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <p className="text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest">2. Payment Screenshot</p>
            {!paymentScreenshot ? (
              <button
                onClick={() => setPaymentScreenshot('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500')}
                className="w-full border-2 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50/10 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-500 transition-colors"
              >
                <Upload size={24} className="text-gray-300" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Tap to Upload Receipt</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/30">
                <img src={paymentScreenshot} alt="Payment Proof" className="w-full h-32 object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 backdrop-blur-[2px]">
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} /> Screenshot Uploaded
                  </p>
                </div>
                <button 
                  onClick={() => setPaymentScreenshot(null)}
                  className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 p-1.5 rounded-lg text-red-500 shadow-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total to Pay</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₹{grandTotal}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={!canPlaceOrder || isPlacingOrder}
            className={`flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
              !canPlaceOrder || isPlacingOrder
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300'
                : 'bg-brand-500 text-white shadow-xl shadow-brand-500/20'
            }`}
          >
            {isPlacingOrder ? 'Processing...' : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
};
