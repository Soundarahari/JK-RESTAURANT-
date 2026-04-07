import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import L from 'leaflet';
import { RESTAURANT_COORDS } from '../utils/geo';

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
  
  const order = orders.find(o => o.id === orderId);
  const userLoc = order?.delivery_location;

  const [driverPos, setDriverPos] = useState({ lat: RESTAURANT_COORDS.lat, lng: RESTAURANT_COORDS.lng });
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!userLoc) return;

    // A smoother simulation where the marker moves from Restaurant to User location
    let p = 0;
    const interval = setInterval(() => {
      p += 0.01; // 1% per tick
      if (p >= 1) {
        p = 1;
        clearInterval(interval);
      }
      
      const newLat = RESTAURANT_COORDS.lat + (userLoc.lat - RESTAURANT_COORDS.lat) * p;
      const newLng = RESTAURANT_COORDS.lng + (userLoc.lng - RESTAURANT_COORDS.lng) * p;
      
      setDriverPos({ lat: newLat, lng: newLng });
      setProgressPercent(Math.floor(p * 100));
    }, 200); // 5 updates per second

    return () => clearInterval(interval);
  }, [userLoc]);

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
  const driverStatusText = progressPercent < 5 ? "Picking up your order" : progressPercent < 90 ? "On the way" : progressPercent < 100 ? "Arriving now!" : "Delivered!";

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 flex items-center justify-between pointer-events-none">
         <button onClick={() => navigate('/profile')} className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex items-center justify-center text-gray-900 dark:text-white pointer-events-auto border border-gray-100 dark:border-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
           <ArrowLeft size={24} />
         </button>
         
         <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2 pointer-events-auto">
           {progressPercent < 100 ? (
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           ) : (
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
           )}
           <span className={`text-xs font-black uppercase tracking-widest ${progressPercent < 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
             {progressPercent < 100 ? 'Live GPS' : 'Arrived'}
           </span>
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
              
              <Marker position={[driverPos.lat, driverPos.lng]} icon={deliveryIcon} zIndexOffset={1000}>
                <Popup>Driver is on the way</Popup>
              </Marker>
              
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
               {progressPercent < 100 ? `Arriving in ~${remainingMins} mins` : 'Order has reached your location'}
             </p>
           </div>
           
           <div className={`w-14 h-14 gap-1 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner ${progressPercent < 100 ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
             {progressPercent < 100 ? <Clock size={20} className="animate-pulse" /> : <MapPin size={20} />}
             <span className="text-[10px] uppercase">{progressPercent < 100 ? `${remainingMins}m` : 'Done'}</span>
           </div>
         </div>

         {/* Progress bar line */}
         <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full transition-all duration-[200ms] ease-linear" style={{ width: `${progressPercent}%` }}></div>
         </div>

         <div className="flex bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl mb-2 items-center gap-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full shadow border-2 border-brand-100 flex items-center justify-center font-black text-brand-600 text-lg">
              S
            </div>
            <div className="flex-1">
               <h4 className="font-black text-sm text-gray-900 dark:text-white tracking-tight">Surya (Delivery)</h4>
               <p className="text-[11px] text-gray-500 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-brand-500 rounded-full inline-block mr-0.5"></span> Verified Partner</p>
            </div>
            <a href="tel:+919876543210" className="w-12 h-12 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-full flex items-center justify-center text-xl shadow-sm transition-colors active:scale-95">
               📞
            </a>
         </div>
      </div>
    </div>
  );
};
