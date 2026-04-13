import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-md">
            <FileText size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Terms & Conditions</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 lg:p-8 space-y-6">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last Updated: April 2026</p>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">1. Introduction</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Welcome to <strong className="text-gray-900 dark:text-white">JK Restaurant</strong> ("we", "us", "our"). By accessing or using our website and mobile application (the "Platform"), you agree to be bound by these Terms & Conditions. JK Restaurant operates as an <strong className="text-gray-900 dark:text-white">intermediary platform</strong> that connects students, staff, and visitors of JKKN Educational Institutions and nearby areas with our in-house kitchen and food preparation services.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">2. Nature of Service</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            JK Restaurant acts as an <strong className="text-gray-900 dark:text-white">intermediary between the customer (student/visitor) and the restaurant kitchen</strong>. We facilitate the ordering, payment, and delivery of food items. The Platform enables users to browse the menu, place orders, make payments, and track delivery status.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">3. Eligibility</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            You must be at least 16 years of age to use this Platform. By using the Platform, you represent and warrant that you have the legal capacity to enter into a binding agreement. Students of JKKN Educational Institutions may avail special student pricing upon verification.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">4. Ordering & Payment</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2 list-disc list-inside">
            <li>All orders placed through the Platform are subject to availability and confirmation.</li>
            <li>Prices displayed on the Platform are in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
            <li>Payments are processed securely through <strong className="text-gray-900 dark:text-white">Razorpay</strong>, our authorized payment gateway partner.</li>
            <li>We accept UPI, Debit/Credit Cards, Net Banking, and supported digital wallets.</li>
            <li>An order is confirmed only after successful payment processing.</li>
          </ul>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">5. User Accounts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Users may sign in using Google authentication. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate and complete information during registration.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">6. Intellectual Property</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            All content on the Platform, including text, images, logos, and design elements, is the property of JK Restaurant and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">7. Limitation of Liability</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            JK Restaurant shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Platform. Our total liability shall not exceed the amount paid by the user for the specific order in question.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">8. Modifications</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting on the Platform. Continued use of the Platform after any changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">9. Governing Law</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in Namakkal, Tamil Nadu.
          </p>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        <section className="space-y-3">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">10. Contact</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            For any questions about these Terms & Conditions, please visit our <Link to="/contact" className="text-brand-500 font-bold hover:underline">Contact Us</Link> page.
          </p>
        </section>
      </div>
    </div>
  );
};
