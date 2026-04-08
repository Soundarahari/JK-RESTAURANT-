import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Navigation, Upload, CheckCircle2, Edit3, ShoppingBag, Package, Copy, ArrowLeft } from 'lucide-react';
import { calculateDistance, RESTAURANT_COORDS, MAX_DELIVERY_RADIUS_KM } from '../utils/geo';
import { supabase } from '../lib/supabase';

export const Checkout = () => {
  const { cart, user, orderMode, setOrderMode, getTotalPrice, promos, appliedPromoCode, setAppliedPromoCode } = useStore();
  const navigate = useNavigate();
  const [distance, setDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoError, setGeoError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [promoInput, setPromoInput] = useState('');

  const UPI_ID = import.meta.env.VITE_UPI_ID || 'soundarahari@fam';

  // Real file upload handler
  const handleScreenshotUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }
    setIsUploadingScreenshot(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `payment-proofs/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Fallback: use object URL locally if storage upload fails
      setPaymentScreenshot(URL.createObjectURL(file));
    } else {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      setPaymentScreenshot(urlData.publicUrl);
    }
    setIsUploadingScreenshot(false);
  };

  const handleApplyPromo = () => {
    const promo = promos.find(p => p.code.toUpperCase() === promoInput.toUpperCase() && p.is_active);
    if (!promo) {
      alert('Invalid or inactive promo code.');
      return;
    }
    setAppliedPromoCode(promo);
    setPromoInput('');
  };

  const isStudentVerified = user?.is_student || appliedPromoCode?.discount_type === 'student_offer';
  const subtotalBeforeDiscount = cart.reduce((sum, item) => sum + ((isStudentVerified ? item.student_price : item.base_price) * item.quantity), 0);
  const itemTotal = getTotalPrice();
  const discountAmount = subtotalBeforeDiscount - itemTotal;
  const platformFee = 5;
  const gstAndCharges = Math.round(itemTotal * 0.05);
  const isTakeaway = orderMode === 'takeaway';
  const isTooFar = !isTakeaway && distance !== null && distance > MAX_DELIVERY_RADIUS_KM;
  const deliveryFee = isTakeaway ? 0 : (distance !== null && distance <= MAX_DELIVERY_RADIUS_KM ? (distance > 3 ? 40 : 20) : 0);
  
  const grandTotal = itemTotal + (isTakeaway ? 0 : platformFee) + gstAndCharges + deliveryFee;

  const handleLocate = () => {
    setIsLocating(true);
    setGeoError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const dist = calculateDistance(lat, lng, RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng);
          setDistance(dist);
          setUserLocation({ lat, lng });
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

    if (!isTakeaway && !deliveryAddress) {
      alert('Please enter your delivery address');
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const { success, error } = await useStore.getState().placeOrder(
        paymentScreenshot, 
        utrNumber, 
        isTakeaway ? undefined : deliveryAddress,
        userLocation || undefined
      );
      
      if (success) {
        useStore.getState().clearCart();
        navigate('/profile');
      } else {
        alert(`Order Failed: ${error || 'Please try again later'}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(`Order Failed: ${err.message || 'Network error'}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const canPlaceOrder = isTakeaway
    ? (paymentScreenshot !== null && utrNumber.length >= 6)
    : (distance !== null && !isTooFar && paymentScreenshot !== null && utrNumber.length >= 6 && deliveryAddress.length > 5);


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
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2"><Navigation size={14} /> Delivery Address</h3>
          <textarea
            placeholder="Enter your complete address (House No, Building, Landmark...)"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={3}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 outline-none focus:ring-1 focus:ring-brand-500 text-gray-800 dark:text-gray-200 resize-none"
          />
          {distance === null ? (
            <div className="mt-4">
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
            <div className={`mt-4 p-4 rounded-xl ${isTooFar ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50'}`}>
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
          onChange={(e) => setCookingInstructions(e.target.value.slice(0, 200))}
          maxLength={200}
          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 outline-none focus:ring-1 focus:ring-brand-500 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Bill Summary & Promo */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6">
        {isStudentVerified ? (
          <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 p-4 rounded-2xl mb-6 flex items-center justify-between">
            <div>
              <p className="font-black text-sm text-green-700 dark:text-green-400">Student Verified ✓</p>
              <p className="text-xs mt-0.5 text-green-600/80 dark:text-green-500 font-medium">Student discount automatically applied to prices.</p>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            {appliedPromoCode ? (
              <div className="bg-brand-50/50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-900/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-black text-sm text-brand-700 dark:text-brand-400">Promo Applied: {appliedPromoCode.code}</p>
                  <p className="text-xs mt-0.5 text-brand-600/80 dark:text-brand-500 font-medium">
                    {appliedPromoCode.discount_type === 'percentage' ? `${appliedPromoCode.discount_value}% OFF` : `₹${appliedPromoCode.discount_value} OFF`} active.
                  </p>
                </div>
                <button 
                  onClick={() => setAppliedPromoCode(null)}
                  className="text-red-500 font-bold text-xs uppercase hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Have a promo code?"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-brand-500 uppercase placeholder:normal-case"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoInput}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 font-black rounded-xl text-xs uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        <h3 className="font-black text-sm mb-4 text-gray-900 dark:text-white uppercase tracking-wider">Bill Summary</h3>
        <div className="space-y-3 mb-4 text-sm font-bold text-gray-600 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Item Total</span>
            <span>₹{subtotalBeforeDiscount}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-brand-500">
              <span>Discount ({appliedPromoCode?.code || 'Student'})</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}
          {!isTakeaway && (
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
          )}
          {!isTakeaway && (
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST & Charges</span>
            <span>₹{gstAndCharges}</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between font-black text-lg text-gray-900 dark:text-white">
          <span>Grand Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      {/* Payment Proof Section */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <h3 className="font-black text-sm mb-2 text-gray-900 dark:text-white uppercase tracking-wider">Payment via UPI</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-6 font-bold uppercase tracking-widest">Pay securely using any UPI app</p>

        <a
          href={`upi://pay?pa=${UPI_ID}&pn=JKRestaurant&am=${grandTotal}&cu=INR`}
          className="w-full bg-[#6528df] text-white font-black py-4 rounded-2xl flex items-center justify-center mb-4 cursor-pointer hover:bg-opacity-90 shadow-xl shadow-[#6528df]/20 transition-all active:scale-95 text-sm"
        >
          Pay ₹{grandTotal} with UPI App
        </a>

        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 mb-6">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{UPI_ID}</p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(UPI_ID);
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
              onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
              maxLength={16}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-1 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <p className="text-[10px] font-black mb-2 text-gray-400 uppercase tracking-widest">2. Payment Screenshot</p>
            {!paymentScreenshot ? (
              <label
                className="w-full border-2 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50/10 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-brand-500 transition-colors cursor-pointer"
              >
                <Upload size={24} className="text-gray-300" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {isUploadingScreenshot ? 'Uploading...' : 'Tap to Upload Receipt'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingScreenshot}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleScreenshotUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
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
      <div className="fixed bottom-[72px] lg:bottom-0 left-0 lg:left-60 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-40">
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
