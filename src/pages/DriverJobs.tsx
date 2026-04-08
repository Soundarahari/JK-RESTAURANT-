import { useEffect, useState } from 'react';
import { useStore, Order } from '../store';
import { supabase } from '../lib/supabase';
import { Package, MapPin, ChevronRight, Navigation, Loader2, Bike } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DriverJobs = () => {
  const { user, acceptJob } = useStore();
  const [jobs, setJobs] = useState<Order[]>([]);
  const [ongoingJobs, setOngoingJobs] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing'>('available');
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch Available Jobs
    const { data: availData, error: availError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'ready')
      .eq('order_mode', 'delivery')
      .order('created_at', { ascending: false });

    // Fetch Ongoing Jobs for THIS driver
    const { data: ongoingData, error: ongoingError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'out_for_delivery')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false });

    if (!availError && availData) setJobs(availData as Order[]);
    if (!ongoingError && ongoingData) setOngoingJobs(ongoingData as Order[]);
    
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.is_driver) {
      if (user) navigate('/');
      return;
    }

    fetchJobs();

    // Subscribe to all order status changes to keep the board fresh
    const channel = supabase
      .channel('driver-board')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    const result = await acceptJob(orderId);
    if (result.success) {
      // Refresh and switch to ongoing
      await fetchJobs();
      setActiveTab('ongoing');
      // Optional: auto-navigate to map? 
      // navigate(`/driver/${orderId}`); 
    } else {
      alert(result.error || 'Failed to accept job');
      fetchJobs();
    }
    setAcceptingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-500 mb-4" size={32} />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Finding available jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-24 animate-in fade-in duration-500 px-4 pt-4">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Driver Jobs</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Manage your active and available deliveries.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
        <button 
          onClick={() => setActiveTab('available')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all ${
            activeTab === 'available' 
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' 
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Package size={14} /> Available ({jobs.length})
        </button>
        <button 
          onClick={() => setActiveTab('ongoing')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all ${
            activeTab === 'ongoing' 
              ? 'bg-emerald-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Bike size={14} /> Ongoing ({ongoingJobs.length})
        </button>
      </div>

      {activeTab === 'available' ? (
        jobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">No Jobs Available</h3>
            <p className="text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-2 max-w-[200px] mx-auto leading-relaxed">
              New orders will appear here automatically as they are ready.
            </p>
            <button 
              onClick={fetchJobs}
              className="mt-8 text-brand-600 dark:text-brand-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              <Navigation size={14} className="rotate-45" /> Refresh Board
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div 
                key={job.id} 
                className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:border-brand-200 dark:hover:border-brand-900/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">READY</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{job.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase tracking-tight">{job.user_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                    <p className="text-xl font-black text-brand-600 dark:text-brand-400 tracking-tighter">₹{job.total_amount}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-brand-500 shadow-sm mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">
                      {job.delivery_address || 'Address not specified'}
                    </p>
                  </div>
                </div>

                <button
                  disabled={acceptingId === job.id}
                  onClick={() => handleAccept(job.id)}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {acceptingId === job.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      ACCEPT JOB <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        ongoingJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Bike size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">No Active Jobs</h3>
            <p className="text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-2 max-w-[200px] mx-auto leading-relaxed">
              Accept an available job to see it here and start delivery.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ongoingJobs.map(job => (
              <div 
                key={job.id} 
                className="bg-white dark:bg-gray-900 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 p-6 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/50">ONGOING</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{job.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase tracking-tight">{job.user_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                    <p className="text-xl font-black text-brand-600 dark:text-brand-400 tracking-tighter">₹{job.total_amount}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm mt-0.5">
                    <Navigation size={16} className="rotate-45" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">
                      {job.delivery_address || 'Address not specified'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/driver/${job.id}`)}
                  className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  RESUME TRACKING <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {user?.is_driver && (
        <div className="mt-12 p-6 bg-brand-500 rounded-[2.5rem] text-white flex items-center gap-4 overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
             <Navigation size={120} className="rotate-45" />
          </div>
          <div className="relative z-10">
            <h4 className="font-black uppercase tracking-tighter text-xl leading-none mb-1">Safe Travels!</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Check order details before leaving</p>
          </div>
        </div>
      )}
    </div>
  );
};
