import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Clock, MapPin, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import { RESTAURANT_COORDS } from '../utils/geo';
import { supabase } from '../lib/supabase';

// Fix leaflet icon issue natively
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // delivery bike
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders } = useStore();
  const [localOrder, setLocalOrder] = useState<any>(orders.find(o => o.id === orderId) || null);
  
  const order = localOrder;
  const userLoc = order?.delivery_location;

  // Real-time driver position from Supabase
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number }>({ lat: RESTAURANT_COORDS.lat, lng: RESTAURANT_COORDS.lng });
  const [hasRealGPS, setHasRealGPS] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>(order?.status || 'pending');
  
  // Keep orderStatus reactive to internal order changes
  useEffect(() => {
    if (order?.status) {
      setOrderStatus(order.status);
    }
  }, [order?.status]);
  
  // Simulated progress for fallback (when no real GPS)
  const [simProgressPercent, setSimProgressPercent] = useState(0);

  // Subscribe to real-time Supabase changes for driver_location
  useEffect(() => {
    if (!orderId) return;

    // Fetch full order to ensure UI has data if store is empty
    const fetchFullOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (!error && data) {
        setLocalOrder(data);
        setOrderStatus(data.status);
        if (data.driver_location?.lat && data.driver_location?.lng) {
          setDriverPos({ lat: data.driver_location.lat, lng: data.driver_location.lng });
          setHasRealGPS(true);
        }
      }
    };
    
    // Poll as fallback every 5 seconds if not completed
    const pollInterval = setInterval(() => {
      if (orderStatus !== 'completed' && orderStatus !== 'cancelled') {
        fetchFullOrder();
      }
    }, 5000);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          const newData = payload.new;
          console.log('🔔 Realtime Update Received:', newData.status);
          
          // Update driver position from real GPS
          if (newData.driver_location?.lat && newData.driver_location?.lng) {
            setDriverPos({
              lat: newData.driver_location.lat,
              lng: newData.driver_location.lng,
            });
            setHasRealGPS(true);
          }
          
          // Update order status
          if (newData.status) {
            setOrderStatus(newData.status);
            // Also update localOrder to keep everything in sync
            setLocalOrder((prev: any) => prev ? { ...prev, status: newData.status } : newData);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription Status:', status);
      });

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [orderId, orderStatus]);

  // Fallback simulation if no real GPS data (simulates movement from restaurant to user)
  useEffect(() => {
    if (hasRealGPS || !userLoc) return;

    let p = 0;
    const interval = setInterval(() => {
      p += 0.01;
      if (p >= 1) {
        p = 1;
        clearInterval(interval);
      }
      
      const newLat = RESTAURANT_COORDS.lat + (userLoc.lat - RESTAURANT_COORDS.lat) * p;
      const newLng = RESTAURANT_COORDS.lng + (userLoc.lng - RESTAURANT_COORDS.lng) * p;
      
      setDriverPos({ lat: newLat, lng: newLng });
      setSimProgressPercent(Math.floor(p * 100));
    }, 200);

    return () => clearInterval(interval);
  }, [userLoc, hasRealGPS]);

  // Calculate progress from real GPS data
  const progressPercent = (() => {
    if (!hasRealGPS) return simProgressPercent;
    if (!userLoc) return 0;
    if (orderStatus === 'completed') return 100;
    if (orderStatus === 'pending' || orderStatus === 'preparing' || orderStatus === 'ready') return 0;
    
    // Calculate based on distance
    const totalDist = Math.sqrt(
      Math.pow(userLoc.lat - RESTAURANT_COORDS.lat, 2) + Math.pow(userLoc.lng - RESTAURANT_COORDS.lng, 2)
    );
    const coveredDist = Math.sqrt(
      Math.pow(driverPos.lat - RESTAURANT_COORDS.lat, 2) + Math.pow(driverPos.lng - RESTAURANT_COORDS.lng, 2)
    );
    
    if (totalDist === 0) return 100;
    return Math.min(100, Math.floor((coveredDist / totalDist) * 100));
  })();

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-xl font-black">Order not found</h2>
        <button onClick={() => navigate('/profile')} className="mt-4 px-6 py-2 bg-brand-500 text-white rounded-full">Go Back</button>
      </div>
    );
  }

  const center: [number, number] = userLoc 
    ? [(RESTAURANT_COORDS.lat + userLoc.lat) / 2, (RESTAURANT_COORDS.lng + userLoc.lng) / 2]
    : [RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng];

  const remainingMins = Math.max(1, Math.round(15 * (1 - (progressPercent / 100))));
  
  const driverStatusText = (() => {
    if (orderStatus === 'pending') return 'Order received';
    if (orderStatus === 'preparing') return 'Being prepared 👨‍🍳';
    if (orderStatus === 'ready') return 'Ready for pickup';
    if (orderStatus === 'completed') return 'Delivered!';
    // out_for_delivery
    if (progressPercent < 5) return "Picking up your order";
    if (progressPercent < 90) return "On the way";
    if (progressPercent < 100) return "Arriving now!";
    return "Delivered!";
  })();

  const getStatusBadge = () => {
    if (orderStatus === 'pending') return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500', label: 'Received' };
    if (orderStatus === 'preparing') return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', label: 'Preparing' };
    if (orderStatus === 'ready') return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500', label: 'Ready' };
    if (orderStatus === 'out_for_delivery') return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', label: 'Live GPS' };
    return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500', label: 'Arrived' };
  };

  const badge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 flex items-center justify-between pointer-events-none">
         <button onClick={() => navigate('/profile')} className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center text-gray-900 dark:text-white pointer-events-auto border border-gray-100 dark:border-gray-800 hover:bg-gray-50 active:scale-95 transition-all">
           <ArrowLeft size={24} />
         </button>
         
         <div className="flex items-center gap-2 pointer-events-auto">
           <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2">
             {orderStatus === 'out_for_delivery' ? (
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             ) : orderStatus === 'completed' ? (
               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             ) : (
               <div className={`w-2 h-2 rounded-full ${badge.bg} ${orderStatus !== 'completed' ? 'animate-pulse' : ''}`}></div>
             )}
             <span className={`text-xs font-black uppercase tracking-widest ${badge.color}`}>
               {badge.label}
             </span>
           </div>

           <button 
             onClick={() => window.location.reload()}
             className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
           >
             <RefreshCw size={20} />
           </button>
         </div>
      </div>

      {/* Map Segment */}
      <div className="flex-1 w-full bg-gray-100 z-0">
        <MapContainer center={center} zoom={userLoc ? 14 : 15} className="w-full h-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]}>
             <Popup>JK Restaurant</Popup>
          </Marker>
          
          {userLoc && (
            <>
              <Marker position={[userLoc.lat, userLoc.lng]}>
                <Popup>Your Location</Popup>
              </Marker>
              
              {(orderStatus === 'out_for_delivery' || hasRealGPS) && (
                <Marker position={[driverPos.lat, driverPos.lng]} icon={deliveryIcon} zIndexOffset={1000}>
                  <Popup>{hasRealGPS ? 'Driver (Live GPS)' : 'Driver is on the way'}</Popup>
                </Marker>
              )}
              
              <Polyline positions={[
                [RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng], 
                [userLoc.lat, userLoc.lng]
              ]} color="#10b981" weight={4} dashArray="10, 10" />
            </>
          )}
        </MapContainer>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-white dark:bg-gray-900 rounded-t-[2.5rem] shadow-[0_-15px_50px_rgba(0,0,0,0.15)] p-6 z-[400] relative border-t border-gray-100 dark:border-gray-800">
         <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6"></div>
         
         <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="text-[22px] font-black text-gray-900 dark:text-white tracking-tight">{driverStatusText}</h3>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
               {orderStatus === 'out_for_delivery' && progressPercent < 100 
                 ? `Arriving in ~${remainingMins} mins${hasRealGPS ? ' • Live' : ''}`
                 : orderStatus === 'completed' 
                   ? 'Order has reached your location'
                   : orderStatus === 'pending'
                     ? 'Waiting for kitchen confirmation'
                     : orderStatus === 'preparing'
                       ? 'Kitchen is preparing your order'
                       : orderStatus === 'ready'
                         ? 'Waiting for driver pickup'
                         : 'Order has reached your location'
               }
             </p>
           </div>
           
           <div className={`w-14 h-14 gap-1 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner ${
             orderStatus === 'completed' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
             orderStatus === 'out_for_delivery' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-500' :
             'bg-gray-50 dark:bg-gray-800 text-gray-400'
           }`}>
             {orderStatus === 'out_for_delivery' ? <Clock size={20} className="animate-pulse" /> : <MapPin size={20} />}
             <span className="text-[10px] uppercase">
               {orderStatus === 'out_for_delivery' ? `${remainingMins}m` : 
                orderStatus === 'completed' ? 'Done' : '—'}
             </span>
           </div>
         </div>

         {/* Progress bar line */}
         <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mb-6 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-[200ms] ease-linear ${
                orderStatus === 'completed' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                orderStatus === 'out_for_delivery' ? 'bg-gradient-to-r from-brand-400 to-brand-600' :
                'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'
              }`} 
              style={{ width: `${
                orderStatus === 'pending' ? 10 :
                orderStatus === 'preparing' ? 30 :
                orderStatus === 'ready' ? 50 :
                orderStatus === 'completed' ? 100 :
                Math.max(55, progressPercent)
              }%` }}
            ></div>
         </div>

         {/* Status Steps */}
         <div className="flex justify-between mb-6 px-1">
           {[
             { key: 'pending', label: 'Received', emoji: '📋' },
             { key: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
             { key: 'ready', label: 'Ready', emoji: '✅' },
             { key: 'out_for_delivery', label: 'On Way', emoji: '🚗' },
             { key: 'completed', label: 'Done', emoji: '🎉' },
           ].map((step) => {
             const steps = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];
             const currentIdx = steps.indexOf(orderStatus);
             const stepIdx = steps.indexOf(step.key);
             const isActive = stepIdx <= currentIdx;
             
             return (
               <div key={step.key} className="flex flex-col items-center gap-1">
                 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                   isActive ? 'bg-brand-100 dark:bg-brand-900/30 scale-110' : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                 }`}>
                   {step.emoji}
                 </div>
                 <span className={`text-[9px] font-bold uppercase tracking-wider ${
                   isActive ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                 }`}>{step.label}</span>
               </div>
             );
           })}
         </div>

         <div className="flex bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl mb-2 items-center gap-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow border-2 border-brand-100 flex items-center justify-center font-black text-brand-600 text-lg">
              S
            </div>
            <div className="flex-1">
               <h4 className="font-black text-sm text-gray-900 dark:text-white tracking-tight">Surya (Delivery)</h4>
               <p className="text-[11px] text-gray-500 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-widest">
                 <span className={`w-1.5 h-1.5 rounded-full inline-block mr-0.5 ${hasRealGPS ? 'bg-emerald-500 animate-pulse' : 'bg-brand-500'}`}></span> 
                 {hasRealGPS ? 'GPS Connected' : 'Verified Partner'}
               </p>
            </div>
            <a href="tel:+919876543210" className="w-12 h-12 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-full flex items-center justify-center text-xl shadow-sm transition-colors active:scale-95">
               📞
            </a>
         </div>
      </div>
    </div>
  );
};
