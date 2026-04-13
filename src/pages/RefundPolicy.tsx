import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
            <RotateCcw size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Refund & Cancellation</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 lg:p-8 space-y-6">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Updated: April 2026</p>

        {/* Important Notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
            Since we prepare fresh food for each order, refund eligibility depends on the stage of order processing. Please read the policy carefully before placing your order.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">1. Cancellation Policy</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/10 rounded-xl p-3.5 border border-green-100 dark:border-green-900/30">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">Full Refund</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Order cancelled <strong>before the restaurant starts preparing</strong> the food (within 2 minutes of placing the order).</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3.5 border border-amber-100 dark:border-amber-900/30">
              <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Partial Refund (50%)</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Order cancelled <strong>after preparation has started</strong> but before dispatch.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/10 rounded-xl p-3.5 border border-red-100 dark:border-red-900/30">
              <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800 dark:text-red-300">No Refund</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">Order cancelled <strong>after food has been dispatched</strong> or delivered. No refunds once the delivery rider has picked up the order.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">2. Refund Eligibility</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Refunds may be initiated in the following scenarios:</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li><strong className="text-gray-900 dark:text-white">Wrong item delivered:</strong> If you receive an item that you did not order, a full refund or replacement will be provided.</li>
            <li><strong className="text-gray-900 dark:text-white">Quality issues:</strong> If the food is spoiled, stale, or significantly different from the description, a full refund will be processed after verification.</li>
            <li><strong className="text-gray-900 dark:text-white">Missing items:</strong> If any item from your order is missing, a refund for the specific item will be provided.</li>
            <li><strong className="text-gray-900 dark:text-white">Payment failure:</strong> If the amount was debited but the order was not placed due to a technical issue, a full refund will be initiated automatically.</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">3. Refund Process</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li>Refund requests must be raised within <strong className="text-gray-900 dark:text-white">24 hours</strong> of order delivery.</li>
            <li>You can contact us through the <Link to="/contact" className="text-brand-500 font-bold hover:underline">Contact Us</Link> page with your Order ID and issue description.</li>
            <li>Refund requests with photographic evidence (for quality/wrong item issues) will be processed faster.</li>
            <li>All approved refunds will be credited back to the <strong className="text-gray-900 dark:text-white">original payment method</strong> within <strong className="text-gray-900 dark:text-white">5-7 business days</strong>.</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">4. Non-Refundable Scenarios</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li>Change of mind after food preparation has begun.</li>
            <li>Incorrect delivery address provided by the customer.</li>
            <li>Customer not available at the delivery location despite multiple contact attempts.</li>
            <li>Natural taste preferences or subjective complaints about food taste (unless spoiled or stale).</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">5. Contact for Refunds</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            For any refund or cancellation queries, please reach out to us via our <Link to="/contact" className="text-brand-500 font-bold hover:underline">Contact Us</Link> page. We aim to resolve all refund requests within 48 hours.
          </p>
        </section>
      </div>
    </div>
  );
};
