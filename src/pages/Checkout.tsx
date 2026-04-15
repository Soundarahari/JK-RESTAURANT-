import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Navigation, Edit3, ShoppingBag, Package, ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { calculateDistance, RESTAURANT_COORDS, MAX_DELIVERY_RADIUS_KM } from '../utils/geo';

// Razorpay type declaration for the global checkout script
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Checkout = () => {
  const { cart, user, orderMode, setOrderMode, getTotalPrice, promos, appliedPromoCode, setAppliedPromoCode } = useStore();
  const navigate = useNavigate();
  const [distance, setDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [geoError, setGeoError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const [cookingInstructions, setCookingInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const COLLEGES = [
    { name: "Excel INSTITUTIONS", lat: 11.449777022281602, lng: 77.77186479045226 },
    { name: "Vivekanandha Womens College", lat: 11.455741, lng: 77.787932 },
    { name: "SSM College Of Engineering", lat: 11.446155728908327, lng: 77.74304949860891 },
    { name: "JKKN INSTITUTIONS", lat: 11.444208686451457, lng: 77.73152736996532 },
    { name: "JKKM Educational Institutions", lat: 11.445028710223212, lng: 77.72766349669432 },
    { name: "Other (Use GPS / Map Location)", lat: null, lng: null }
  ];

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
  const activeCollege = selectedCollege && selectedCollege !== 'Other (Use GPS / Map Location)';
  const isTooFar = !isTakeaway && !activeCollege && distance !== null && distance > MAX_DELIVERY_RADIUS_KM;
  const deliveryFee = isTakeaway ? 0 : ((distance !== null && distance <= MAX_DELIVERY_RADIUS_KM && distance > 3) ? 40 : 20);

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

  // Razorpay payment handler
  const handlePayWithRazorpay = async () => {
    if (!user || user.phone === '') {
      navigate('/profile');
      return;
    }

    if (!isTakeaway && !deliveryAddress) {
      alert('Please enter your delivery address');
      return;
    }

    setIsPlacingOrder(true);
    setPaymentError('');

    try {
      // Step 1: Create Razorpay order on our server
      const appUrl = window.location.origin;
      const apiUrl = import.meta.env.PROD
        ? `${appUrl}/api/razorpay-order`
        : '/api/razorpay-order';

      const orderRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal })
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${orderRes.status})`);
      }

      const orderData = await orderRes.json();

      // Step 2: Open Razorpay checkout popup
      const razorpayKeyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKeyId) {
        throw new Error('Payment gateway configuration error. Please contact support.');
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'JK Restaurant',
        description: `Order - ${cart.length} item(s)`,
        order_id: orderData.id,
        prefill: {
          name: user.full_name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: '#f97316', // brand-500 orange
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Step 3: Payment successful — place order in our system
          try {
            let finalLocation = userLocation || undefined;
            const selectedCollegeData = COLLEGES.find(c => c.name === selectedCollege);
            if (selectedCollegeData && selectedCollegeData.lat && selectedCollegeData.lng) {
              finalLocation = { lat: selectedCollegeData.lat, lng: selectedCollegeData.lng };
            }

            const { success, error } = await useStore.getState().placeOrder(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              isTakeaway ? undefined : deliveryAddress,
              finalLocation
            );

            if (success) {
              useStore.getState().clearCart();
              navigate('/profile');
            } else {
              setPaymentError(`Order Failed: ${error || 'Please try again later'}`);
              alert(`Payment was received but order failed to save: ${error || 'Please contact support with your payment ID: ' + response.razorpay_payment_id}`);
            }
          } catch (err: any) {
            console.error('Post-payment error:', err);
            setPaymentError(`Payment received but order failed. Payment ID: ${response.razorpay_payment_id}. Please contact support.`);
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error('Payment gateway failed to load. Please refresh the page and try again.');
      }

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        setPaymentError(response.error?.description || 'Payment failed. Please try again.');
        setIsPlacingOrder(false);
      });

      rzp.open();

    } catch (err: any) {
      console.error('Razorpay checkout error:', err);
      setPaymentError(err.message || 'Could not initiate payment. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  // Validation: can we proceed to pay?
  const canPay = isTakeaway
    ? true
    : ((activeCollege || (distance !== null && !isTooFar)) && (activeCollege || deliveryAddress.length > 5));

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
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${orderMode === 'delivery'
            ? 'bg-brand-500 text-white shadow-md'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
        >
          <ShoppingBag size={16} /> Delivery
        </button>
        <button
          onClick={() => setOrderMode('takeaway')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${orderMode === 'takeaway'
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
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Navigation size={14} /> Delivery Address</h3>

          {/* College Selection - Now visible to everyone to improve usability */}
          <div className="mb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Select Institution</label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                const newCollege = e.target.value;
                setSelectedCollege(newCollege);
                
                if (newCollege && newCollege !== 'Other (Use GPS / Map Location)') {
                  setDeliveryAddress(prev => {
                    // If address already starts with a college name from our list, replace it
                    const existingCollege = COLLEGES.find(c => prev.startsWith(c.name + ' - '));
                    if (existingCollege) {
                      return prev.replace(existingCollege.name + ' - ', newCollege + ' - ');
                    }
                    // Otherwise prepend it
                    return newCollege + ' - ' + prev;
                  });
                }
              }}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 outline-none focus:ring-1 focus:ring-brand-500 text-gray-800 dark:text-gray-200 font-bold"
            >
              <option value="">Choose Institution (Optional)</option>
              {COLLEGES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">{activeCollege ? "Room/Block or Custom Address" : "Full Address"}</label>
          <textarea
            placeholder={activeCollege ? "E.g. Men's Hostel Block B, Room 204..." : "Enter your complete address (House No, Building, Landmark...)"}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={3}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-3 outline-none focus:ring-1 focus:ring-brand-500 text-gray-800 dark:text-gray-200 resize-none"
          />
          {(!activeCollege && distance === null) ? (
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
          ) : distance !== null && (
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

          {activeCollege && distance === null && (
            <div className="mt-4 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/50">
              <p className="text-xs font-bold text-brand-700 dark:text-brand-400 mb-2">✅ Verified College Selected</p>
              <p className="text-[11px] text-brand-600/80">You don't need to specify your GPS location, but you can <button onClick={handleLocate} className="underline font-bold">Pin on Map</button> if you are ordering to a specific off-campus spot.</p>
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

      {/* Payment Section — Razorpay */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <h3 className="font-black text-sm mb-2 text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard size={16} /> Secure Payment
        </h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-6 font-bold uppercase tracking-widest">Pay securely via UPI, Card, Netbanking & more</p>

        {/* Payment Error */}
        {paymentError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{paymentError}</p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center gap-3 mb-5 bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-900/30 rounded-xl p-3">
          <Shield size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-green-700 dark:text-green-400">100% Secure Payment</p>
            <p className="text-[10px] text-green-600/70 dark:text-green-500/70">Powered by Razorpay — UPI, Cards, Netbanking, Wallets</p>
          </div>
        </div>

        {/* Payment method icons row */}
        <div className="flex items-center justify-center gap-4 mb-5 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">UPI</span>
          <span className="text-gray-200 dark:text-gray-600">•</span>
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cards</span>
          <span className="text-gray-200 dark:text-gray-600">•</span>
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Netbanking</span>
          <span className="text-gray-200 dark:text-gray-600">•</span>
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wallets</span>
        </div>

        {!canPay && !isTakeaway && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 mb-4">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {!deliveryAddress || deliveryAddress.length <= 5
                ? '📍 Please enter your delivery address above to continue'
                : '📍 Please verify your location is within our delivery zone'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-[72px] lg:bottom-0 left-0 lg:left-60 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total to Pay</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">₹{grandTotal}</p>
          </div>
          <button
            onClick={handlePayWithRazorpay}
            disabled={!canPay || isPlacingOrder}
            className={`flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${!canPay || isPlacingOrder
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-300'
              : 'bg-brand-500 text-white shadow-xl shadow-brand-500/20'
              }`}
          >
            {isPlacingOrder ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>Pay ₹{grandTotal} →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
