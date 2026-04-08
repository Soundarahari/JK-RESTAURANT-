import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Clock, RefreshCw, FileText, ChefHat, ShoppingBag, Bike, CheckCircle2, Phone, Star } from 'lucide-react';
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
    if (order?.order_mode === 'takeaway') {
      if (orderStatus === 'pending') return 'Order received';
      if (orderStatus === 'preparing') return 'Being prepared 👨‍🍳';
      if (orderStatus === 'ready') return 'Ready for pickup!';
      if (orderStatus === 'completed') return 'Order picked up!';
    }
    if (orderStatus === 'pending') return 'Order received';
    if (orderStatus === 'preparing') return 'Being prepared 👨‍🍳';
    if (orderStatus === 'ready') return 'Ready for driver pickup';
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
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-950 flex flex-col h-[100dvh] overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 flex items-center justify-between pointer-events-none">
         <button onClick={() => navigate('/profile')} className="w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-lg flex items-center justify-center text-gray-900 dark:text-white pointer-events-auto border border-white/20 hover:scale-105 active:scale-95 transition-all">
           <ArrowLeft size={22} />
         </button>
         
         <div className="flex items-center gap-2 pointer-events-auto">
           <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-lg border border-white/20 flex items-center gap-2.5">
             {orderStatus === 'out_for_delivery' ? (
               <div className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </div>
             ) : orderStatus === 'completed' ? (
               <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
             ) : (
               <div className={`w-2.5 h-2.5 rounded-full ${badge.bg} ${orderStatus !== 'completed' ? 'animate-pulse' : ''}`}></div>
             )}
             <span className={`text-[10px] font-black uppercase tracking-widest ${badge.color}`}>
               {badge.label}
             </span>
           </div>

           <button 
             onClick={() => window.location.reload()}
             className="w-12 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-lg flex items-center justify-center text-gray-900 dark:text-white border border-white/20 hover:scale-105 active:scale-95 transition-all"
           >
             <RefreshCw size={20} />
           </button>
         </div>
      </div>

      {/* Map Segment with Gradient Fade */}
      <div className="flex-1 w-full bg-gray-100 z-0 relative">
        <MapContainer center={center} zoom={userLoc ? 14 : 15} className="w-full h-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]}>
             <Popup>JK Restaurant</Popup>
          </Marker>
          
          {userLoc && (
            <>
              {order?.order_mode !== 'takeaway' && (
                <Marker position={[userLoc.lat, userLoc.lng]}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
              
              {order?.order_mode !== 'takeaway' && (orderStatus === 'out_for_delivery' || hasRealGPS) && (
                <Marker position={[driverPos.lat, driverPos.lng]} icon={deliveryIcon} zIndexOffset={1000}>
                  <Popup>{hasRealGPS ? 'Driver (Live GPS)' : 'Driver is on the way'}</Popup>
                </Marker>
              )}
              
              {order?.order_mode !== 'takeaway' && (
                <Polyline positions={[
                  [RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng], 
                  [userLoc.lat, userLoc.lng]
                ]} color="#10b981" weight={4} dashArray="10, 10" />
              )}
            </>
          )}
        </MapContainer>
        {/* Soft gradient fading into the bottom sheet */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent pointer-events-none z-[300]"></div>
      </div>

      {/* Bottom Sheet - Premium Design */}
      <div className="bg-gray-50 dark:bg-gray-950 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] p-6 z-[400] relative border-t border-white/50 dark:border-gray-800">
         <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-800 rounded-full mx-auto mb-6"></div>
         
         <div className="flex justify-between items-start mb-6">
           <div className="flex-1 pr-4">
             <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">{driverStatusText}</h3>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
               {order?.order_mode === 'takeaway'
                 ? (orderStatus === 'completed' ? 'ORDER WAS PICKED UP' :
                    orderStatus === 'ready' ? 'READY AT RESTAURANT FOR PICKUP' :
                    orderStatus === 'preparing' ? 'CHEFS ARE CRAFTING YOUR MEAL' : 'WAITING FOR KITCHEN CONFIRMATION')
                 : (orderStatus === 'out_for_delivery' && progressPercent < 100 
                   ? <><span className="text-emerald-500 flex items-center gap-1"><Clock size={12} className="animate-pulse" /> ~{remainingMins} MINS</span> {hasRealGPS ? ' • LIVE GPS' : ''}</>
                   : orderStatus === 'completed' 
                     ? 'ORDER SUCCESSFULLY DELIVERED'
                     : orderStatus === 'pending'
                       ? 'WAITING FOR KITCHEN CONFIRMATION'
                       : orderStatus === 'preparing'
                         ? 'CHEFS ARE CRAFTING YOUR MEAL'
                         : orderStatus === 'ready'
                           ? 'WAITING FOR DRIVER PICKUP'
                           : 'ORDER DELIVERED')
               }
             </p>
           </div>
           
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-500 flex-shrink-0 ${
             orderStatus === 'completed' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
             orderStatus === 'out_for_delivery' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' :
             'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400'
           }`}>
             {orderStatus === 'out_for_delivery' ? <Bike size={24} className="animate-bounce" /> :
              orderStatus === 'completed' ? <CheckCircle2 size={24} /> :
              <Clock size={24} />}
           </div>
         </div>

         {/* Premium Progress Engine */}
         <div className="relative mb-8 mt-4 mx-2">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-in-out rounded-full ${
                 orderStatus === 'completed' ? 'bg-blue-500' :
                 'bg-gradient-to-r from-brand-400 via-brand-500 to-emerald-500'
                }`}
                style={{ width: `${
                  order?.order_mode === 'takeaway' 
                    ? (orderStatus === 'pending' ? 20 : orderStatus === 'preparing' ? 60 : 100)
                    : (orderStatus === 'pending' ? 10 :
                       orderStatus === 'preparing' ? 30 :
                       orderStatus === 'ready' ? 50 :
                       orderStatus === 'completed' ? 100 :
                       Math.max(55, progressPercent))
                }%` }}
              >
                  <div className="w-full h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>

            {/* Step Icons along the track */}
            <div className="relative flex justify-between z-10 w-[calc(100%+8px)] -ml-[4px]">
              {(order?.order_mode === 'takeaway' ? [
                { key: 'pending', Icon: FileText, label: 'Rx' },
                { key: 'preparing', Icon: ChefHat, label: 'Kitchen' },
                { key: 'ready', Icon: ShoppingBag, label: 'Ready' },
                { key: 'completed', Icon: CheckCircle2, label: 'Picked Up' },
              ] : [
                { key: 'pending', Icon: FileText, label: 'Rx' },
                { key: 'preparing', Icon: ChefHat, label: 'Kitchen' },
                { key: 'ready', Icon: ShoppingBag, label: 'Ready' },
                { key: 'out_for_delivery', Icon: Bike, label: 'On Way' },
                { key: 'completed', Icon: CheckCircle2, label: 'Done' },
              ]).map((step, _, arr) => {
                const steps = arr.map(s => s.key);
                const currentIdx = steps.indexOf(orderStatus);
                const stepIdx = steps.indexOf(step.key);
                const isActive = stepIdx <= currentIdx;
                const isCurrent = stepIdx === currentIdx;
                
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1.5 transform transition-all duration-300">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                      isActive 
                        ? (isCurrent ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-110' : 'bg-brand-500 text-white') 
                        : 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-400'
                    }`}>
                      <step.Icon size={14} strokeWidth={isCurrent ? 3 : 2} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider absolute -bottom-5 ${
                      isCurrent ? 'text-brand-600 dark:text-brand-400 text-[10px]' : 
                      isActive ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                    }`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
         </div>

         {/* Driver Card Premium UI */}
         {order?.order_mode !== 'takeaway' && orderStatus !== 'pending' && orderStatus !== 'preparing' && (
           <div className="flex bg-white dark:bg-gray-900 p-4 rounded-3xl items-center gap-4 border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 animate-in slide-in-from-bottom-4 mt-8 lg:mt-4">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${orderStatus === 'out_for_delivery' ? 'bg-emerald-400 animate-ping opacity-20' : ''}`}></div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm relative z-10 bg-gray-100">
                  <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150" alt="Driver" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 z-20 shadow-sm border border-gray-100">
                   <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle2 size={8} strokeWidth={4} />
                   </div>
                </div>
              </div>
              <div className="flex-1">
                 <h4 className="font-black text-sm text-gray-900 dark:text-white tracking-tight">Surya Kumar</h4>
                 <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 mt-0.5 uppercase tracking-widest">
                   <span className="flex items-center text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1 rounded"><Star size={8} fill="currentColor" className="mr-0.5" /> 4.9</span> 
                   {hasRealGPS ? <span className="text-emerald-500">Live GPS</span> : 'Verified Partner'}
                 </p>
              </div>
              <div className="flex gap-2">
                <a href="tel:+919876543210" className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-95">
                   <Phone size={14} fill="currentColor" />
                </a>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
