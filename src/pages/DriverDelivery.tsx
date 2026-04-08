import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Phone, Package, CheckCircle2, MapPin } from 'lucide-react';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { RESTAURANT_COORDS } from '../utils/geo';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface OrderData {
  id: string;
  user_name: string;
  user_phone: string;
  items: Array<{ name: string; quantity: number; base_price: number }>;
  total_amount: number;
  status: string;
  delivery_location: { lat: number; lng: number } | null;
  order_mode: string;
}

export const DriverDelivery = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Access Control
  useEffect(() => {
    if (loading) return;
    if (!user?.is_driver) {
      navigate('/');
    }
  }, [user, navigate, loading]);

  // Fetch order from Supabase
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !data) {
        setError('Order not found. Please check the link.');
        setLoading(false);
        return;
      }

      setOrder(data as OrderData);
      if (data.status === 'completed') setDelivered(true);
      if (data.status === 'out_for_delivery') {
        // If already tracking, resume
        setIsTracking(true);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const startDelivery = async () => {
    if (!orderId || !order) return;

    console.log('[DRIVER] Starting delivery for order:', orderId);

    try {
      const response = await fetch('/api/driver-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus: 'out_for_delivery' }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[DRIVER] ❌ Failed to start delivery:', result);
        alert('Failed to update order status. Please try again.');
        return;
      }

      console.log('[DRIVER] ✅ Order status updated to out_for_delivery:', result);
    } catch (err) {
      console.error('[DRIVER] ❌ Network error starting delivery:', err);
      alert('Network error. Please check your connection and try again.');
      return;
    }

    setOrder(prev => prev ? { ...prev, status: 'out_for_delivery' } : prev);
    setIsTracking(true);

    // Start GPS tracking
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          setDriverPos(newPos);
          latestPosRef.current = newPos;
        },
        (err) => {
          console.error('Geolocation error:', err);
          alert('GPS error: ' + err.message + '. Please enable location services.');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
      watchIdRef.current = watchId;

      // Push GPS coordinates via API every 5 seconds (bypasses RLS)
      updateIntervalRef.current = setInterval(async () => {
        if (latestPosRef.current) {
          try {
            await fetch('/api/driver-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                newStatus: 'out_for_delivery',
                driverLocation: {
                  lat: latestPosRef.current.lat,
                  lng: latestPosRef.current.lng,
                  timestamp: new Date().toISOString(),
                },
              }),
            });
          } catch (err) {
            console.error('[DRIVER] GPS update failed:', err);
          }
        }
      }, 5000);
    } else {
      alert('Your browser does not support GPS. Please use a modern mobile browser.');
    }
  };

  const markDelivered = async () => {
    if (!orderId) return;

    // Stop GPS tracking
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Update status to completed & clear driver_location via API (bypasses RLS)
    console.log('[DRIVER] Marking order as delivered:', orderId);

    try {
      const response = await fetch('/api/driver-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus: 'completed' }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[DRIVER] ❌ Failed to mark as delivered:', result);
        alert('Failed to update order status. Please try again.');
        return;
      }

      console.log('[DRIVER] ✅ Order marked as completed:', result);
    } catch (err) {
      console.error('[DRIVER] ❌ Network error marking delivered:', err);
      alert('Network error. Please check your connection and try again.');
      return;
    }

    setDelivered(true);
    setIsTracking(false);
    setOrder(prev => prev ? { ...prev, status: 'completed' } : prev);
  };

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 animate-pulse shadow-2xl shadow-orange-500/30">
          <Package size={28} className="text-white" />
        </div>
        <p className="text-gray-400 font-bold text-sm animate-pulse">Loading order...</p>
      </div>
    );
  }

  // ─── ERROR STATE ───
  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <span className="text-4xl">❌</span>
        </div>
        <h1 className="text-white text-xl font-black mb-2">Order Not Found</h1>
        <p className="text-gray-500 text-sm text-center">{error || 'This delivery link appears to be invalid.'}</p>
      </div>
    );
  }

  // ─── DELIVERED STATE ───
  if (delivered) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30 animate-bounce">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <h1 className="text-white text-2xl font-black mb-2 tracking-tight">Delivered! 🎉</h1>
        <p className="text-gray-500 text-sm text-center">Order #{orderId?.slice(0, 8)} has been marked as completed.</p>
        <p className="text-gray-600 text-xs mt-4">You can close this page now.</p>
      </div>
    );
  }

  const customerLoc = order.delivery_location;
  const mapCenter: [number, number] = driverPos 
    ? [driverPos.lat, driverPos.lng] 
    : customerLoc
      ? [(RESTAURANT_COORDS.lat + customerLoc.lat) / 2, (RESTAURANT_COORDS.lng + customerLoc.lng) / 2]
      : [RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng];

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col h-[100dvh] overflow-hidden">
      
      {/* ── Top Status Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-4 flex items-center justify-between pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl border border-gray-800 flex items-center gap-2.5 pointer-events-auto">
          <div className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400'}`}></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-white">
            {isTracking ? 'Live Tracking' : 'Ready to Deliver'}
          </span>
        </div>
        
        {order.user_phone && (
          <a 
            href={`tel:${order.user_phone}`} 
            className="bg-emerald-500 hover:bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 pointer-events-auto active:scale-90 transition-transform"
          >
            <Phone size={20} className="text-white" />
          </a>
        )}
      </div>

      {/* ── Map ── */}
      <div className="flex-1 w-full">
        <MapContainer 
          center={mapCenter} 
          zoom={14} 
          className="w-full h-full" 
          zoomControl={false}
          style={{ background: '#111827' }}
        >
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Restaurant marker */}
          <Marker position={[RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]}>
            <Popup>JK Restaurant 🍽️</Popup>
          </Marker>
          
          {/* Customer location */}
          {customerLoc && (
            <Marker position={[customerLoc.lat, customerLoc.lng]} icon={customerIcon}>
              <Popup>Customer: {order.user_name}</Popup>
            </Marker>
          )}
          
          {/* Driver position */}
          {driverPos && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon} zIndexOffset={1000}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          
          {/* Route line */}
          {driverPos && customerLoc && (
            <Polyline 
              positions={[[driverPos.lat, driverPos.lng], [customerLoc.lat, customerLoc.lng]]} 
              color="#10b981" 
              weight={3} 
              dashArray="8, 12" 
              opacity={0.7} 
            />
          )}
        </MapContainer>
      </div>

      {/* ── Bottom Sheet ── */}
      <div className="bg-gray-900 rounded-t-[2rem] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] p-5 z-[500] relative border-t border-gray-800">
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5"></div>
        
        {/* Order Summary */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-white text-lg font-black tracking-tight">
              Order #{orderId?.slice(0, 8)}
            </h2>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-0.5">
              {order.items.length} item{order.items.length > 1 ? 's' : ''} • ₹{order.total_amount}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${ 
            order.status === 'ready' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
            order.status === 'out_for_delivery' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
            'text-orange-400 bg-orange-500/10 border-orange-500/20'
          }`}>
            {order.status === 'ready' ? '🟢 Ready' : 
             order.status === 'out_for_delivery' ? '🚗 Delivering' :
             order.status}
          </div>
        </div>
        
        {/* Items List */}
        <div className="bg-gray-800/50 rounded-xl p-3 mb-4 border border-gray-800/80 max-h-24 overflow-y-auto">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-xs py-1">
              <span className="text-gray-300">
                <span className="font-black text-white mr-1">{item.quantity}x</span> {item.name}
              </span>
            </div>
          ))}
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-3 bg-gray-800/30 rounded-xl p-3 mb-5 border border-gray-800/50">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
            {order.user_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-white">{order.user_name}</h4>
            <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
              <MapPin size={10} /> {order.order_mode === 'delivery' ? 'Door Delivery' : 'Takeaway'}
            </p>
          </div>
          {order.user_phone && (
            <a 
              href={`tel:${order.user_phone}`} 
              className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 active:scale-90 transition-transform"
            >
              📞
            </a>
          )}
        </div>

        {/* Action Button */}
        {!isTracking ? (
          <button
            onClick={startDelivery}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-2xl shadow-orange-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <Navigation size={18} /> Start Delivery
          </button>
        ) : (
          <button
            onClick={markDelivered}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} /> Mark as Delivered
          </button>
        )}

        {isTracking && driverPos && (
          <p className="text-center text-gray-600 text-[10px] font-bold mt-3 uppercase tracking-widest">
            📍 GPS: {driverPos.lat.toFixed(5)}, {driverPos.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
};
