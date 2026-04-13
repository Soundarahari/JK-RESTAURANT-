import { ArrowLeft, Truck, MapPin, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ShippingPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Truck size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Shipping & Delivery</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 lg:p-8 space-y-6">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Updated: April 2026</p>

        {/* Service Area Highlight */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Service Area</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              We currently serve <strong>JKKN College Campus, JKKN Dental College, JKKN Educational Institutions</strong>, and surrounding areas within a <strong>5 km radius</strong> of JK Restaurant, Komarapalayam, Namakkal, Tamil Nadu.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">1. Delivery Area</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            JK Restaurant provides food delivery services <strong className="text-gray-900 dark:text-white">exclusively within the JKKN College Campus and nearby areas</strong> (approximately 5 km delivery radius). We currently do not offer long-distance or inter-city delivery services. Delivery is available to:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li>JKKN College Hostels (Boys & Girls)</li>
            <li>JKKN Campus Buildings</li>
            <li>JKKN Dental College</li>
            <li>Staff Quarters & Nearby Residential Areas</li>
            <li>Highway-facing locations within 5 km radius</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">2. Delivery Timings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-brand-500" />
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide">Estimated Time</p>
              </div>
              <p className="text-2xl font-black text-brand-500">20-30 min</p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">From order confirmation</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-brand-500" />
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide">Operating Hours</p>
              </div>
              <p className="text-2xl font-black text-brand-500">7AM - 10PM</p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">All days of the week</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Delivery times may vary during peak hours (12:00 PM – 2:00 PM and 7:00 PM – 9:00 PM) or during heavy rain/extreme weather conditions.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">3. Delivery Charges</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li><strong className="text-gray-900 dark:text-white">Within JKKN Campus:</strong> Free delivery on all orders.</li>
            <li><strong className="text-gray-900 dark:text-white">Within 5 km radius:</strong> A nominal delivery charge may apply based on distance and order value.</li>
            <li>Delivery charges, if applicable, will be clearly displayed at checkout before payment.</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">4. Order Tracking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Once your order is confirmed and dispatched, you can track its real-time status through the Platform. You will receive notifications at each stage — <strong className="text-gray-900 dark:text-white">Order Confirmed → Preparing → Out for Delivery → Delivered</strong>.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">5. Delivery Instructions</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li>Please ensure you provide an accurate delivery address and contact number.</li>
            <li>Our delivery rider will contact you upon arrival.</li>
            <li>If you are not available at the delivery location, the rider will wait for up to <strong className="text-gray-900 dark:text-white">10 minutes</strong>. After that, the order may be marked as undelivered, and no refund will be applicable.</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">6. Pickup Option</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Customers also have the option of <strong className="text-gray-900 dark:text-white">self-pickup</strong> from JK Restaurant. Simply select the "Pickup" option while placing your order. Pickup orders typically have a shorter preparation time.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">7. Contact for Delivery Issues</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            For any delivery-related queries or issues, please reach out to us via our <Link to="/contact" className="text-brand-500 font-bold hover:underline">Contact Us</Link> page or call us directly.
          </p>
        </section>
      </div>
    </div>
  );
};
