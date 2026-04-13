import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const ContactUs = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Construct mailto link as fallback
    const mailtoLink = `mailto:jkrestaurant.orders@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.open(mailtoLink, '_blank');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
            <MessageCircle size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Contact Us</h1>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="mailto:jkrestaurant.orders@gmail.com" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group active:scale-[0.98]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Email Us</p>
              <p className="text-sm font-black text-gray-900 dark:text-white break-all">jkrestaurant.orders@gmail.com</p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">We reply within 24 hours</p>
            </div>
          </a>

          <a href="tel:+919876543210" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group active:scale-[0.98]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform">
              <Phone size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Call Us</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">+91 98765 43210</p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Available during operating hours</p>
            </div>
          </a>

          <a href="https://maps.google.com/?q=JKKN+College+Komarapalayam" target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group active:scale-[0.98]">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Visit Us</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">JK Restaurant</p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium leading-relaxed">Near JKKN College, Komarapalayam,<br />Namakkal, Tamil Nadu - 638183</p>
            </div>
          </a>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shrink-0">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Working Hours</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">7:00 AM – 10:00 PM</p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Open all days of the week</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 lg:p-8">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide mb-5 flex items-center gap-2">
            <Send size={14} className="text-brand-500" /> Send us a Message
          </h2>

          {submitted ? (
            <div className="text-center py-10 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-base font-black text-gray-900 dark:text-white">Message Sent!</p>
              <p className="text-sm text-gray-500 mt-1">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Your Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Subject</label>
                <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                  placeholder="e.g., Order Issue, Feedback, Query"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Message</label>
                <textarea required rows={4} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all resize-none"
                  placeholder="Describe your query in detail..."
                />
              </div>
              <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2">
                <Send size={14} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
